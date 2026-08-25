using System;
using System.Collections.Generic;

namespace DepoStok.Domain
{
    public class HareketBaslik
    {
        public int Id { get; set; }
        public string FisNo { get; set; } = string.Empty;
        public HareketTipiEnum HareketTipi { get; set; } // Giris = 1, Cikis = 2, Transfer = 3
        public DateTime Tarih { get; set; } = DateTime.UtcNow;

        public int? KaynakDepoId { get; set; }
        public Depo? KaynakDepo { get; set; }

        public int? HedefDepoId { get; set; }
        public Depo? HedefDepo { get; set; }

        public string Aciklama { get; set; } = string.Empty;

        public bool IsIptal { get; set; } = false;
        public string? IptalNedeni { get; set; }
        public DateTime? IptalTarihi { get; set; }

        public int OlusturanKullaniciId { get; set; }
        public User? OlusturanKullanici { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<HareketKalem> Kalemler { get; set; } = new List<HareketKalem>();
    }
}
