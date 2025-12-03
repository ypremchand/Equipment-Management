using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminDeleteHistoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDeleteHistoriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET with pagination + filters
        [HttpGet]
        public async Task<IActionResult> GetHistory(
            int page = 1,
            int pageSize = 10,
            string? search = "",
            string? admin = "",
            string? type = "",
            DateTime? from = null,
            DateTime? to = null)
        {
            var query = _context.AdminDeleteHistories.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(x =>
                    x.DeletedItemName.Contains(search) ||
                    x.ItemType.Contains(search) ||
                    x.AdminName.Contains(search));

            if (!string.IsNullOrWhiteSpace(admin))
                query = query.Where(x => x.AdminName == admin);

            if (!string.IsNullOrWhiteSpace(type))
                query = query.Where(x => x.ItemType == type);

            if (from.HasValue)
                query = query.Where(x => x.DeletedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(x => x.DeletedAt <= to.Value);

            int totalCount = await query.CountAsync();

            var results = await query
                .OrderByDescending(x => x.DeletedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                page,
                pageSize,
                data = results
            });
        }
    }
}
