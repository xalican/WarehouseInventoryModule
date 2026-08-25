using System;

namespace DepoStok.Domain
{
    public class User
    {
        public int Id { get; set; }
        public string AdSoyad { get; set; } = string.Empty;
        public string KullaniciAdi { get; set; } = string.Empty;
        public string ParolaHash { get; set; } = string.Empty;
        
        public int RoleId { get; set; }
        public Role? Role { get; set; }

        public string? Email { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
