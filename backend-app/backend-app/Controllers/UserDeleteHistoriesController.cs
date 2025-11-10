using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserDeleteHistoriesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UserDeleteHistoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDeleteHistory>>> GetHistory()
        {
            return await _context.UserDeleteHistories
                .OrderByDescending(h => h.DeletedAt)
                .ToListAsync();
        }
    }
}
