using System;
using DepoStok.Domain;

namespace DepoStok.Application
{
    /// <summary>
    /// Generic Mapping Engine (Tek ve Jenerik ToDto / ToEntity Dönüştürme Sınıfı)
    /// Supervisor Direktifi: Tüm dönüştürme mantığı tek bir jenerik class ve jenerik ToDto/ToEntity metodu altında toplanmıştır.
    /// </summary>
    public static class MappingExtensions
    {
        /// <summary>
        /// JENERİK ToDto METODU (1 TANE JENERİK METOT)
        /// Herhangi bir Entity nesnesini hedeflenen DTO tipine jenerik olarak dönüştürür.
        /// Kullanım: entity.ToDto<DepoDto>() veya entity.ToDto<MalzemeDto>()
        /// </summary>
        public static TDto ToDto<TDto>(this object entity) where TDto : class
        {
            if (entity == null) return null!;

            return entity switch
            {
                Depo d => (TDto)(object)new DepoDto(
                    d.Id,
                    d.Kod,
                    d.Ad,
                    d.Sorumlu,
                    string.IsNullOrWhiteSpace(d.Bolge) ? DomainConstants.WarehouseDefaults.DefaultBolge : d.Bolge,
                    d.IsActive
                ),

                Malzeme m => (TDto)(object)new MalzemeDto(
                    m.Id,
                    m.Kod,
                    m.Ad,
                    m.Birim,
                    m.MalzemeGrubuId,
                    m.MalzemeGrubu?.Ad ?? string.Empty,
                    m.MarkaModel,
                    m.TeknikOzellik,
                    m.KritikStokSeviyesi,
                    m.MaxStokSeviyesi,
                    m.Aciklama,
                    m.IsActive
                ),

                MalzemeGrubu g => (TDto)(object)new MalzemeGrubuDto(
                    g.Id,
                    g.Kod,
                    g.Ad,
                    g.ParentId,
                    g.Parent?.Ad
                ),

                Birim b => (TDto)(object)new BirimDto(
                    b.Id,
                    b.Ad,
                    b.Sembol,
                    b.IsActive
                ),

                _ => throw new InvalidOperationException($"'{entity.GetType().Name}' -> '{typeof(TDto).Name}' dönüştürme kuralı bulunamadı.")
            };
        }

        /// <summary>
        /// JENERİK ToEntity METODU (1 TANE JENERİK METOT)
        /// Gelen CreateDto nesnesini hedeflenen Entity varlığına jenerik olarak dönüştürür.
        /// Kullanım: dto.ToEntity<Depo>() veya dto.ToEntity<Malzeme>()
        /// </summary>
        public static TEntity ToEntity<TEntity>(this object dto) where TEntity : class, new()
        {
            if (dto == null) return null!;

            return dto switch
            {
                CreateDepoDto d => (TEntity)(object)new Depo
                {
                    Kod = d.Kod.Trim(),
                    Ad = d.Ad.Trim(),
                    Sorumlu = d.Sorumlu?.Trim() ?? string.Empty,
                    Bolge = string.IsNullOrWhiteSpace(d.Bolge) ? DomainConstants.WarehouseDefaults.DefaultBolge : d.Bolge.Trim(),
                    IsActive = true
                },

                CreateMalzemeDto m => (TEntity)(object)new Malzeme
                {
                    Kod = m.Kod.Trim(),
                    Ad = m.Ad.Trim(),
                    Birim = string.IsNullOrWhiteSpace(m.Birim) ? DomainConstants.StockDefaults.DefaultBirim : m.Birim.Trim(),
                    MalzemeGrubuId = m.MalzemeGrubuId,
                    MarkaModel = m.MarkaModel?.Trim(),
                    TeknikOzellik = m.TeknikOzellik?.Trim(),
                    KritikStokSeviyesi = m.KritikStokSeviyesi,
                    MaxStokSeviyesi = m.MaxStokSeviyesi > 0 ? m.MaxStokSeviyesi : DomainConstants.StockDefaults.DefaultMaxStokSeviyesi,
                    Aciklama = m.Aciklama?.Trim(),
                    IsActive = true
                },

                CreateBirimDto b => (TEntity)(object)new Birim
                {
                    Ad = b.Ad.Trim(),
                    Sembol = string.IsNullOrWhiteSpace(b.Sembol) ? b.Ad.Trim() : b.Sembol.Trim(),
                    IsActive = true
                },

                _ => throw new InvalidOperationException($"'{dto.GetType().Name}' -> '{typeof(TEntity).Name}' dönüştürme kuralı bulunamadı.")
            };
        }

        // --- KISAYOL / GERİYE DÖNÜK UYUMLU EXTENSION YARDIMCILARI ---
        public static DepoDto ToDto(this Depo depo) => depo.ToDto<DepoDto>();
        public static MalzemeDto ToDto(this Malzeme malzeme) => malzeme.ToDto<MalzemeDto>();
        public static MalzemeGrubuDto ToDto(this MalzemeGrubu grup) => grup.ToDto<MalzemeGrubuDto>();
        public static BirimDto ToDto(this Birim birim) => birim.ToDto<BirimDto>();

        public static Depo ToEntity(this CreateDepoDto dto) => dto.ToEntity<Depo>();
        public static Malzeme ToEntity(this CreateMalzemeDto dto) => dto.ToEntity<Malzeme>();
        public static Birim ToEntity(this CreateBirimDto dto) => dto.ToEntity<Birim>();

        public static void UpdateFromDto(this Depo depo, UpdateDepoDto dto)
        {
            depo.Kod = dto.Kod.Trim();
            depo.Ad = dto.Ad.Trim();
            depo.Sorumlu = dto.Sorumlu?.Trim() ?? string.Empty;
            depo.Bolge = string.IsNullOrWhiteSpace(dto.Bolge) ? DomainConstants.WarehouseDefaults.DefaultBolge : dto.Bolge.Trim();
            depo.IsActive = dto.IsActive;
        }

        public static void UpdateFromDto(this Malzeme malzeme, UpdateMalzemeDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.Birim)) malzeme.Birim = dto.Birim.Trim();
            malzeme.MalzemeGrubuId = dto.MalzemeGrubuId;
            malzeme.MarkaModel = dto.MarkaModel?.Trim();
            malzeme.TeknikOzellik = dto.TeknikOzellik?.Trim();
            malzeme.KritikStokSeviyesi = dto.KritikStokSeviyesi;
            malzeme.MaxStokSeviyesi = dto.MaxStokSeviyesi;
            malzeme.Aciklama = dto.Aciklama?.Trim();
            malzeme.IsActive = dto.IsActive;
        }
    }
}
