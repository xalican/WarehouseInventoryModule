namespace DepoStok.Domain
{
    /// <summary>
    /// Sistem Genelinde Kullanılan Sabit Değerler (Magic String & Numbers Önleyici)
    /// </summary>
    public static class DomainConstants
    {
        // Varsayılan Depo Lokasyonu ve Bölge Bilgileri
        public static class WarehouseDefaults
        {
            public const string DefaultBolge = "Marmara Bölgesi";
        }

        // Varsayılan Stok Limiti ve Kritik Seviye Değerleri
        public static class StockDefaults
        {
            public const decimal DefaultMaxStokSeviyesi = 1000m;
            public const decimal DefaultKritikStokSeviyesi = 15m;
            public const string DefaultRaf = "R-01";
            public const string DefaultHuycre = "H-01";
            public const string DefaultBirim = "Adet";
        }

        // Kategori Kod Ön Ekleri
        public static class CategoryDefaults
        {
            public const string GroupCodePrefix = "GRP-";
        }
    }
}
