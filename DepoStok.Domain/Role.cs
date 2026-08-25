namespace DepoStok.Domain
{
    public class Role
    {
        public int Id { get; set; }
        public string Kod { get; set; } = string.Empty; // Admin, DepoSorumlusu, DepoPersoneli, Goruntuleyici
        public string Ad { get; set; } = string.Empty;  // Yönetici, Depo Sorumlusu, Depo Personeli, Görüntüleyici
        public string Aciklama { get; set; } = string.Empty;
    }
}
