using System;
using System.Threading.Tasks;
using DepoStok.Application;
using DepoStok.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DepoStok.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _authService.GetRolesAsync();
            return Ok(roles);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result == null)
            {
                return Unauthorized(new { message = OperationMessages.Auth.InvalidCredentials });
            }
            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            int userId = User.GetUserId();

            var profile = await _authService.GetProfileAsync(userId);
            if (profile == null) return NotFound(new { message = OperationMessages.Auth.UserNotFound });

            return Ok(profile);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            try
            {
                int userId = User.GetUserId();

                await _authService.UpdateProfileAsync(userId, dto);
                return Ok(new { message = OperationMessages.Auth.ProfileUpdatedSuccess });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            try
            {
                int userId = User.GetUserId();

                await _authService.ChangePasswordAsync(userId, dto);
                return Ok(new { message = OperationMessages.Auth.PasswordChangedSuccess });
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
    }
}
