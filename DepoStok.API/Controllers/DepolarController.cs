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
    public class DepolarController : ControllerBase
    {
        private readonly DepoService _depoService;

        public DepolarController(DepoService depoService)
        {
            _depoService = depoService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepoDto>>> GetDepolar()
        {
            var result = await _depoService.GetDepolarAsync();
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<ActionResult<DepoDto>> Create([FromBody] CreateDepoDto dto)
        {
            try
            {
                var result = await _depoService.CreateDepoAsync(dto);
                return CreatedAtAction(nameof(GetDepolar), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDepoDto dto)
        {
            try
            {
                await _depoService.UpdateDepoAsync(id, dto);
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
