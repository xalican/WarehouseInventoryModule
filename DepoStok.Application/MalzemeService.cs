using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DepoStok.Domain;
using DepoStok.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DepoStok.Application
{
    public class MalzemeService
    {
        private readonly AppDbContext _context;

        public MalzemeService(AppDbContext context)
        {
            _context = context;
        }

        private async Task<List<int>> GetCategoryAndSubIdsAsync(int parentId)
        {
            var all = await _context.MalzemeGruplari.AsNoTracking().Select(g => new { g.Id, g.ParentId }).ToListAsync();
            var result = new List<int> { parentId };

            void FindSubs(int pid)
            {
                var children = all.Where(x => x.ParentId == pid).Select(x => x.Id).ToList();
                foreach (var cid in children)
                {
                    if (!result.Contains(cid))
                    {
                        result.Add(cid);
                        FindSubs(cid);
                    }
                }
            }

            FindSubs(parentId);
            return result;
        }

        public async Task<PagedResult<MalzemeDto>> GetMalzemelerPagedAsync(int? grupId, string? aramaMetni, int page = 1, int pageSize = 10)
        {
            var query = _context.Malzemeler
                .AsNoTracking()
                .Include(m => m.MalzemeGrubu)
                .AsQueryable();

            if (grupId.HasValue)
            {
                var subIds = await GetCategoryAndSubIdsAsync(grupId.Value);
                query = query.Where(m => subIds.Contains(m.MalzemeGrubuId));
            }

            if (!string.IsNullOrWhiteSpace(aramaMetni) && aramaMetni.Trim().Length >= 3)
            {
                var search = aramaMetni.Trim().ToLower();
                query = query.Where(m => m.Kod.ToLower().Contains(search) || m.Ad.ToLower().Contains(search));
            }

            int totalCount = await query.CountAsync();

            var list = await query
                .OrderBy(m => m.Kod)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<MalzemeDto>
            {
                Items = list.Select(m => m.ToDto()).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<IEnumerable<MalzemeGrubuDto>> GetGruplarAsync()
        {
            var list = await _context.MalzemeGruplari
                .AsNoTracking()
                .Include(g => g.Parent)
                .OrderBy(g => g.Kod)
                .ToListAsync();

            return list.Select(g => g.ToDto());
        }

        public async Task<MalzemeGrubuDto> CreateGrupAsync(CreateMalzemeGrubuDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Ad))
            {
                throw new ArgumentException("Kategori adı boş bırakılamaz.");
            }

            var kod = string.IsNullOrWhiteSpace(dto.Kod) 
                ? $"{DomainConstants.CategoryDefaults.GroupCodePrefix}{Guid.NewGuid().ToString("N")[..4].ToUpper()}" 
                : dto.Kod.Trim();

            var grup = new MalzemeGrubu
            {
                Kod = kod,
                Ad = dto.Ad.Trim(),
                ParentId = dto.ParentId
            };

            _context.MalzemeGruplari.Add(grup);
            await _context.SaveChangesAsync();

            return grup.ToDto();
        }

        public async Task<MalzemeDto> CreateMalzemeAsync(CreateMalzemeDto dto)
        {
            if (await _context.Malzemeler.AnyAsync(m => m.Kod == dto.Kod.Trim()))
            {
                throw new InvalidOperationException(string.Format(OperationMessages.Material.AlreadyExists, dto.Kod));
            }

            if (dto.MaxStokSeviyesi > 0 && dto.MaxStokSeviyesi < dto.KritikStokSeviyesi)
            {
                throw new ArgumentException(string.Format(OperationMessages.Material.MaxStockInvalid, dto.MaxStokSeviyesi, dto.KritikStokSeviyesi));
            }

            var malzeme = dto.ToEntity();
            _context.Malzemeler.Add(malzeme);
            await _context.SaveChangesAsync();

            var created = await _context.Malzemeler
                .AsNoTracking()
                .Include(m => m.MalzemeGrubu)
                .FirstAsync(m => m.Id == malzeme.Id);

            return created.ToDto();
        }

        public async Task<bool> UpdateMalzemeAsync(int id, UpdateMalzemeDto dto)
        {
            var m = await _context.Malzemeler.FindAsync(id);
            if (m == null)
            {
                throw new KeyNotFoundException(OperationMessages.Material.NotFound);
            }

            m.UpdateFromDto(dto);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
