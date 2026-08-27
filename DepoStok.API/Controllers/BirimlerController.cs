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
    public class BirimlerController : ControllerBase
    {
        private readonly BirimService _birimService;

        public BirimlerController(BirimService birimService)
        {
            _birimService = birimService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BirimDto>>> GetBirimler()
        {
            var list = await _birimService.GetBirimlerAsync();
            return Ok(list);
        }

        [HttpPost]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<ActionResult<BirimDto>> Create([FromBody] CreateBirimDto dto)
        {
            try
            {
                var result = await _birimService.CreateBirimAsync(dto);
                return CreatedAtAction(nameof(GetBirimler), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
