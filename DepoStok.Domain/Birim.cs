namespace DepoStok.Domain
{
    public class Birim
    {
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public string Sembol { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
