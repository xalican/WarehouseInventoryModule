using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DepoStok.Domain;
using DepoStok.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DepoStok.Application
{
    public class StokService
    {
        private readonly AppDbContext _context;

        public StokService(AppDbContext context)
        {
            _context = context;
        }

        // 1. HIGH-PERFORMANCE OPTIMIZED STOK DURUM (Fast Dictionary Map + No Tracking)
        public async Task<PagedResult<StokDurumDto>> GetStokDurumPagedAsync(int? depoId, int? malzemeGrubuId, string? aramaMetni, bool? sadeceKritik, int page = 1, int pageSize = 10)
        {
            var malzemelerQuery = _context.Malzemeler
                .AsNoTracking()
                .Include(m => m.MalzemeGrubu)
                .Where(m => m.IsActive)
                .AsQueryable();

            if (malzemeGrubuId.HasValue)
                malzemelerQuery = malzemelerQuery.Where(m => m.MalzemeGrubuId == malzemeGrubuId.Value);

            if (!string.IsNullOrWhiteSpace(aramaMetni) && aramaMetni.Trim().Length >= 3)
            {
                var text = aramaMetni.Trim().ToLower();
                malzemelerQuery = malzemelerQuery.Where(m => m.Kod.ToLower().Contains(text) || m.Ad.ToLower().Contains(text));
            }

            var malzemeler = await malzemelerQuery.ToListAsync();

            var depolarQuery = _context.Depolar.AsNoTracking().Where(d => d.IsActive).AsQueryable();
            if (depoId.HasValue)
                depolarQuery = depolarQuery.Where(d => d.Id == depoId.Value);

            var depolar = await depolarQuery.ToListAsync();

            // FAST PRE-AGGREGATION DICTIONARY MAPS
            var girislerQuery = _context.HareketKalemleri
                .AsNoTracking()
                .Where(k => !k.HareketBaslik!.IsIptal && k.HareketBaslik.HedefDepoId.HasValue);

            if (depoId.HasValue)
                girislerQuery = girislerQuery.Where(k => k.HareketBaslik!.HedefDepoId == depoId.Value);

            var girisler = await girislerQuery
                .GroupBy(k => new { k.MalzemeId, DepoId = k.HareketBaslik!.HedefDepoId!.Value })
                .Select(g => new { g.Key.MalzemeId, g.Key.DepoId, Toplam = g.Sum(x => x.Miktar) })
                .ToDictionaryAsync(x => (x.MalzemeId, x.DepoId), x => x.Toplam);

            var cikislarQuery = _context.HareketKalemleri
                .AsNoTracking()
                .Where(k => !k.HareketBaslik!.IsIptal && k.HareketBaslik.KaynakDepoId.HasValue);

            if (depoId.HasValue)
                cikislarQuery = cikislarQuery.Where(k => k.HareketBaslik!.KaynakDepoId == depoId.Value);

            var cikislar = await cikislarQuery
                .GroupBy(k => new { k.MalzemeId, DepoId = k.HareketBaslik!.KaynakDepoId!.Value })
                .Select(g => new { g.Key.MalzemeId, g.Key.DepoId, Toplam = g.Sum(x => x.Miktar) })
                .ToDictionaryAsync(x => (x.MalzemeId, x.DepoId), x => x.Toplam);

            var allList = new List<StokDurumDto>();

            foreach (var malz in malzemeler)
            {
                foreach (var depo in depolar)
                {
                    bool hasGiris = girisler.TryGetValue((malz.Id, depo.Id), out decimal girisMiktari);
                    bool hasCikis = cikislar.TryGetValue((malz.Id, depo.Id), out decimal cikisMiktari);

                    // EĞER BU DEPO İÇİN BU MALZEMEDEN HİÇBİR HAREKET (GİRİŞ/ÇIKIŞ) OLMAMIŞSA LİSTEYE EKLEME!
                    // Yeni açılan depoları gereksiz 0 adet ve sahte kritik uyarı ile doldurmayı engeller.
                    if (!hasGiris && !hasCikis)
                        continue;

                    decimal bakiye = girisMiktari - cikisMiktari;
                    bool isKritik = bakiye < malz.KritikStokSeviyesi;

                    if (sadeceKritik.HasValue && sadeceKritik.Value && !isKritik)
                        continue;

                    allList.Add(new StokDurumDto(
                        malz.Id,
                        malz.Kod,
                        malz.Ad,
                        malz.Birim,
                        malz.MalzemeGrubuId,
                        malz.MalzemeGrubu?.Ad ?? "",
                        depo.Id,
                        depo.Kod,
                        depo.Ad,
                        bakiye,
                        malz.KritikStokSeviyesi,
                        isKritik
                    ));
                }
            }

            int totalCount = allList.Count;
            var pagedItems = allList
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<StokDurumDto>
            {
                Items = pagedItems,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        // 2. Anlık Bakiye Hesabı (Fast SQL Aggregation)
        public async Task<decimal> GetAnlikBakiyeAsync(int malzemeId, int depoId)
        {
            var giris = await _context.HareketKalemleri
                .AsNoTracking()
                .Where(k => k.MalzemeId == malzemeId && !k.HareketBaslik!.IsIptal && k.HareketBaslik.HedefDepoId == depoId)
                .SumAsync(k => (decimal?)k.Miktar) ?? 0m;

            var cikis = await _context.HareketKalemleri
                .AsNoTracking()
                .Where(k => k.MalzemeId == malzemeId && !k.HareketBaslik!.IsIptal && k.HareketBaslik.KaynakDepoId == depoId)
                .SumAsync(k => (decimal?)k.Miktar) ?? 0m;

            return giris - cikis;
        }

        // 3. Stok Hareketi Ekleme (Giriş / Çıkış / Transfer) + Transaction & Hurda ve Negatif Stok Kontrolü
        public async Task<HareketBaslikDto> CreateHareketAsync(CreateHareketDto dto, int userId)
        {
            if (dto.Kalemler == null || dto.Kalemler.Count == 0)
                throw new ArgumentException("En az bir hareket kalemi girilmelidir.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (dto.HareketTipi == HareketTipiEnum.Giris && !dto.HedefDepoId.HasValue)
                    throw new ArgumentException("Giriş hareketinde hedef depo seçilmesi zorunludur.");

                if (dto.HareketTipi == HareketTipiEnum.Cikis && !dto.KaynakDepoId.HasValue)
                    throw new ArgumentException("Çıkış hareketinde kaynak depo seçilmesi zorunludur.");

                if (dto.HareketTipi == HareketTipiEnum.Transfer)
                {
                    if (!dto.KaynakDepoId.HasValue || !dto.HedefDepoId.HasValue)
                        throw new ArgumentException("Transfer hareketinde kaynak ve hedef depo seçilmesi zorunludur.");
                    if (dto.KaynakDepoId == dto.HedefDepoId)
                        throw new ArgumentException("Kaynak depo ile hedef depo aynı olamaz.");
                }

                // Çıkış veya Transfer ise stok yeterlilik ve Hurda kontrolü
                if (dto.HareketTipi == HareketTipiEnum.Cikis || dto.HareketTipi == HareketTipiEnum.Transfer)
                {
                    int kaynakDepoId = dto.KaynakDepoId!.Value;
                    var malzemeIds = dto.Kalemler.Select(k => k.MalzemeId).Distinct().ToList();

                    // BATCH FETCH ALL MATERIAL NAMES & BALANCES (Eliminates N+1 Queries)
                    var malzemeDict = await _context.Malzemeler
                        .AsNoTracking()
                        .Where(m => malzemeIds.Contains(m.Id))
                        .ToDictionaryAsync(m => m.Id, m => m.Ad);

                    foreach (var kalem in dto.Kalemler)
                    {
                        string malzemeAdi = malzemeDict.TryGetValue(kalem.MalzemeId, out var name) ? name : "Malzeme";

                        if (kalem.MalzemeDurumu == MalzemeDurumuEnum.Hurda)
                        {
                            throw new InvalidOperationException($"Hurda Stok Kullanılamaz! '{malzemeAdi}' hurda durumunda olduğu için çıkış veya transfer edilemez.");
                        }

                        var mevcutBakiye = await GetAnlikBakiyeAsync(kalem.MalzemeId, kaynakDepoId);
                        if (mevcutBakiye < kalem.Miktar)
                        {
                            throw new InvalidOperationException($"Yetersiz Stok! '{malzemeAdi}' için mevcut bakiye: {mevcutBakiye}, istenen çıkış: {kalem.Miktar}");
                        }
                    }
                }

                string prefix = dto.HareketTipi switch
                {
                    HareketTipiEnum.Giris => "FIS-GRS",
                    HareketTipiEnum.Cikis => "FIS-CKS",
                    HareketTipiEnum.Transfer => "FIS-TRN",
                    _ => "FIS"
                };
                string fisNo = $"{prefix}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}";

                var baslik = new HareketBaslik
                {
                    FisNo = fisNo,
                    HareketTipi = dto.HareketTipi,
                    Tarih = dto.Tarih.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dto.Tarih, DateTimeKind.Utc) : dto.Tarih.ToUniversalTime(),
                    KaynakDepoId = dto.KaynakDepoId,
                    HedefDepoId = dto.HedefDepoId,
                    Aciklama = dto.Aciklama,
                    OlusturanKullaniciId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                foreach (var item in dto.Kalemler)
                {
                    baslik.Kalemler.Add(new HareketKalem
                    {
                        MalzemeId = item.MalzemeId,
                        Miktar = item.Miktar,
                        BirimFiyat = item.BirimFiyat,
                        Raf = string.IsNullOrWhiteSpace(item.Raf) ? "R-01" : item.Raf,
                        Huycre = string.IsNullOrWhiteSpace(item.Huycre) ? "H-01" : item.Huycre,
                        MalzemeDurumu = item.MalzemeDurumu,
                        SatirAciklamasi = item.SatirAciklamasi
                    });
                }

                _context.HareketBasliklari.Add(baslik);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return await GetHareketByIdAsync(baslik.Id) ?? throw new Exception("Kayıt oluşturuldu fakat getirilemedi.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // 4. Hareket Detay Getir (AsNoTracking)
        public async Task<HareketBaslikDto?> GetHareketByIdAsync(int id)
        {
            var h = await _context.HareketBasliklari
                .AsNoTracking()
                .Include(b => b.KaynakDepo)
                .Include(b => b.HedefDepo)
                .Include(b => b.OlusturanKullanici)
                .Include(b => b.Kalemler)
                    .ThenInclude(k => k.Malzeme)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (h == null) return null;

            return MapToBaslikDto(h);
        }

        // 5. Hareket Listesi (Paged & NoTracking)
        public async Task<PagedResult<HareketBaslikDto>> GetHareketlerPagedAsync(HareketTipiEnum? tip, int? depoId, int? malzemeId, DateTime? baslangic, DateTime? bitis, int page = 1, int pageSize = 10)
        {
            var query = _context.HareketBasliklari
                .AsNoTracking()
                .Include(b => b.KaynakDepo)
                .Include(b => b.HedefDepo)
                .Include(b => b.OlusturanKullanici)
                .Include(b => b.Kalemler)
                    .ThenInclude(k => k.Malzeme)
                .AsQueryable();

            if (tip.HasValue)
                query = query.Where(b => b.HareketTipi == tip.Value);

            if (depoId.HasValue)
                query = query.Where(b => b.KaynakDepoId == depoId.Value || b.HedefDepoId == depoId.Value);

            if (malzemeId.HasValue)
                query = query.Where(b => b.Kalemler.Any(k => k.MalzemeId == malzemeId.Value));

            if (baslangic.HasValue)
                query = query.Where(b => b.Tarih >= baslangic.Value);

            if (bitis.HasValue)
                query = query.Where(b => b.Tarih <= bitis.Value);

            int totalCount = await query.CountAsync();

            var list = await query
                .OrderByDescending(b => b.Tarih)
                .ThenByDescending(b => b.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<HareketBaslikDto>
            {
                Items = list.Select(MapToBaslikDto).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        // 6. Hareket İptal Etme
        public async Task<bool> IptalEtAsync(int id, string iptalNedeni, int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var baslik = await _context.HareketBasliklari
                    .Include(b => b.Kalemler)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (baslik == null) throw new KeyNotFoundException("Hareket kaydı bulunamadı.");
                if (baslik.IsIptal) throw new InvalidOperationException("Bu fiş zaten iptal edilmiştir.");

                if (baslik.HareketTipi == HareketTipiEnum.Giris || baslik.HareketTipi == HareketTipiEnum.Transfer)
                {
                    int hedefDepoId = baslik.HedefDepoId!.Value;
                    foreach (var kalem in baslik.Kalemler)
                    {
                        var mevcubBakiye = await GetAnlikBakiyeAsync(kalem.MalzemeId, hedefDepoId);
                        if (mevcubBakiye < kalem.Miktar)
                        {
                            throw new InvalidOperationException($"İptal Edilemez! Giriş iptal edildiğinde depodaki bakiye eksiye düşecektir.");
                        }
                    }
                }

                baslik.IsIptal = true;
                baslik.IptalNedeni = iptalNedeni;
                baslik.IptalTarihi = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // 7. Hareket Defteri / Kartoteks (Paged & AsNoTracking)
        public async Task<PagedResult<KartoteksItemDto>> GetKartoteksPagedAsync(int malzemeId, int? depoId, int page = 1, int pageSize = 10)
        {
            var query = _context.HareketKalemleri
                .AsNoTracking()
                .Include(k => k.HareketBaslik)
                    .ThenInclude(b => b!.KaynakDepo)
                .Include(k => k.HareketBaslik)
                    .ThenInclude(b => b!.HedefDepo)
                .Where(k => k.MalzemeId == malzemeId && !k.HareketBaslik!.IsIptal)
                .AsQueryable();

            if (depoId.HasValue)
            {
                query = query.Where(k => k.HareketBaslik!.KaynakDepoId == depoId.Value || k.HareketBaslik.HedefDepoId == depoId.Value);
            }

            var allItems = await query
                .OrderBy(k => k.HareketBaslik!.Tarih)
                .ThenBy(k => k.HareketBaslikId)
                .ToListAsync();

            var fullCalculatedList = new List<KartoteksItemDto>();
            decimal runningTotal = 0;

            foreach (var item in allItems)
            {
                var baslik = item.HareketBaslik!;
                decimal giris = 0;
                decimal cikis = 0;
                string depoAd = "";
                int targetDepoId = 0;

                if (depoId.HasValue)
                {
                    targetDepoId = depoId.Value;
                    if (baslik.HedefDepoId == depoId.Value)
                    {
                        giris = item.Miktar;
                        depoAd = baslik.HedefDepo?.Ad ?? "";
                    }
                    if (baslik.KaynakDepoId == depoId.Value)
                    {
                        cikis = item.Miktar;
                        depoAd = baslik.KaynakDepo?.Ad ?? "";
                    }
                }
                else
                {
                    if (baslik.HareketTipi == HareketTipiEnum.Giris)
                    {
                        giris = item.Miktar;
                        depoAd = baslik.HedefDepo?.Ad ?? "";
                        targetDepoId = baslik.HedefDepoId ?? 0;
                    }
                    else if (baslik.HareketTipi == HareketTipiEnum.Cikis)
                    {
                        cikis = item.Miktar;
                        depoAd = baslik.KaynakDepo?.Ad ?? "";
                        targetDepoId = baslik.KaynakDepoId ?? 0;
                    }
                    else if (baslik.HareketTipi == HareketTipiEnum.Transfer)
                    {
                        giris = item.Miktar;
                        depoAd = $"{baslik.KaynakDepo?.Kod} -> {baslik.HedefDepo?.Kod}";
                        targetDepoId = baslik.HedefDepoId ?? 0;
                    }
                }

                runningTotal += (giris - cikis);

                fullCalculatedList.Add(new KartoteksItemDto(
                    baslik.Id,
                    baslik.FisNo,
                    baslik.Tarih,
                    baslik.HareketTipi,
                    baslik.HareketTipi switch
                    {
                        HareketTipiEnum.Giris => "Giriş Fişi",
                        HareketTipiEnum.Cikis => "Çıkış Fişi",
                        HareketTipiEnum.Transfer => "Transfer Fişi",
                        _ => ""
                    },
                    targetDepoId,
                    depoAd,
                    giris,
                    cikis,
                    runningTotal,
                    item.Raf,
                    item.Huycre,
                    item.MalzemeDurumu == MalzemeDurumuEnum.Hurda ? "Hurda" : "Kullanılabilir",
                    baslik.Aciklama
                ));
            }

            int totalCount = fullCalculatedList.Count;
            var pagedItems = fullCalculatedList
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResult<KartoteksItemDto>
            {
                Items = pagedItems,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        private static HareketBaslikDto MapToBaslikDto(HareketBaslik h)
        {
            return new HareketBaslikDto(
                h.Id,
                h.FisNo,
                h.HareketTipi,
                h.HareketTipi switch
                {
                    HareketTipiEnum.Giris => "Giriş",
                    HareketTipiEnum.Cikis => "Çıkış",
                    HareketTipiEnum.Transfer => "Transfer",
                    _ => ""
                },
                h.Tarih,
                h.KaynakDepoId,
                h.KaynakDepo?.Ad,
                h.HedefDepoId,
                h.HedefDepo?.Ad,
                h.Aciklama,
                h.IsIptal,
                h.IptalNedeni,
                h.IptalTarihi,
                h.OlusturanKullanici?.AdSoyad ?? "Bilinmiyor",
                h.CreatedAt,
                h.Kalemler.Select(k => new HareketKalemDto(
                    k.Id,
                    k.MalzemeId,
                    k.Malzeme?.Kod ?? "",
                    k.Malzeme?.Ad ?? "",
                    k.Malzeme?.Birim ?? "",
                    k.Miktar,
                    k.BirimFiyat,
                    k.Miktar * k.BirimFiyat,
                    k.Raf,
                    k.Huycre,
                    k.MalzemeDurumu,
                    k.MalzemeDurumu == MalzemeDurumuEnum.Hurda ? "Hurda" : "Kullanılabilir",
                    k.SatirAciklamasi
                )).ToList()
            );
        }
    }
}
