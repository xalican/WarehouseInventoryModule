using System;

namespace DepoStok.Domain
{
    /// <summary>
    /// Sistem Yetki ve Rol Tanımları (Rol ID, Kod ve Ad Eşleşmeleri)
    /// Veritabanındaki '1', '2' gibi Rol ID'lerinin anlaşılır karşılıklarını içerir.
    /// </summary>
    public static class RoleConstants
    {
        // Rol ID Sabitleri (Magic Numbers önlendi)
        public const int AdminId = 1;
        public const int DepoSorumlusuId = 2;
        public const int DepoPersoneliId = 3;
        public const int GoruntuleyiciId = 4;

        // Rol Kod Sabitleri (Authorize attribute ve token yetki sorguları için)
        public const string AdminCode = "Admin";
        public const string DepoSorumlusuCode = "DepoSorumlusu";
        public const string DepoPersoneliCode = "DepoPersoneli";
        public const string GoruntuleyiciCode = "Goruntuleyici";

        // Rol Ad Sabitleri (Arayüzde gösterilecek Türkçe unvanlar)
        public const string AdminName = "Yönetici";
        public const string DepoSorumlusuName = "Depo Sorumlusu";
        public const string DepoPersoneliName = "Depo Personeli";
        public const string GoruntuleyiciName = "Görüntüleyici";

        /// <summary>
        /// Rol ID değerini anlaşılır Rol Koduna çevirir (Örn: 1 -> "Admin")
        /// </summary>
        public static string GetRoleCode(int roleId)
        {
            return (UserRoleEnum)roleId switch
            {
                UserRoleEnum.Admin => AdminCode,
                UserRoleEnum.DepoSorumlusu => DepoSorumlusuCode,
                UserRoleEnum.DepoPersoneli => DepoPersoneliCode,
                UserRoleEnum.Goruntuleyici => GoruntuleyiciCode,
                _ => GoruntuleyiciCode
            };
        }

        /// <summary>
        /// Rol ID değerini kullanıcı dostu Rol Adına çevirir (Örn: 1 -> "Yönetici")
        /// </summary>
        public static string GetRoleName(int roleId)
        {
            return (UserRoleEnum)roleId switch
            {
                UserRoleEnum.Admin => AdminName,
                UserRoleEnum.DepoSorumlusu => DepoSorumlusuName,
                UserRoleEnum.DepoPersoneli => DepoPersoneliName,
                UserRoleEnum.Goruntuleyici => GoruntuleyiciName,
                _ => GoruntuleyiciName
            };
        }
    }
}
