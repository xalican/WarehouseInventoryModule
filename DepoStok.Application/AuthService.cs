using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using DepoStok.Domain;
using DepoStok.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DepoStok.Application
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<IEnumerable<Role>> GetRolesAsync()
        {
            return await _context.Roles.AsNoTracking().OrderBy(r => r.Id).ToListAsync();
        }

        public async Task<TokenDto?> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.KullaniciAdi == dto.KullaniciAdi && u.IsActive);
            
            if (user == null) return null;

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Parola, user.ParolaHash);
            if (!isPasswordValid) return null;

            var secretKey = _configuration["Jwt:SecretKey"] ?? "SUPER_SECRET_KEY_DEPO_STOK_MODULU_2026_ERP_SECURE_KEYS_MUST_BE_LONG";
            var issuer = _configuration["Jwt:Issuer"] ?? "DepoStokAPI";
            var audience = _configuration["Jwt:Audience"] ?? "DepoStokClient";
            var expirationMinutes = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Veritabanındaki Role ilişkisinden Kod çekilir, veritabanında yoksa Enum/Constant dönüşümü yapılır
            var roleCode = user.Role?.Kod ?? RoleConstants.GetRoleCode(user.RoleId);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.KullaniciAdi),
                new Claim("AdSoyad", user.AdSoyad),
                new Claim(ClaimTypes.Role, roleCode)
            };

            var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

            var tokenDescriptor = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiration,
                signingCredentials: credentials
            );

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenString = tokenHandler.WriteToken(tokenDescriptor);

            return new TokenDto(tokenString, user.KullaniciAdi, user.AdSoyad, roleCode, expiration);
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new KeyNotFoundException(OperationMessages.Auth.UserNotFound);

            bool isMevcutValid = BCrypt.Net.BCrypt.Verify(dto.MevcutParola, user.ParolaHash);
            if (!isMevcutValid) throw new InvalidOperationException(OperationMessages.Auth.InvalidCurrentPassword);

            user.ParolaHash = BCrypt.Net.BCrypt.HashPassword(dto.YeniParola);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object?> GetProfileAsync(int userId)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return null;

            return new
            {
                user.Id,
                user.KullaniciAdi,
                user.AdSoyad,
                user.Email,
                user.CreatedAt,
                user.IsActive,
                RolId = user.RoleId,
                // Dinamik olarak Veritabanındaki Roles tablosundan çekilir
                Rol = user.Role?.Kod ?? RoleConstants.GetRoleCode(user.RoleId),
                RolAd = user.Role?.Ad ?? RoleConstants.GetRoleName(user.RoleId)
            };
        }

        public async Task<bool> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new KeyNotFoundException(OperationMessages.Auth.UserNotFound);

            if (!string.IsNullOrWhiteSpace(dto.AdSoyad))
            {
                user.AdSoyad = dto.AdSoyad.Trim();
            }

            if (dto.Email != null)
            {
                user.Email = dto.Email.Trim();
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
