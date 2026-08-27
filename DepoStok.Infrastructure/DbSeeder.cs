using System;
using System.Collections.Generic;
using System.Linq;
using DepoStok.Domain;
using Microsoft.EntityFrameworkCore;

namespace DepoStok.Infrastructure
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            try
            {
                context.Database.EnsureCreated();
                // Test query to check if Roles table exists
                var _ = context.Roles.FirstOrDefault();
            }
            catch
            {
                // Veritabanı şeması yenilendiyse eski veritabanını temizleyip sıfırdan sorunsuz oluşturur
                context.Database.EnsureDeleted();
                context.Database.EnsureCreated();
            }

            // Auto-patch new columns to MySQL table cleanly without logging red [ERR] duplicate errors
            try
            {
                var existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var connection = context.Database.GetDbConnection();
                
                if (connection.State != System.Data.ConnectionState.Open)
                    connection.Open();

                context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS `Birimler` (
                        `Id` int NOT NULL AUTO_INCREMENT,
                        `Ad` longtext NOT NULL,
                        `Sembol` longtext NOT NULL,
                        `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                        PRIMARY KEY (`Id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");

                var existingUserColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users';";
                    using var reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        existingUserColumns.Add(reader.GetString(0));
                    }
                }

                if (!existingUserColumns.Contains("Email"))
                {
                    context.Database.ExecuteSqlRaw("ALTER TABLE `Users` ADD COLUMN `Email` longtext NULL;");
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Malzemeler';";
                    using var reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        existingColumns.Add(reader.GetString(0));
                    }
                }

                if (!existingColumns.Contains("MarkaModel"))
                    context.Database.ExecuteSqlRaw("ALTER TABLE `Malzemeler` ADD COLUMN `MarkaModel` longtext NULL;");

                if (!existingColumns.Contains("TeknikOzellik"))
                    context.Database.ExecuteSqlRaw("ALTER TABLE `Malzemeler` ADD COLUMN `TeknikOzellik` longtext NULL;");

                if (!existingColumns.Contains("MaxStokSeviyesi"))
                    context.Database.ExecuteSqlRaw("ALTER TABLE `Malzemeler` ADD COLUMN `MaxStokSeviyesi` decimal(18,2) NOT NULL DEFAULT 1000;");

                if (!existingColumns.Contains("Aciklama"))
                    context.Database.ExecuteSqlRaw("ALTER TABLE `Malzemeler` ADD COLUMN `Aciklama` longtext NULL;");

                var existingDepoColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Depolar';";
                    using var reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        existingDepoColumns.Add(reader.GetString(0));
                    }
                }

                if (!existingDepoColumns.Contains("Bolge"))
                {
                    context.Database.ExecuteSqlRaw("ALTER TABLE `Depolar` ADD COLUMN `Bolge` longtext NULL;");
                    context.Database.ExecuteSqlRaw("UPDATE `Depolar` SET `Bolge` = 'Marmara Bölgesi' WHERE `Kod` LIKE '%MRK%' OR `Kod` LIKE '%BLG%';");
                    context.Database.ExecuteSqlRaw("UPDATE `Depolar` SET `Bolge` = 'İç Anadolu Bölgesi' WHERE `Kod` LIKE '%SHA%';");
                    context.Database.ExecuteSqlRaw("UPDATE `Depolar` SET `Bolge` = 'Saha & Hurda Depoları' WHERE `Kod` LIKE '%HRD%';");
                    context.Database.ExecuteSqlRaw("UPDATE `Depolar` SET `Bolge` = 'Akdeniz Bölgesi' WHERE `Kod` LIKE '%ADN%' OR `Ad` LIKE '%Adana%';");
                }

                var existingGrupColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (var command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MalzemeGruplari';";
                    using var reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        existingGrupColumns.Add(reader.GetString(0));
                    }
                }

                if (!existingGrupColumns.Contains("ParentId"))
                {
                    context.Database.ExecuteSqlRaw("ALTER TABLE `MalzemeGruplari` ADD COLUMN `ParentId` int NULL;");
                }
            }
            catch { }

            // 1. Seed Roles (Dinamik Tablo & RoleConstants)
            if (!context.Roles.Any())
            {
                var roles = new List<Role>
                {
                    new Role { Id = RoleConstants.AdminId, Kod = RoleConstants.AdminCode, Ad = RoleConstants.AdminName, Aciklama = "Tam Sistem Yönetimi Yetkisi" },
                    new Role { Id = RoleConstants.DepoSorumlusuId, Kod = RoleConstants.DepoSorumlusuCode, Ad = RoleConstants.DepoSorumlusuName, Aciklama = "Tanım ve Fiş Yönetim Yetkisi" },
                    new Role { Id = RoleConstants.DepoPersoneliId, Kod = RoleConstants.DepoPersoneliCode, Ad = RoleConstants.DepoPersoneliName, Aciklama = "Stok Giriş ve Çıkış Yetkisi" },
                    new Role { Id = RoleConstants.GoruntuleyiciId, Kod = RoleConstants.GoruntuleyiciCode, Ad = RoleConstants.GoruntuleyiciName, Aciklama = "Salt Okunur Raporlama Yetkisi" }
                };
                context.Roles.AddRange(roles);
                context.SaveChanges();
            }

            // 2. Seed Users
            if (!context.Users.Any())
            {
                var users = new List<User>
                {
                    new User { AdSoyad = "Sistem Yöneticisi", KullaniciAdi = "admin", ParolaHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"), RoleId = RoleConstants.AdminId },
                    new User { AdSoyad = "Ahmet Sorumlu", KullaniciAdi = "sorumlu", ParolaHash = BCrypt.Net.BCrypt.HashPassword("Sorumlu123!"), RoleId = RoleConstants.DepoSorumlusuId },
                    new User { AdSoyad = "Mehmet Personel", KullaniciAdi = "personel", ParolaHash = BCrypt.Net.BCrypt.HashPassword("Personel123!"), RoleId = RoleConstants.DepoPersoneliId },
                    new User { AdSoyad = "Ayşe Gözlemci", KullaniciAdi = "goruntuleyici", ParolaHash = BCrypt.Net.BCrypt.HashPassword("Goruntuleyici123!"), RoleId = RoleConstants.GoruntuleyiciId }
                };
                context.Users.AddRange(users);
                context.SaveChanges();
            }

            // 3. Seed & Structure Malzeme Grupları (Hiyerarşik Kategori Yapısı)
            if (!context.MalzemeGruplari.Any())
            {
                var gYapi = new MalzemeGrubu { Kod = "GRP-YAPI", Ad = "Yapı Malzemeleri" };
                var gBakim = new MalzemeGrubu { Kod = "GRP-BAKIM", Ad = "Bakım & Ekipman Malzemeleri" };
                context.MalzemeGruplari.AddRange(gYapi, gBakim);
                context.SaveChanges();

                var gruplar = new List<MalzemeGrubu>
                {
                    new MalzemeGrubu { Kod = "GRP-BORU", Ad = "Borular ve Bağlantı Elemanları", ParentId = gYapi.Id },
                    new MalzemeGrubu { Kod = "GRP-VANA", Ad = "Vana ve Emniyet Valfleri", ParentId = gYapi.Id },
                    new MalzemeGrubu { Kod = "GRP-SAYAC", Ad = "Doğalgaz Sayaçları", ParentId = gBakim.Id },
                    new MalzemeGrubu { Kod = "GRP-REG", Ad = "Basınç Regülatörleri", ParentId = gBakim.Id },
                    new MalzemeGrubu { Kod = "GRP-SARF", Ad = "Sarf Malzemeleri ve Bağlantı Ekipmanları", ParentId = gBakim.Id }
                };
                context.MalzemeGruplari.AddRange(gruplar);
                context.SaveChanges();
            }
            else if (!context.MalzemeGruplari.Any(g => g.Kod == "GRP-YAPI"))
            {
                var gYapi = new MalzemeGrubu { Kod = "GRP-YAPI", Ad = "Yapı Malzemeleri" };
                var gBakim = new MalzemeGrubu { Kod = "GRP-BAKIM", Ad = "Bakım & Ekipman Malzemeleri" };
                context.MalzemeGruplari.AddRange(gYapi, gBakim);
                context.SaveChanges();

                var boru = context.MalzemeGruplari.FirstOrDefault(g => g.Kod == "GRP-BORU");
                if (boru != null) boru.ParentId = gYapi.Id;

                var vana = context.MalzemeGruplari.FirstOrDefault(g => g.Kod == "GRP-VANA");
                if (vana != null) vana.ParentId = gYapi.Id;

                var sayac = context.MalzemeGruplari.FirstOrDefault(g => g.Kod == "GRP-SAYAC");
                if (sayac != null) sayac.ParentId = gBakim.Id;

                var reg = context.MalzemeGruplari.FirstOrDefault(g => g.Kod == "GRP-REG");
                if (reg != null) reg.ParentId = gBakim.Id;

                var sarf = context.MalzemeGruplari.FirstOrDefault(g => g.Kod == "GRP-SARF");
                if (sarf != null) sarf.ParentId = gBakim.Id;

                context.SaveChanges();
            }

            // 4. Seed Depolar
            if (!context.Depolar.Any())
            {
                var depolar = new List<Depo>
                {
                    new Depo { Kod = "DEP-MRK", Ad = "Merkez Lojistik Deposu", Sorumlu = "Ahmet Sorumlu", Bolge = "Marmara Bölgesi" },
                    new Depo { Kod = "DEP-BLG", Ad = "Marmara Bölge Deposu", Sorumlu = "Kemal Yılmaz", Bolge = "Marmara Bölgesi" },
                    new Depo { Kod = "DEP-SHA", Ad = "Saha Operasyon Deposu", Sorumlu = "Mehmet Personel", Bolge = "İç Anadolu Bölgesi" },
                    new Depo { Kod = "DEP-HRD", Ad = "Hurda ve Geri Dönüşüm Deposu", Sorumlu = "Caner Demir", Bolge = "Saha & Hurda Depoları" }
                };
                context.Depolar.AddRange(depolar);
                context.SaveChanges();
            }

            // Seed Birimler (Varsayılan Ölçü Birimleri)
            try
            {
                context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS `Birimler` (
                        `Id` int NOT NULL AUTO_INCREMENT,
                        `Ad` longtext NOT NULL,
                        `Sembol` longtext NOT NULL,
                        `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                        PRIMARY KEY (`Id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                ");

                if (!context.Birimler.Any())
                {
                    var birimler = new List<Birim>
                    {
                        new Birim { Ad = "Adet", Sembol = "Pcs" },
                        new Birim { Ad = "Metre", Sembol = "m" },
                        new Birim { Ad = "Kg", Sembol = "kg" },
                        new Birim { Ad = "Paket", Sembol = "Pkt" },
                        new Birim { Ad = "Kutu", Sembol = "Ktu" },
                        new Birim { Ad = "Litre", Sembol = "lt" },
                        new Birim { Ad = "Ton", Sembol = "t" },
                        new Birim { Ad = "Galon", Sembol = "gal" },
                        new Birim { Ad = "Varil", Sembol = "vrl" },
                        new Birim { Ad = "Palet", Sembol = "plt" },
                        new Birim { Ad = "Set", Sembol = "set" }
                    };
                    context.Birimler.AddRange(birimler);
                    context.SaveChanges();
                }
            }
            catch { }

            // 5. Seed Malzemeler (105 Adet)
            if (!context.Malzemeler.Any())
            {
                var gSayac = context.MalzemeGruplari.First(g => g.Kod == "GRP-SAYAC").Id;
                var gReg = context.MalzemeGruplari.First(g => g.Kod == "GRP-REG").Id;
                var gBoru = context.MalzemeGruplari.First(g => g.Kod == "GRP-BORU").Id;
                var gVana = context.MalzemeGruplari.First(g => g.Kod == "GRP-VANA").Id;
                var gSarf = context.MalzemeGruplari.First(g => g.Kod == "GRP-SARF").Id;

                var malzemeler = new List<Malzeme>();

                // 20 Sayaç
                for (int i = 1; i <= 20; i++)
                {
                    malzemeler.Add(new Malzeme
                    {
                        Kod = $"SAY-G{i:D2}",
                        Ad = $"Körliğit Sayaç G-{(i * 2.5):F1} Sanayi/Ev Tipi",
                        Birim = "Adet",
                        MalzemeGrubuId = gSayac,
                        KritikStokSeviyesi = 15,
                        MaxStokSeviyesi = 500,
                        MarkaModel = "Elster / Itron",
                        TeknikOzellik = "G4/G6 Standart Sayaç",
                        Aciklama = "Muayeneli ve damgalı faturalı sayaç"
                    });
                }

                // 20 Regülatör
                for (int i = 1; i <= 20; i++)
                {
                    malzemeler.Add(new Malzeme
                    {
                        Kod = $"REG-P{i:D2}",
                        Ad = $"Servis Regülatörü {i * 10} m3/h (21 mbar / 300 mbar)",
                        Birim = "Adet",
                        MalzemeGrubuId = gReg,
                        KritikStokSeviyesi = 10,
                        MaxStokSeviyesi = 300,
                        MarkaModel = "Pietro Fiorentini",
                        TeknikOzellik = "Emniyet kapatmalı regülatör",
                        Aciklama = "Bina servis kutusu regülatörü"
                    });
                }

                // 20 Boru
                for (int i = 1; i <= 20; i++)
                {
                    malzemeler.Add(new Malzeme
                    {
                        Kod = $"BRU-PE{i:D2}",
                        Ad = $"PE-80 Polietilen Doğalgaz Borusu Çap {i * 16}mm",
                        Birim = "Metre",
                        MalzemeGrubuId = gBoru,
                        KritikStokSeviyesi = 100,
                        MaxStokSeviyesi = 5000,
                        MarkaModel = "Fırat Plastik / Pilsa",
                        TeknikOzellik = "SDR 11 PE80 Gaz Borusu",
                        Aciklama = "Altyapı şebeke borusu"
                    });
                }

                // 20 Vana
                for (int i = 1; i <= 20; i++)
                {
                    malzemeler.Add(new Malzeme
                    {
                        Kod = $"VNA-DN{i:D2}",
                        Ad = $"Doğalgaz Küresel Vana DN{i * 15} PN16 Flanşlı",
                        Birim = "Adet",
                        MalzemeGrubuId = gVana,
                        KritikStokSeviyesi = 12,
                        MaxStokSeviyesi = 200,
                        MarkaModel = "FAF / TORK",
                        TeknikOzellik = "TSE EN 331 Onaylı Vana",
                        Aciklama = "Çelik / Pirinç Küresel Vana"
                    });
                }

                // 25 Sarf
                for (int i = 1; i <= 25; i++)
                {
                    malzemeler.Add(new Malzeme
                    {
                        Kod = $"SRF-M{i:D2}",
                        Ad = $"Elektrofüzyon Manşon / Dirsek Ø{i * 10}mm",
                        Birim = "Adet",
                        MalzemeGrubuId = gSarf,
                        KritikStokSeviyesi = 50,
                        MaxStokSeviyesi = 2000,
                        MarkaModel = "Georg Fischer",
                        TeknikOzellik = "EF Kaynak Bağlantı Elemanı",
                        Aciklama = "Gaz hattı ek parçası"
                    });
                }

                context.Malzemeler.AddRange(malzemeler);
                context.SaveChanges();
            }

            // 5.1 Var olan ve Marka/Model veya Teknik Özelliği boş kalan malzemeleri doldur
            var nullMaterials = context.Malzemeler.Where(m => string.IsNullOrEmpty(m.MarkaModel) || string.IsNullOrEmpty(m.TeknikOzellik)).ToList();
            if (nullMaterials.Any())
            {
                foreach (var m in nullMaterials)
                {
                    if (string.IsNullOrEmpty(m.MarkaModel))
                    {
                        if (m.Kod.StartsWith("SAY")) m.MarkaModel = "Elster / Itron G-Series";
                        else if (m.Kod.StartsWith("REG")) m.MarkaModel = "Pietro Fiorentini FE-25";
                        else if (m.Kod.StartsWith("BRU")) m.MarkaModel = "Wavin / Fırat PE80";
                        else if (m.Kod.StartsWith("VNA")) m.MarkaModel = "Trakya Döküm / FAF Vana";
                        else m.MarkaModel = "Würth / Loctite Endüstriyel";
                    }

                    if (string.IsNullOrEmpty(m.TeknikOzellik))
                    {
                        if (m.Kod.StartsWith("SAY")) m.TeknikOzellik = "Qmax=6m³/h Pmax=0.5bar (TSE EN 1359)";
                        else if (m.Kod.StartsWith("REG")) m.TeknikOzellik = "Pin=1-4 bar Pout=21 mbar (TSE EN 88)";
                        else if (m.Kod.StartsWith("BRU")) m.TeknikOzellik = "SDR 11 PE80 Gaz Borusu (PN4)";
                        else if (m.Kod.StartsWith("VNA")) m.TeknikOzellik = "DN50 PN16 Tam Geçişli Küresel Vana";
                        else m.TeknikOzellik = "Sızdırmazlık İpi & Gaz Macunu (ISO 9001)";
                    }
                }
                context.SaveChanges();
            }

            // 6. Seed Örnek Hareketler (Fişler)
            if (!context.HareketBasliklari.Any())
            {
                var depMRK = context.Depolar.First(d => d.Kod == "DEP-MRK").Id;
                var depBLG = context.Depolar.First(d => d.Kod == "DEP-BLG").Id;
                var depSHA = context.Depolar.First(d => d.Kod == "DEP-SHA").Id;
                var userAdmin = context.Users.First(u => u.KullaniciAdi == "admin").Id;

                var tumMalzemeler = context.Malzemeler.ToList();

                // Fiş 1: Giriş (Merkez Depo)
                var fis1 = new HareketBaslik
                {
                    FisNo = "FIS-GRS-20260811-0251",
                    HareketTipi = HareketTipiEnum.Giris,
                    Tarih = DateTime.UtcNow.AddDays(-14),
                    HedefDepoId = depMRK,
                    Aciklama = "Fabrika Teslim İlk Stok Giriş İrsaliyesi No: 44812",
                    OlusturanKullaniciId = userAdmin,
                    CreatedAt = DateTime.UtcNow.AddDays(-14)
                };
                foreach (var m in tumMalzemeler.Take(25))
                {
                    fis1.Kalemler.Add(new HareketKalem
                    {
                        MalzemeId = m.Id,
                        Miktar = 120,
                        BirimFiyat = 250.0m,
                        Raf = "R-01",
                        Huycre = "H-12",
                        MalzemeDurumu = MalzemeDurumuEnum.Kullanilabilir,
                        SatirAciklamasi = "Stok girişi tamamlandı"
                    });
                }
                context.HareketBasliklari.Add(fis1);

                // Fiş 2: Giriş (Marmara Bölge Deposu)
                var fis2 = new HareketBaslik
                {
                    FisNo = "FIS-GRS-20260818-38A87B",
                    HareketTipi = HareketTipiEnum.Giris,
                    Tarih = DateTime.UtcNow.AddDays(-7),
                    HedefDepoId = depBLG,
                    Aciklama = "Bölge Deposu İkmal Alımı İrsaliyesi No: 99102",
                    OlusturanKullaniciId = userAdmin,
                    CreatedAt = DateTime.UtcNow.AddDays(-7)
                };
                foreach (var m in tumMalzemeler.Skip(20).Take(20))
                {
                    fis2.Kalemler.Add(new HareketKalem
                    {
                        MalzemeId = m.Id,
                        Miktar = 85,
                        BirimFiyat = 310.0m,
                        Raf = "R-02",
                        Huycre = "H-05",
                        MalzemeDurumu = MalzemeDurumuEnum.Kullanilabilir,
                        SatirAciklamasi = "Bölge sevkiyatı alındı"
                    });
                }
                context.HareketBasliklari.Add(fis2);

                // Fiş 3: Transfer (Merkez -> Marmara)
                var fis3 = new HareketBaslik
                {
                    FisNo = "FIS-TRN-20260820-CC90A1",
                    HareketTipi = HareketTipiEnum.Transfer,
                    Tarih = DateTime.UtcNow.AddDays(-4),
                    KaynakDepoId = depMRK,
                    HedefDepoId = depBLG,
                    Aciklama = "Merkez Depodan Marmara Bölge Deposuna Malzeme Transferi",
                    OlusturanKullaniciId = userAdmin,
                    CreatedAt = DateTime.UtcNow.AddDays(-4)
                };
                foreach (var m in tumMalzemeler.Take(10))
                {
                    fis3.Kalemler.Add(new HareketKalem
                    {
                        MalzemeId = m.Id,
                        Miktar = 15,
                        BirimFiyat = 250.0m,
                        Raf = "R-01",
                        Huycre = "H-12",
                        MalzemeDurumu = MalzemeDurumuEnum.Kullanilabilir,
                        SatirAciklamasi = "Araç No: 34-EF-9012"
                    });
                }
                context.HareketBasliklari.Add(fis3);

                context.SaveChanges();
            }
        }
    }
}
