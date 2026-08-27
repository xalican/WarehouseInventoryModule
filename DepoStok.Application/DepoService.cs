using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DepoStok.Domain;
using DepoStok.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DepoStok.Application
{
    public class DepoService
    {
        private readonly AppDbContext _context;

        public DepoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DepoDto>> GetDepolarAsync()
        {
            var list = await _context.Depolar.AsNoTracking().OrderBy(d => d.Kod).ToListAsync();
            return list.Select(d => d.ToDto());
        }

        public async Task<DepoDto> CreateDepoAsync(CreateDepoDto dto)
        {
            if (await _context.Depolar.AnyAsync(d => d.Kod == dto.Kod.Trim()))
            {
                throw new InvalidOperationException(string.Format(OperationMessages.Warehouse.AlreadyExists, dto.Kod));
            }

            var depo = dto.ToEntity();
            _context.Depolar.Add(depo);
            await _context.SaveChangesAsync();

            return depo.ToDto();
        }

        public async Task<bool> UpdateDepoAsync(int id, UpdateDepoDto dto)
        {
            var depo = await _context.Depolar.FindAsync(id);
            if (depo == null)
            {
                throw new KeyNotFoundException(OperationMessages.Warehouse.NotFound);
            }

            depo.UpdateFromDto(dto);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
