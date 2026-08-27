using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DepoStok.Application;
using DepoStok.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepoStok.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MalzemelerController : ControllerBase
    {
        private readonly MalzemeService _malzemeService;

        public MalzemelerController(MalzemeService malzemeService)
        {
            _malzemeService = malzemeService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<MalzemeDto>>> GetMalzemeler(
            [FromQuery] int? grupId,
            [FromQuery] string? q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var paged = await _malzemeService.GetMalzemelerPagedAsync(grupId, q, page, pageSize);
            return Ok(paged);
        }

        [HttpGet("gruplar")]
        public async Task<ActionResult<IEnumerable<MalzemeGrubuDto>>> GetGruplar()
        {
            var gruplar = await _malzemeService.GetGruplarAsync();
            return Ok(gruplar);
        }

        [HttpPost("gruplar")]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<ActionResult<MalzemeGrubuDto>> CreateGrup([FromBody] CreateMalzemeGrubuDto dto)
        {
            try
            {
                var result = await _malzemeService.CreateGrupAsync(dto);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<ActionResult<MalzemeDto>> Create([FromBody] CreateMalzemeDto dto)
        {
            try
            {
                var result = await _malzemeService.CreateMalzemeAsync(dto);
                return CreatedAtAction(nameof(GetMalzemeler), new { id = result.Id }, result);
            }
            catch (Exception ex) when (ex is InvalidOperationException || ex is ArgumentException)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMalzemeDto dto)
        {
            try
            {
                await _malzemeService.UpdateMalzemeAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
