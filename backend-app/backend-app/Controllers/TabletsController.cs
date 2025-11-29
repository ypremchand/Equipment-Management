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
        // GET ALL TABLETS (same logic as laptops)
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

            // 1️⃣ SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower().Replace(" ", "");

                query = query.Where(t =>
                    ((t.Brand ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((t.Model ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((t.AssetTag ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((t.Processor ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((t.Ram ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((t.Storage ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((t.Location ?? "").ToLower().Replace(" ", "")).Contains(s)
                );
            }

            // 2️⃣ FILTERS
            if (!string.IsNullOrWhiteSpace(brand))
            {
                var b = brand.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => ((t.Brand ?? "").ToLower().Replace(" ", "")).Contains(b));
            }

            if (!string.IsNullOrWhiteSpace(ram))
            {
                var r = ram.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => ((t.Ram ?? "").ToLower().Replace(" ", "")).Contains(r));
            }

            if (!string.IsNullOrWhiteSpace(storage))
            {
                var st = storage.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => ((t.Storage ?? "").ToLower().Replace(" ", "")).Contains(st));
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                var loc = location.Trim().ToLower().Replace(" ", "");
                query = query.Where(t =>
                    ("," + ((t.Location ?? "").ToLower().Replace(" ", "")) + ",")
                        .Contains("," + loc + ","));
            }

            if (!string.IsNullOrWhiteSpace(networkType))
            {
                var nt = networkType.Trim().ToLower().Replace(" ", "");
                query = query.Where(t => ((t.NetworkType ?? "").ToLower().Replace(" ", "")).Contains(nt));
            }

            // 3️⃣ EXCLUDE ASSIGNED TABLETS
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType != null &&
                            a.Status == "Assigned" &&
                            a.AssetType.ToLower() == "tablet")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(t => !assignedIds.Contains(t.Id));

            // 4️⃣ SORTING
            bool desc = sortDir?.ToLower() == "desc";

            query = sortBy?.ToLower() switch
            {
                "brand" => desc ? query.OrderByDescending(t => t.Brand) : query.OrderBy(t => t.Brand),
                "model" => desc ? query.OrderByDescending(t => t.Model) : query.OrderBy(t => t.Model),
                "ram" => desc ? query.OrderByDescending(t => t.Ram) : query.OrderBy(t => t.Ram),
                "storage" => desc ? query.OrderByDescending(t => t.Storage) : query.OrderBy(t => t.Storage),
                "location" => desc ? query.OrderByDescending(t => t.Location) : query.OrderBy(t => t.Location),
                "processor" => desc ? query.OrderByDescending(t => t.Processor) : query.OrderBy(t => t.Processor),
                "networktype" => desc ? query.OrderByDescending(t => t.NetworkType) : query.OrderBy(t => t.NetworkType),
                _ => desc ? query.OrderByDescending(t => t.Id) : query.OrderBy(t => t.Id),
            };

            // 5️⃣ PAGINATION
            var totalItems = await query.CountAsync();
            var data = await query.Skip((page - 1) * pageSize)
                                  .Take(pageSize)
                                  .ToListAsync();

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                data
            });
        }

        // ============================================================
        // OPTIONS (same pattern as laptop/mobile)
        // ============================================================
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Tablets
                .Select(t => t.Brand)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rams = await _context.Tablets
                .Select(t => t.Ram)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var storages = await _context.Tablets
                .Select(t => t.Storage)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rawLocations = await _context.Tablets
                .Select(t => t.Location)
                .Where(x => !string.IsNullOrWhiteSpace(x))
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
        // CRUD (unchanged)
        // ============================================================

        [HttpGet("{id}")]
        public async Task<ActionResult<Tablet>> GetTablet(int id)
        {
            var tablet = await _context.Tablets
                .Include(t => t.Asset)
                .FirstOrDefaultAsync(t => t.Id == id);

            return tablet == null ? NotFound() : tablet;
        }

        [HttpPost]
        public async Task<ActionResult<Tablet>> PostTablet([FromBody] Tablet tablet)
        {
            if (tablet.AssetTag == null)
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Tablets
                .AnyAsync(t => (t.AssetTag ?? "").ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower() == "tablets")
                        ?? new Asset { Name = "Tablets", Quantity = 0 };

            if (asset.Id == 0)
            {
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            tablet.AssetId = asset.Id;

            _context.Tablets.Add(tablet);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTablet), new { id = tablet.Id }, tablet);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTablet(int id, [FromBody] Tablet tablet)
        {
            tablet.Id = id;

            bool exists = await _context.Tablets
                .AnyAsync(t => t.Id != id && (t.AssetTag ?? "").ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            _context.Entry(tablet).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            if (tablet.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(tablet.AssetId.Value);
                asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTablet(int id)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null) return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = tablet.AssetTag,
                ItemType = "Tablet",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };

            _context.AdminDeleteHistories.Add(history);

            var assetId = tablet.AssetId;

            _context.Tablets.Remove(tablet);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Tablets
                .AnyAsync(t => (t.AssetTag ?? "").ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
