using System;
using System.Collections.Generic;
using DepoStok.Domain;

namespace DepoStok.Application
{
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    // Auth DTOs
    public record LoginDto(string KullaniciAdi, string Parola);
    public record TokenDto(string Token, string KullaniciAdi, string AdSoyad, string Rol, DateTime Expiration);
    public record ChangePasswordDto(string MevcutParola, string YeniParola);
    public record UpdateProfileDto(string AdSoyad, string? Email = null);

    // Roles
    public record RoleDto(int Id, string Kod, string Ad, string Aciklama);

    // Malzeme & Gruplar & Birimler
    public record MalzemeGrubuDto(int Id, string Kod, string Ad, int? ParentId = null, string? ParentAd = null, List<MalzemeGrubuDto>? Children = null);
    public record CreateMalzemeGrubuDto(string? Kod, string Ad, int? ParentId = null);
    public record BirimDto(int Id, string Ad, string Sembol, bool IsActive);
    public record CreateBirimDto(string Ad, string Sembol);

    public record MalzemeDto(
        int Id,
        string Kod,
        string Ad,
        string Birim,
        int MalzemeGrubuId,
        string MalzemeGrubuAd,
        string? MarkaModel,
        string? TeknikOzellik,
        decimal KritikStokSeviyesi,
        decimal MaxStokSeviyesi,
        string? Aciklama,
        bool IsActive
    );

    public record CreateMalzemeDto(
        string Kod,
        string Ad,
        string Birim,
        int MalzemeGrubuId,
        string? MarkaModel,
        string? TeknikOzellik,
        decimal KritikStokSeviyesi,
        decimal MaxStokSeviyesi,
        string? Aciklama
    );

    public record UpdateMalzemeDto(
        string? Birim,
        int MalzemeGrubuId,
        string? MarkaModel,
        string? TeknikOzellik,
        decimal KritikStokSeviyesi,
        decimal MaxStokSeviyesi,
        string? Aciklama,
        bool IsActive
    );

    // Depolar
    public record DepoDto(int Id, string Kod, string Ad, string Sorumlu, string Bolge, bool IsActive);
    public record CreateDepoDto(string Kod, string Ad, string Sorumlu, string Bolge);
    public record UpdateDepoDto(string Kod, string Ad, string Sorumlu, string Bolge, bool IsActive);

    // Stok Hareketleri (Raf, Hücre, Malzeme Durumu dahil)
    public record CreateHareketKalemDto(
        int MalzemeId,
        decimal Miktar,
        decimal BirimFiyat,
        string Raf,
        string Huycre,
        MalzemeDurumuEnum MalzemeDurumu,
        string SatirAciklamasi
    );

    public record CreateHareketDto(
        HareketTipiEnum HareketTipi,
        DateTime Tarih,
        int? KaynakDepoId,
        int? HedefDepoId,
        string Aciklama,
        List<CreateHareketKalemDto> Kalemler
    );

    public record HareketKalemDto(
        int Id,
        int MalzemeId,
        string MalzemeKodu,
        string MalzemeAdi,
        string Birim,
        decimal Miktar,
        decimal BirimFiyat,
        decimal ToplamTutar,
        string Raf,
        string Huycre,
        MalzemeDurumuEnum MalzemeDurumu,
        string MalzemeDurumuAd,
        string SatirAciklamasi
    );

    public record HareketBaslikDto(
        int Id,
        string FisNo,
        HareketTipiEnum HareketTipi,
        string HareketTipiAd,
        DateTime Tarih,
        int? KaynakDepoId,
        string? KaynakDepoAd,
        int? HedefDepoId,
        string? HedefDepoAd,
        string Aciklama,
        bool IsIptal,
        string? IptalNedeni,
        DateTime? IptalTarihi,
        string OlusturanKullanici,
        DateTime CreatedAt,
        List<HareketKalemDto> Kalemler
    );

    public record IptalHareketDto(string IptalNedeni);

    // Stok Durum & Raporlama
    public record StokDurumDto(
        int MalzemeId,
        string MalzemeKodu,
        string MalzemeAdi,
        string Birim,
        int MalzemeGrubuId,
        string MalzemeGrubuAd,
        int DepoId,
        string DepoKodu,
        string DepoAdi,
        decimal Bakiye,
        decimal KritikStokSeviyesi,
        bool IsKritik
    );

    public record KartoteksItemDto(
        int HareketId,
        string FisNo,
        DateTime Tarih,
        HareketTipiEnum HareketTipi,
        string HareketTipiAd,
        int DepoId,
        string DepoAd,
        decimal GirisMiktari,
        decimal CikisMiktari,
        decimal YuruyenBakiye,
        string Raf,
        string Huycre,
        string MalzemeDurumuAd,
        string Aciklama
    );
}
