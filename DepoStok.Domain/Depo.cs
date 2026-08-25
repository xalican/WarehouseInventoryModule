namespace DepoStok.Domain
{
    public class Depo
    {
        public int Id { get; set; }
        public string Kod { get; set; } = string.Empty;
        public string Ad { get; set; } = string.Empty;
        public string Sorumlu { get; set; } = string.Empty;
        public string Bolge { get; set; } = "Marmara Bölgesi";
        public bool IsActive { get; set; } = true;
    }
}
