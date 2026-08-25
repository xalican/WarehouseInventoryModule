using System.Collections.Generic;

namespace DepoStok.Domain
{
    public class MalzemeGrubu
    {
        public int Id { get; set; }
        public string Kod { get; set; } = string.Empty;
        public string Ad { get; set; } = string.Empty;

        public int? ParentId { get; set; }
        public MalzemeGrubu? Parent { get; set; }
        public ICollection<MalzemeGrubu> Children { get; set; } = new List<MalzemeGrubu>();

        public ICollection<Malzeme> Malzemeler { get; set; } = new List<Malzeme>();
    }
}
