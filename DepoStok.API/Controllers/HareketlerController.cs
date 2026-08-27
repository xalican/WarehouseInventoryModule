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
    public class HareketlerController : ControllerBase
    {
        private readonly StokService _stokService;

        public HareketlerController(StokService stokService)
        {
            _stokService = stokService;
        }

        // 1. Hareket Listesi (Paged)
        [HttpGet]
        public async Task<ActionResult<PagedResult<HareketBaslikDto>>> GetHareketler(
            [FromQuery] HareketTipiEnum? tip,
            [FromQuery] int? depoId,
            [FromQuery] int? malzemeId,
            [FromQuery] DateTime? baslangic,
            [FromQuery] DateTime? bitis,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var paged = await _stokService.GetHareketlerPagedAsync(tip, depoId, malzemeId, baslangic, bitis, page, pageSize);
            return Ok(paged);
        }

        // 2. Hareket Detay
        [HttpGet("{id}")]
        public async Task<ActionResult<HareketBaslikDto>> GetById(int id)
        {
            var item = await _stokService.GetHareketByIdAsync(id);
            if (item == null) return NotFound(new { message = OperationMessages.StockMovement.VoucherNotFound });
            return Ok(item);
        }

        // 3. Fiş / Stok Hareketi Ekleme
        [HttpPost]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode + "," + RoleConstants.DepoPersoneliCode)]
        public async Task<ActionResult<HareketBaslikDto>> Create([FromBody] CreateHareketDto dto)
        {
            try
            {
                int userId = User.GetUserId();

                var result = await _stokService.CreateHareketAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = OperationMessages.Auth.SystemError, detail = ex.Message });
            }
        }

        // 4. Hareket İptali
        [HttpPost("{id}/iptal")]
        [Authorize(Roles = RoleConstants.AdminCode + "," + RoleConstants.DepoSorumlusuCode)]
        public async Task<IActionResult> IptalEt(int id, [FromBody] IptalHareketDto dto)
        {
            try
            {
                int userId = User.GetUserId();

                await _stokService.IptalEtAsync(id, dto.IptalNedeni, userId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 5. Stok Durum Ekranı (Paged & Anlık Bakiye & Kritik Stok Uyarısı)
        [HttpGet("stok-durum")]
        public async Task<ActionResult<PagedResult<StokDurumDto>>> GetStokDurum(
            [FromQuery] int? depoId,
            [FromQuery] int? malzemeGrubuId,
            [FromQuery] string? q,
            [FromQuery] bool? kritik,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var paged = await _stokService.GetStokDurumPagedAsync(depoId, malzemeGrubuId, q, kritik, page, pageSize);
            return Ok(paged);
        }

        // 6. Hareket Defteri / Kartoteks (Paged & Yürüyen Bakiyeli Listeleme)
        [HttpGet("kartoteks/{malzemeId}")]
        public async Task<ActionResult<PagedResult<KartoteksItemDto>>> GetKartoteks(
            int malzemeId,
            [FromQuery] int? depoId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var paged = await _stokService.GetKartoteksPagedAsync(malzemeId, depoId, page, pageSize);
            return Ok(paged);
        }
    }
}
