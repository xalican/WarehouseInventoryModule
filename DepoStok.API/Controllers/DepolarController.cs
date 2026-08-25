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
    public class DepolarController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepolarController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepoDto>>> GetDepolar()
        {
            var list = await _context.Depolar.AsNoTracking().OrderBy(d => d.Kod).ToListAsync();
            return Ok(list.Select(d => new DepoDto(d.Id, d.Kod, d.Ad, d.Sorumlu, string.IsNullOrWhiteSpace(d.Bolge) ? "Marmara Bölgesi" : d.Bolge, d.IsActive)));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,DepoSorumlusu")]
        public async Task<ActionResult<DepoDto>> Create([FromBody] CreateDepoDto dto)
        {
            if (await _context.Depolar.AnyAsync(d => d.Kod == dto.Kod))
                return BadRequest(new { message = $"'{dto.Kod}' kodlu depo zaten mevcut." });

            var depo = new Depo
            {
                Kod = dto.Kod,
                Ad = dto.Ad,
                Sorumlu = dto.Sorumlu,
                Bolge = string.IsNullOrWhiteSpace(dto.Bolge) ? "Marmara Bölgesi" : dto.Bolge,
                IsActive = true
            };

            _context.Depolar.Add(depo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDepolar), new { id = depo.Id }, new DepoDto(
                depo.Id, depo.Kod, depo.Ad, depo.Sorumlu, depo.Bolge, depo.IsActive
            ));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,DepoSorumlusu")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDepoDto dto)
        {
            var d = await _context.Depolar.FindAsync(id);
            if (d == null) return NotFound();

            d.Kod = dto.Kod;
            d.Ad = dto.Ad;
            d.Sorumlu = dto.Sorumlu;
            d.Bolge = string.IsNullOrWhiteSpace(dto.Bolge) ? "Marmara Bölgesi" : dto.Bolge;
            d.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
