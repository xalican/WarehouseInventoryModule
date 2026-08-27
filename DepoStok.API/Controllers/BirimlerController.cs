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
    public class BirimlerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BirimlerController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BirimDto>>> GetBirimler()
        {
            var list = await _context.Birimler
                .AsNoTracking()
                .Where(b => b.IsActive)
                .OrderBy(b => b.Ad)
                .ToListAsync();

            return Ok(list.Select(b => new BirimDto(b.Id, b.Ad, b.Sembol, b.IsActive)));
        }

        [HttpPost]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<ActionResult<BirimDto>> Create([FromBody] CreateBirimDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Ad))
                return BadRequest(new { message = "Birim adı boş olamaz." });

            var existing = await _context.Birimler
                .FirstOrDefaultAsync(b => b.Ad.ToLower() == dto.Ad.Trim().ToLower());

            if (existing != null)
            {
                if (!existing.IsActive)
                {
                    existing.IsActive = true;
                    await _context.SaveChangesAsync();
                }
                return Ok(new BirimDto(existing.Id, existing.Ad, existing.Sembol, existing.IsActive));
            }

            var birim = new Birim
            {
                Ad = dto.Ad.Trim(),
                Sembol = string.IsNullOrWhiteSpace(dto.Sembol) ? dto.Ad.Trim() : dto.Sembol.Trim(),
                IsActive = true
            };

            _context.Birimler.Add(birim);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBirimler), new { id = birim.Id }, new BirimDto(
                birim.Id, birim.Ad, birim.Sembol, birim.IsActive
            ));
        }
    }
}
