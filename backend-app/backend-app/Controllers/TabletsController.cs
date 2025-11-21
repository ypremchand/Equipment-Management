using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TabletsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TabletsController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET ALL (Filters + Search + Sorting + Pagination)
        // ============================================================
        [HttpGet]
        public async Task<ActionResult<object>> GetTablets(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "id",
            [FromQuery] string? sortDir = "asc",
            [FromQuery] string? brand = null,
            [FromQuery] string? ram = null,
            [FromQuery] string? storage = null,
            [FromQuery] string? location = null,
            [FromQuery] string? networkType = null
        )
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            var query = _context.Tablets
                .Include(t => t.Asset)
                .AsQueryable();

            // Remove assigned tablets
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "tablet" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(t => !assignedIds.Contains(t.Id));

            // 🔍 SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower().Replace(" ", "");

                query = query.Where(t =>
                    (t.Brand ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (t.Model ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (t.AssetTag ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (t.Processor ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (t.Ram ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (t.Storage ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (t.Location ?? "").ToLower().Replace(" ", "").Contains(s)
                );
            }

            // 🔽 FILTERS (partial match like laptops)
            if (!string.IsNullOrWhiteSpace(brand))
            {
                string b = brand.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => (t.Brand ?? "").ToLower().Replace(" ", "").Contains(b));
            }

            if (!string.IsNullOrWhiteSpace(ram))
            {
                string r = ram.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => (t.Ram ?? "").ToLower().Replace(" ", "").Contains(r));
            }

            if (!string.IsNullOrWhiteSpace(storage))
            {
                string s2 = storage.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => (t.Storage ?? "").ToLower().Replace(" ", "").Contains(s2));
            }

            // Multi-location matching
            if (!string.IsNullOrWhiteSpace(location))
            {
                string loc = location.Trim().ToLower().Replace(" ", "");
                query = query.Where(t =>
                    ("," + ((t.Location ?? "").ToLower().Replace(" ", "")) + ",")
                        .Contains("," + loc + ",")
                );
            }

            if (!string.IsNullOrWhiteSpace(networkType))
            {
                string nt = networkType.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => (t.NetworkType ?? "").ToLower().Replace(" ", "").Contains(nt));
            }

            // 🔽 SORT
            bool desc = sortDir?.ToLower() == "desc";

            query = sortBy?.ToLower() switch
            {
                "brand" => desc ? query.OrderByDescending(t => t.Brand) : query.OrderBy(t => t.Brand),
                "model" => desc ? query.OrderByDescending(t => t.Model) : query.OrderBy(t => t.Model),
                "ram" => desc ? query.OrderByDescending(t => t.Ram) : query.OrderBy(t => t.Ram),
                "storage" => desc ? query.OrderByDescending(t => t.Storage) : query.OrderBy(t => t.Storage),
                "location" => desc ? query.OrderByDescending(t => t.Location) : query.OrderBy(t => t.Location),
                "processor" => desc ? query.OrderByDescending(t => t.Processor) : query.OrderBy(t => t.Processor),
                _ => desc ? query.OrderByDescending(t => t.Id) : query.OrderBy(t => t.Id),
            };

            // 🔽 PAGINATION
            var totalItems = await query.CountAsync();

            var tablets = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages,
                data = tablets
            });
        }

        // ============================================================
        // OPTIONS (for dropdown lists)
        // ============================================================
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Tablets
                .Select(t => t.Brand)
                .Where(x => x != null && x != "")
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rams = await _context.Tablets
                .Select(t => t.Ram)
                .Where(x => x != null && x != "")
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var storages = await _context.Tablets
                .Select(t => t.Storage)
                .Where(x => x != null && x != "")
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            // Split multi-location strings
            var rawLocations = await _context.Tablets
                .Select(t => t.Location)
                .Where(x => x != null && x != "")
                .ToListAsync();

            var locations = rawLocations
                .SelectMany(x => x.Split(',', StringSplitOptions.RemoveEmptyEntries))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(x => x)
                .ToList();

            return Ok(new { brands, rams, storages, locations });
        }

        // ============================================================
        // REMAINING CRUD (same as before)
        // ============================================================

        [HttpGet("{id}")]
        public async Task<ActionResult<Tablet>> GetTablet(int id)
        {
            var tablet = await _context.Tablets
                .Include(t => t.Asset)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tablet == null)
                return NotFound();

            return tablet;
        }

        [HttpPost]
        public async Task<ActionResult<Tablet>> PostTablet([FromBody] Tablet tablet)
        {
            bool exists = await _context.Tablets
                .AnyAsync(t => t.AssetTag.ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower().Contains("tablet"));

            if (asset == null)
            {
                asset = new Asset { Name = "Tablets", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            tablet.AssetId = asset.Id;
            _context.Tablets.Add(tablet);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTablet), new { id = tablet.Id }, tablet);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTablet(int id, [FromBody] Tablet tablet)
        {
            if (id != tablet.Id)
                return BadRequest();

            bool exists = await _context.Tablets
                .AnyAsync(t => t.Id != id && t.AssetTag.ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another tablet with this asset tag already exists" });

            _context.Entry(tablet).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            if (tablet.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(tablet.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTablet(int id)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null)
                return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = tablet.AssetTag,
                ItemType = "Tablet",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };

            _context.AdminDeleteHistories.Add(history);

            int? assetId = tablet.AssetId;

            _context.Tablets.Remove(tablet);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Tablets
                .AnyAsync(t => t.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
