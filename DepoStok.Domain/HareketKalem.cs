namespace DepoStok.Domain
{
    public class HareketKalem
    {
        public int Id { get; set; }
        
        public int HareketBaslikId { get; set; }
        public HareketBaslik? HareketBaslik { get; set; }

        public int MalzemeId { get; set; }
        public Malzeme? Malzeme { get; set; }

        public decimal Miktar { get; set; }
        public decimal BirimFiyat { get; set; }

        public string Raf { get; set; } = string.Empty;     // Raf No
        public string Huycre { get; set; } = string.Empty;  // Hücre No
        public MalzemeDurumuEnum MalzemeDurumu { get; set; } = MalzemeDurumuEnum.Kullanilabilir; // 1: Kullanılabilir, 2: Hurda

        public string SatirAciklamasi { get; set; } = string.Empty;
    }
}
