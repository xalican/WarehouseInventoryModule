namespace DepoStok.Domain
{
    /// <summary>
    /// Sistem Yetki ve Rol Enum Tanımı
    /// Veritabanındaki '1', '2', '3', '4' ID değerlerini kod okunabilirliği yüksek sembollere dönüştürür.
    /// </summary>
    public enum UserRoleEnum
    {
        Admin = 1,          // Yönetici (ID: 1)
        DepoSorumlusu = 2,  // Depo Sorumlusu (ID: 2)
        DepoPersoneli = 3,  // Depo Personeli (ID: 3)
        Goruntuleyici = 4   // Görüntüleyici (ID: 4)
    }

    public enum HareketTipiEnum
    {
        Giris = 1,    // Giriş Hareketi
        Cikis = 2,    // Çıkış Hareketi
        Transfer = 3  // Depolar Arası Transfer
    }

    public enum MalzemeDurumuEnum
    {
        Kullanilabilir = 1, // Kullanılabilir Stok
        Hurda = 2          // Hurda / Çıkış & Transfer Yapılamaz
    }
}
