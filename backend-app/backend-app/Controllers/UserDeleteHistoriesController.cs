using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserDeleteHistoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserDeleteHistoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetHistory(
     int page = 1,
     int pageSize = 10,
     string? search = "",
     string? user = "",
     string? type = "",
     DateTime? from = null,
     DateTime? to = null)
        {
            var query = _context.UserDeleteHistories.AsQueryable();

            // 🔍 Search (name/type/user)
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(x =>
                    x.DeletedItemName.Contains(search) ||
                    x.ItemType.Contains(search) ||
                    x.UserName.Contains(search));

            // Filter: User
            if (!string.IsNullOrWhiteSpace(user))
                query = query.Where(x => x.UserName == user);

            // Filter: Type
            if (!string.IsNullOrWhiteSpace(type))
                query = query.Where(x => x.ItemType == type);

            // Date range
            if (from.HasValue)
                query = query.Where(x => x.DeletedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(x => x.DeletedAt <= to.Value);

            // Pagination math
            int totalCount = await query.CountAsync();

            var results = await query
                .OrderByDescending(x => x.DeletedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Return paginated object
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
