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
    public class MobilesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MobilesController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET ALL MOBILES (same logic as laptops)
        // ============================================================
        [HttpGet]
        public async Task<ActionResult<object>> GetMobiles(
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

            var query = _context.Mobiles
                .Include(m => m.Asset)
                .AsQueryable();

            // 1️⃣ SEARCH (same as laptops)
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower().Replace(" ", "");

                query = query.Where(m =>
                    ((m.Brand ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((m.Model ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((m.AssetTag ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((m.Ram ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((m.Storage ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((m.Processor ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((m.Location ?? "").ToLower().Replace(" ", "")).Contains(s)
                );
            }

            // 2️⃣ FILTERS (same as laptop)
            if (!string.IsNullOrWhiteSpace(brand))
            {
                var b = brand.Trim().ToLower().Replace(" ", "");
                query = query.Where(m => ((m.Brand ?? "").ToLower().Replace(" ", "")).Contains(b));
            }

            if (!string.IsNullOrWhiteSpace(ram))
            {
                var r = ram.Trim().ToLower().Replace(" ", "");
                query = query.Where(m => ((m.Ram ?? "").ToLower().Replace(" ", "")).Contains(r));
            }

            if (!string.IsNullOrWhiteSpace(storage))
            {
                var st = storage.Trim().ToLower().Replace(" ", "");
                query = query.Where(m => ((m.Storage ?? "").ToLower().Replace(" ", "")).Contains(st));
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                var loc = location.Trim().ToLower().Replace(" ", "");
                query = query.Where(m =>
                    ("," + ((m.Location ?? "").ToLower().Replace(" ", "")) + ",")
                        .Contains("," + loc + ","));
            }

            if (!string.IsNullOrWhiteSpace(networkType))
            {
                var nt = networkType.Trim().ToLower().Replace(" ", "");
                query = query.Where(m => ((m.NetworkType ?? "").ToLower().Replace(" ", "")).Contains(nt));
            }

            // 3️⃣ EXCLUDE ASSIGNED MOBILES (same logic as laptop)
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType != null &&
                            a.Status == "Assigned" &&
                            a.AssetType.ToLower() == "mobile")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(m => !assignedIds.Contains(m.Id));

            // 4️⃣ SORTING (identical to laptop sort pattern)
            bool desc = sortDir?.ToLower() == "desc";

            query = sortBy?.ToLower() switch
            {
                "brand" => desc ? query.OrderByDescending(m => m.Brand) : query.OrderBy(m => m.Brand),
                "model" => desc ? query.OrderByDescending(m => m.Model) : query.OrderBy(m => m.Model),
                "ram" => desc ? query.OrderByDescending(m => m.Ram) : query.OrderBy(m => m.Ram),
                "storage" => desc ? query.OrderByDescending(m => m.Storage) : query.OrderBy(m => m.Storage),
                "location" => desc ? query.OrderByDescending(m => m.Location) : query.OrderBy(m => m.Location),
                "processor" => desc ? query.OrderByDescending(m => m.Processor) : query.OrderBy(m => m.Processor),
                "networktype" => desc ? query.OrderByDescending(m => m.NetworkType) : query.OrderBy(m => m.NetworkType),
                _ => desc ? query.OrderByDescending(m => m.Id) : query.OrderBy(m => m.Id),
            };

            // 5️⃣ PAGINATION
            var totalItems = await query.CountAsync();
            var data = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

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
        // OPTIONS (same style as Laptop options)
        // ============================================================
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Mobiles
                .Select(m => m.Brand)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rams = await _context.Mobiles
                .Select(m => m.Ram)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var storages = await _context.Mobiles
                .Select(m => m.Storage)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rawLocations = await _context.Mobiles
                .Select(m => m.Location)
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
        // REMAINING CRUD (unchanged)
        // ============================================================

        [HttpGet("{id}")]
        public async Task<ActionResult<Mobile>> GetMobile(int id)
        {
            var mobile = await _context.Mobiles
                .Include(m => m.Asset)
                .FirstOrDefaultAsync(m => m.Id == id);

            return mobile == null ? NotFound() : mobile;
        }

        [HttpPost]
        public async Task<ActionResult<Mobile>> PostMobile([FromBody] Mobile mobile)
        {
            if (mobile.AssetTag == null)
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Mobiles
                .AnyAsync(m => (m.AssetTag ?? "").ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower() == "mobiles")
                        ?? new Asset { Name = "Mobiles", Quantity = 0 };

            if (asset.Id == 0)
            {
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            mobile.AssetId = asset.Id;

            _context.Mobiles.Add(mobile);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMobile), new { id = mobile.Id }, mobile);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMobile(int id, [FromBody] Mobile mobile)
        {
            mobile.Id = id;

            bool exists = await _context.Mobiles
                .AnyAsync(m => m.Id != id && (m.AssetTag ?? "").ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            _context.Entry(mobile).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            if (mobile.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(mobile.AssetId.Value);
                asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMobile(int id)
        {
            var mobile = await _context.Mobiles.FindAsync(id);
            if (mobile == null) return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = mobile.AssetTag,
                ItemType = "Mobile",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };

            _context.AdminDeleteHistories.Add(history);

            var assetId = mobile.AssetId;

            _context.Mobiles.Remove(mobile);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Mobiles
                .AnyAsync(m => (m.AssetTag ?? "").ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
