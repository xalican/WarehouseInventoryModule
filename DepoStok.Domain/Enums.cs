namespace DepoStok.Domain
{
    public enum HareketTipiEnum
    {
        Giris = 1,
        Cikis = 2,
        Transfer = 3
    }

    public enum MalzemeDurumuEnum
    {
        Kullanilabilir = 1, // Free / Active
        Hurda = 2          // Scrap / Cannot be issued
    }
}
