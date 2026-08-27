using System;
using System.Security.Claims;
using DepoStok.Domain;

namespace DepoStok.Application
{
    /// <summary>
    /// Controller'lar içinde Kullanıcı ID ve Yetki Bilgilerini Temiz Çeken Extension Metotlar
    /// </summary>
    public static class ClaimsExtensions
    {
        /// <summary>
        /// JWT Token içerisinden oturum açan kullanıcının Veritabanı ID'sini alır.
        /// </summary>
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int id) ? id : 0;
        }

        /// <summary>
        /// JWT Token içerisinden oturum açan kullanıcının Rol Kodunu alır (Örn: "Admin").
        /// </summary>
        public static string GetUserRole(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Role)?.Value ?? RoleConstants.GoruntuleyiciCode;
        }
    }
}
