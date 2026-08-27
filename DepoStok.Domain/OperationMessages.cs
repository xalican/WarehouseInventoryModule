namespace DepoStok.Domain
{
    /// <summary>
    /// Merkezi Operasyon ve Bildirim Mesajları (Hardcoded stringlerin önlenmesi için)
    /// </summary>
    public static class OperationMessages
    {
        // 🔐 Kimlik Doğrulama & Kullanıcı Profil Mesajları
        public static class Auth
        {
            public const string InvalidCredentials = "Geçersiz kullanıcı adı veya parola!";
            public const string UserNotFound = "Kullanıcı sistemde bulunamadı.";
            public const string InvalidCurrentPassword = "Mevcut parolanız hatalıdır.";
            public const string ProfileUpdatedSuccess = "Profil bilgileriniz başarıyla güncellendi.";
            public const string PasswordChangedSuccess = "Parolanız başarıyla güncellendi.";
            public const string FullNameRequired = "Ad Soyad alanı boş bırakılamaz.";
            public const string MinimumPasswordLength = "Yeni parola en az 6 karakter olmalıdır.";
            public const string PasswordMismatch = "Yeni parolalar birbiriyle eşleşmiyor.";
            public const string SystemError = "İşlem gerçekleştirilirken bir sunucu hatası oluştu.";
        }

        // 🏢 Depo Operasyon Mesajları
        public static class Warehouse
        {
            public const string AlreadyExists = "'{0}' kodlu depo sistemde zaten mevcut.";
            public const string NotFound = "Aranan depo lokasyonu bulunamadı.";
            public const string DeactivationBlockedActiveStock = "Bu depoda aktif fiziksel stok ({0} Adet) bulunduğu için pasife alınamaz veya silinemez!";
            public const string CreatedSuccess = "Yeni depo başarıyla sisteme tanımlandı.";
            public const string UpdatedSuccess = "Depo bilgileri başarıyla güncellendi.";
        }

        // 📦 Malzeme Kartı Mesajları
        public static class Material
        {
            public const string AlreadyExists = "'{0}' kodlu malzeme kartı zaten mevcut.";
            public const string NotFound = "Aranan malzeme kartı bulunamadı.";
            public const string MaxStockInvalid = "Maksimum stok seviyesi ({0}), kritik stok seviyesinden ({1}) küçük olamaz!";
            public const string CreatedSuccess = "Yeni malzeme kartı başarıyla eklendi.";
            public const string UpdatedSuccess = "Malzeme bilgileri başarıyla güncellendi.";
        }

        // 📝 Stok Hareketi (Fiş) Mesajları
        public static class StockMovement
        {
            public const string AtLeastOneItemRequired = "En az bir hareket kalemi girilmelidir.";
            public const string InboundTargetRequired = "Giriş hareketinde hedef depo seçilmesi zorunludur.";
            public const string OutboundSourceRequired = "Çıkış hareketinde kaynak depo seçilmesi zorunludur.";
            public const string TransferWarehousesRequired = "Transfer hareketinde kaynak ve hedef depo seçilmesi zorunludur.";
            public const string SameWarehouseTransferError = "Kaynak depo ile hedef depo aynı olamaz!";
            public const string ScrapActionProhibited = "Hurda Stok Kullanılamaz! '{0}' hurda durumunda olduğu için çıkış veya transfer edilemez.";
            public const string InsufficientBalance = "Yetersiz Stok! '{0}' için kaynak depodaki bakiye: {1} Adet, istenen çıkış: {2} Adet.";
            public const string CancelBlockedNegativeStock = "İptal Edilemez! Giriş/transfer fişi iptal edildiğinde hedef depodaki bakiye eksiye düşecektir.";
            public const string AlreadyCancelled = "Bu stok fişi zaten iptal edilmiştir.";
            public const string CancelSuccess = "Stok hareket fişi başarıyla iptal edildi.";
            public const string VoucherNotFound = "Stok hareket fişi bulunamadı.";
            public const string CreatedSuccess = "Stok hareketi fişi başarıyla oluşturuldu.";
        }

        // 📁 Kategori ve Birim Mesajları
        public static class CategoryAndUnit
        {
            public const string UnitAlreadyExists = "'{0}' adlı ölçü birimi zaten sistemde mevcut.";
            public const string GroupAlreadyExists = "'{0}' adlı malzeme grubu zaten sistemde mevcut.";
            public const string UnitCreatedSuccess = "Yeni ölçü birimi başarıyla eklendi.";
            public const string GroupCreatedSuccess = "Yeni malzeme kategorisi eklendi.";
        }
    }
}
