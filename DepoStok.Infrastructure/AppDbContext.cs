using DepoStok.Domain;
using Microsoft.EntityFrameworkCore;

namespace DepoStok.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Role> Roles => Set<Role>();
        public DbSet<User> Users => Set<User>();
        public DbSet<MalzemeGrubu> MalzemeGruplari => Set<MalzemeGrubu>();
        public DbSet<Malzeme> Malzemeler => Set<Malzeme>();
        public DbSet<Depo> Depolar => Set<Depo>();
        public DbSet<Birim> Birimler => Set<Birim>();
        public DbSet<HareketBaslik> HareketBasliklari => Set<HareketBaslik>();
        public DbSet<HareketKalem> HareketKalemleri => Set<HareketKalem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Role Config
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasIndex(r => r.Kod).IsUnique();
                entity.Property(r => r.Kod).HasMaxLength(30).IsRequired();
                entity.Property(r => r.Ad).HasMaxLength(100).IsRequired();
            });

            // User Config
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.KullaniciAdi).IsUnique();
                entity.Property(u => u.KullaniciAdi).HasMaxLength(50).IsRequired();
                entity.Property(u => u.AdSoyad).HasMaxLength(100).IsRequired();

                entity.HasOne(u => u.Role)
                      .WithMany()
                      .HasForeignKey(u => u.RoleId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // MalzemeGrubu Config (Hiyerarşik Ağaç Yapısı)
            modelBuilder.Entity<MalzemeGrubu>(entity =>
            {
                entity.HasIndex(g => g.Kod).IsUnique();
                entity.Property(g => g.Kod).HasMaxLength(30).IsRequired();
                entity.Property(g => g.Ad).HasMaxLength(100).IsRequired();

                entity.HasOne(g => g.Parent)
                      .WithMany(g => g.Children)
                      .HasForeignKey(g => g.ParentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Malzeme Config (PERFORMANS İNDEKSLERİ EKLENDİ)
            modelBuilder.Entity<Malzeme>(entity =>
            {
                entity.HasIndex(m => m.Kod).IsUnique();
                entity.HasIndex(m => m.IsActive);
                entity.HasIndex(m => m.MalzemeGrubuId);

                entity.Property(m => m.Kod).HasMaxLength(50).IsRequired();
                entity.Property(m => m.Ad).HasMaxLength(150).IsRequired();
                entity.Property(m => m.Birim).HasMaxLength(20).IsRequired();
                entity.Property(m => m.KritikStokSeviyesi).HasPrecision(18, 2);

                entity.HasOne(m => m.MalzemeGrubu)
                      .WithMany(g => g.Malzemeler)
                      .HasForeignKey(m => m.MalzemeGrubuId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Depo Config (PERFORMANS İNDEKSLERİ EKLENDİ)
            modelBuilder.Entity<Depo>(entity =>
            {
                entity.HasIndex(d => d.Kod).IsUnique();
                entity.HasIndex(d => d.IsActive);

                entity.Property(d => d.Kod).HasMaxLength(30).IsRequired();
                entity.Property(d => d.Ad).HasMaxLength(100).IsRequired();
                entity.Property(d => d.Sorumlu).HasMaxLength(100);
            });

            // HareketBaslik Config (PERFORMANS İNDEKSLERİ EKLENDİ)
            modelBuilder.Entity<HareketBaslik>(entity =>
            {
                entity.HasIndex(h => h.FisNo).IsUnique();
                entity.HasIndex(h => h.Tarih);
                entity.HasIndex(h => h.HareketTipi);
                entity.HasIndex(h => h.IsIptal);
                entity.HasIndex(h => h.KaynakDepoId);
                entity.HasIndex(h => h.HedefDepoId);

                entity.Property(h => h.FisNo).HasMaxLength(50).IsRequired();
                entity.Property(h => h.Aciklama).HasMaxLength(250);
                entity.Property(h => h.IptalNedeni).HasMaxLength(250);

                entity.HasOne(h => h.KaynakDepo)
                      .WithMany()
                      .HasForeignKey(h => h.KaynakDepoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(h => h.HedefDepo)
                      .WithMany()
                      .HasForeignKey(h => h.HedefDepoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(h => h.OlusturanKullanici)
                      .WithMany()
                      .HasForeignKey(h => h.OlusturanKullaniciId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // HareketKalem Config (PERFORMANS İNDEKSLERİ EKLENDİ)
            modelBuilder.Entity<HareketKalem>(entity =>
            {
                entity.HasIndex(k => k.HareketBaslikId);
                entity.HasIndex(k => k.MalzemeId);

                entity.Property(k => k.Miktar).HasPrecision(18, 2);
                entity.Property(k => k.BirimFiyat).HasPrecision(18, 2);
                entity.Property(k => k.Raf).HasMaxLength(30);
                entity.Property(k => k.Huycre).HasMaxLength(30);
                entity.Property(k => k.SatirAciklamasi).HasMaxLength(150);

                entity.HasOne(k => k.HareketBaslik)
                      .WithMany(b => b.Kalemler)
                      .HasForeignKey(k => k.HareketBaslikId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(k => k.Malzeme)
                      .WithMany()
                      .HasForeignKey(k => k.MalzemeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
