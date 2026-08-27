using DepoStok.Domain;

namespace DepoStok.Application
{
    /// <summary>
    /// Entity - DTO Dönüşümlerini (Mapping) Controller ve Servis Dışına Taşıyan Extension Metotlar
    /// </summary>
    public static class MappingExtensions
    {
        // --- DEPO MAPPINGS ---
        public static DepoDto ToDto(this Depo depo)
        {
            return new DepoDto(
                depo.Id,
                depo.Kod,
                depo.Ad,
                depo.Sorumlu,
                string.IsNullOrWhiteSpace(depo.Bolge) ? DomainConstants.WarehouseDefaults.DefaultBolge : depo.Bolge,
                depo.IsActive
            );
        }

        public static Depo ToEntity(this CreateDepoDto dto)
        {
            return new Depo
            {
                Kod = dto.Kod.Trim(),
                Ad = dto.Ad.Trim(),
                Sorumlu = dto.Sorumlu?.Trim() ?? string.Empty,
                Bolge = string.IsNullOrWhiteSpace(dto.Bolge) ? DomainConstants.WarehouseDefaults.DefaultBolge : dto.Bolge.Trim(),
                IsActive = true
            };
        }

        public static void UpdateFromDto(this Depo depo, UpdateDepoDto dto)
        {
            depo.Kod = dto.Kod.Trim();
            depo.Ad = dto.Ad.Trim();
            depo.Sorumlu = dto.Sorumlu?.Trim() ?? string.Empty;
            depo.Bolge = string.IsNullOrWhiteSpace(dto.Bolge) ? DomainConstants.WarehouseDefaults.DefaultBolge : dto.Bolge.Trim();
            depo.IsActive = dto.IsActive;
        }

        // --- MALZEME MAPPINGS ---
        public static MalzemeDto ToDto(this Malzeme malzeme)
        {
            return new MalzemeDto(
                malzeme.Id,
                malzeme.Kod,
                malzeme.Ad,
                malzeme.Birim,
                malzeme.MalzemeGrubuId,
                malzeme.MalzemeGrubu?.Ad ?? string.Empty,
                malzeme.MarkaModel,
                malzeme.TeknikOzellik,
                malzeme.KritikStokSeviyesi,
                malzeme.MaxStokSeviyesi,
                malzeme.Aciklama,
                malzeme.IsActive
            );
        }

        public static Malzeme ToEntity(this CreateMalzemeDto dto)
        {
            return new Malzeme
            {
                Kod = dto.Kod.Trim(),
                Ad = dto.Ad.Trim(),
                Birim = string.IsNullOrWhiteSpace(dto.Birim) ? DomainConstants.StockDefaults.DefaultBirim : dto.Birim.Trim(),
                MalzemeGrubuId = dto.MalzemeGrubuId,
                MarkaModel = dto.MarkaModel?.Trim(),
                TeknikOzellik = dto.TeknikOzellik?.Trim(),
                KritikStokSeviyesi = dto.KritikStokSeviyesi,
                MaxStokSeviyesi = dto.MaxStokSeviyesi > 0 ? dto.MaxStokSeviyesi : DomainConstants.StockDefaults.DefaultMaxStokSeviyesi,
                Aciklama = dto.Aciklama?.Trim(),
                IsActive = true
            };
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

        // --- MALZEME GRUBU MAPPINGS ---
        public static MalzemeGrubuDto ToDto(this MalzemeGrubu grup)
        {
            return new MalzemeGrubuDto(
                grup.Id,
                grup.Kod,
                grup.Ad,
                grup.ParentId,
                grup.Parent?.Ad
            );
        }

        // --- BİRİM MAPPINGS ---
        public static BirimDto ToDto(this Birim birim)
        {
            return new BirimDto(
                birim.Id,
                birim.Ad,
                birim.Sembol,
                birim.IsActive
            );
        }

        public static Birim ToEntity(this CreateBirimDto dto)
        {
            var ad = dto.Ad.Trim();
            return new Birim
            {
                Ad = ad,
                Sembol = string.IsNullOrWhiteSpace(dto.Sembol) ? ad : dto.Sembol.Trim(),
                IsActive = true
            };
        }
    }
}
