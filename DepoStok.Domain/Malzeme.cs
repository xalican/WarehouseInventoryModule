namespace DepoStok.Domain
{
    public class Malzeme
    {
        public int Id { get; set; }
        public string Kod { get; set; } = string.Empty;
        public string Ad { get; set; } = string.Empty;
        public string Birim { get; set; } = "Adet"; // Adet, Metre, Kg, Set, vb.
        
        public int MalzemeGrubuId { get; set; }
        public MalzemeGrubu? MalzemeGrubu { get; set; }

        // Ek Özellikler / Nitelikler
        public string? MarkaModel { get; set; }
        public string? TeknikOzellik { get; set; }
        public decimal KritikStokSeviyesi { get; set; } = 10;
        public decimal MaxStokSeviyesi { get; set; } = 1000;
        public string? Aciklama { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
