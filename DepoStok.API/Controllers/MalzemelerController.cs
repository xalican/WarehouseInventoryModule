using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DepoStok.Application;
using DepoStok.Domain;
using DepoStok.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DepoStok.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MalzemelerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MalzemelerController(AppDbContext context)
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

        [HttpGet]
        public async Task<ActionResult<PagedResult<MalzemeDto>>> GetMalzemeler(
            [FromQuery] int? grupId,
            [FromQuery] string? q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
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

            if (!string.IsNullOrWhiteSpace(q) && q.Trim().Length >= 3)
            {
                var search = q.Trim().ToLower();
                query = query.Where(m => m.Kod.ToLower().Contains(search) || m.Ad.ToLower().Contains(search));
            }

            int totalCount = await query.CountAsync();

            var list = await query
                .OrderBy(m => m.Kod)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = list.Select(m => new MalzemeDto(
                m.Id,
                m.Kod,
                m.Ad,
                m.Birim,
                m.MalzemeGrubuId,
                m.MalzemeGrubu?.Ad ?? "",
                m.MarkaModel,
                m.TeknikOzellik,
                m.KritikStokSeviyesi,
                m.MaxStokSeviyesi,
                m.Aciklama,
                m.IsActive
            )).ToList();

            return Ok(new PagedResult<MalzemeDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpGet("gruplar")]
        public async Task<ActionResult<IEnumerable<MalzemeGrubuDto>>> GetGruplar()
        {
            var list = await _context.MalzemeGruplari
                .AsNoTracking()
                .Include(g => g.Parent)
                .OrderBy(g => g.Kod)
                .ToListAsync();

            return Ok(list.Select(g => new MalzemeGrubuDto(
                g.Id,
                g.Kod,
                g.Ad,
                g.ParentId,
                g.Parent?.Ad
            )));
        }

        [HttpPost("gruplar")]
        [Authorize(Roles = "Admin,DepoSorumlusu")]
        public async Task<ActionResult<MalzemeGrubuDto>> CreateGrup([FromBody] CreateMalzemeGrubuDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Ad))
                return BadRequest(new { message = "Kategori adı boş olamaz." });

            var kod = string.IsNullOrWhiteSpace(dto.Kod) ? $"GRP-{Guid.NewGuid().ToString()[..4].ToUpper()}" : dto.Kod.Trim();

            var g = new MalzemeGrubu
            {
                Kod = kod,
                Ad = dto.Ad.Trim(),
                ParentId = dto.ParentId
            };

            _context.MalzemeGruplari.Add(g);
            await _context.SaveChangesAsync();

            return Ok(new MalzemeGrubuDto(g.Id, g.Kod, g.Ad, g.ParentId));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,DepoSorumlusu")]
        public async Task<ActionResult<MalzemeDto>> Create([FromBody] CreateMalzemeDto dto)
        {
            if (await _context.Malzemeler.AnyAsync(m => m.Kod == dto.Kod))
                return BadRequest(new { message = $"'{dto.Kod}' kodlu malzeme zaten mevcut." });

            var malzeme = new Malzeme
            {
                Kod = dto.Kod,
                Ad = dto.Ad,
                Birim = dto.Birim,
                MalzemeGrubuId = dto.MalzemeGrubuId,
                MarkaModel = dto.MarkaModel,
                TeknikOzellik = dto.TeknikOzellik,
                KritikStokSeviyesi = dto.KritikStokSeviyesi,
                MaxStokSeviyesi = dto.MaxStokSeviyesi > 0 ? dto.MaxStokSeviyesi : 1000,
                Aciklama = dto.Aciklama,
                IsActive = true
            };

            _context.Malzemeler.Add(malzeme);
            await _context.SaveChangesAsync();

            var created = await _context.Malzemeler.AsNoTracking().Include(m => m.MalzemeGrubu).FirstAsync(m => m.Id == malzeme.Id);

            return CreatedAtAction(nameof(GetMalzemeler), new { id = created.Id }, new MalzemeDto(
                created.Id,
                created.Kod,
                created.Ad,
                created.Birim,
                created.MalzemeGrubuId,
                created.MalzemeGrubu?.Ad ?? "",
                created.MarkaModel,
                created.TeknikOzellik,
                created.KritikStokSeviyesi,
                created.MaxStokSeviyesi,
                created.Aciklama,
                created.IsActive
            ));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,DepoSorumlusu")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMalzemeDto dto)
        {
            var m = await _context.Malzemeler.FindAsync(id);
            if (m == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Birim)) m.Birim = dto.Birim;
            m.MalzemeGrubuId = dto.MalzemeGrubuId;
            m.MarkaModel = dto.MarkaModel;
            m.TeknikOzellik = dto.TeknikOzellik;
            m.KritikStokSeviyesi = dto.KritikStokSeviyesi;
            m.MaxStokSeviyesi = dto.MaxStokSeviyesi;
            m.Aciklama = dto.Aciklama;
            m.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
