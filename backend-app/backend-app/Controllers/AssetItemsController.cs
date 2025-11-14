using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/asset-items")]
    public class AssetItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetItemsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable([FromQuery] string type)
        {
            if (string.IsNullOrWhiteSpace(type))
                return BadRequest("Asset type required.");

            type = type.ToLower();

            var assigned = await _context.AssignedAssets
                .Where(x => x.Status == "Assigned")
                .Select(x => x.AssetTypeItemId)
                .ToListAsync();

            if (type == "laptop")
                return Ok(await _context.Laptops.Where(x => !assigned.Contains(x.Id)).ToListAsync());

            if (type == "mobile")
                return Ok(await _context.Mobiles.Where(x => !assigned.Contains(x.Id)).ToListAsync());

            if (type == "tablet")
                return Ok(await _context.Tablets.Where(x => !assigned.Contains(x.Id)).ToListAsync());

            return BadRequest("Unsupported asset type: " + type);
        }
    }
}
