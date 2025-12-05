using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin
        [HttpGet]
        public async Task<IActionResult> GetAdmins()
        {
            var admins = await _context.Admins
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.Email,
                    a.PhoneNumber
                })
                .ToListAsync();

            return Ok(admins);
        }
    }
}
