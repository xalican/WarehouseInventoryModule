using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DepoStok.Domain;
using DepoStok.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DepoStok.Application
{
    public class BirimService
    {
        private readonly AppDbContext _context;

        public BirimService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<BirimDto>> GetBirimlerAsync()
        {
            var list = await _context.Birimler
                .AsNoTracking()
                .Where(b => b.IsActive)
                .OrderBy(b => b.Ad)
                .ToListAsync();

            return list.Select(b => b.ToDto());
        }

        public async Task<BirimDto> CreateBirimAsync(CreateBirimDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Ad))
            {
                throw new ArgumentException("Birim adı boş bırakılamaz.");
            }

            var existing = await _context.Birimler
                .FirstOrDefaultAsync(b => b.Ad.ToLower() == dto.Ad.Trim().ToLower());

            if (existing != null)
            {
                if (!existing.IsActive)
                {
                    existing.IsActive = true;
                    await _context.SaveChangesAsync();
                }
                return existing.ToDto();
            }

            var birim = dto.ToEntity();
            _context.Birimler.Add(birim);
            await _context.SaveChangesAsync();

            return birim.ToDto();
        }
    }
}
