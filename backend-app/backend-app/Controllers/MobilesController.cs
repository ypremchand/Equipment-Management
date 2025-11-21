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

        // ✅ GET all mobiles (with pagination + search)
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

            // 🔥 Exclude assigned mobiles
            var assignedMobileIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "mobile" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(m => !assignedMobileIds.Contains(m.Id));

            // 🔎 SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower().Replace(" ", "");

                query = query.Where(m =>
                    (m.Brand ?? "").ToLower().Replace(" ", "").Contains(search) ||
                    (m.Model ?? "").ToLower().Replace(" ", "").Contains(search) ||
                    (m.AssetTag ?? "").ToLower().Replace(" ", "").Contains(search) ||
                    (m.Ram ?? "").ToLower().Replace(" ", "").Contains(search) ||
                    (m.Storage ?? "").ToLower().Replace(" ", "").Contains(search) ||
                    (m.Processor ?? "").ToLower().Replace(" ", "").Contains(search) ||
                    (m.Location ?? "").ToLower().Replace(" ", "").Contains(search)
                );
            }

            // 🎯 FILTERS — PARTIAL MATCH (same as laptops)
            if (!string.IsNullOrWhiteSpace(brand))
            {
                string b = brand.Trim().ToLower().Replace(" ", "");
                query = query.Where(m =>
                    (m.Brand ?? "").ToLower().Replace(" ", "").Contains(b)
                );
            }

            if (!string.IsNullOrWhiteSpace(ram))
            {
                string r = ram.Trim().ToLower().Replace(" ", "");
                query = query.Where(m =>
                    (m.Ram ?? "").ToLower().Replace(" ", "").Contains(r)
                );
            }

            if (!string.IsNullOrWhiteSpace(storage))
            {
                string st = storage.Trim().ToLower().Replace(" ", "");
                query = query.Where(m =>
                    (m.Storage ?? "").ToLower().Replace(" ", "").Contains(st)
                );
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                string loc = location.Trim().ToLower().Replace(" ", "");

                // Support multiple locations like "Bangalore, Chennai"
                query = query.Where(m =>
                    ("," + ((m.Location ?? "").ToLower().Replace(" ", "")) + ",")
                        .Contains("," + loc + ",")
                );
            }

            if (!string.IsNullOrWhiteSpace(networkType))
            {
                string nt = networkType.Trim().ToLower().Replace(" ", "");
                query = query.Where(m =>
                    (m.NetworkType ?? "").ToLower().Replace(" ", "").Contains(nt)
                );
            }

            // 🌀 SORT
            bool desc = sortDir?.ToLower() == "desc";

            query = sortBy?.ToLower() switch
            {
                "brand" => desc ? query.OrderByDescending(m => m.Brand) : query.OrderBy(m => m.Brand),
                "model" => desc ? query.OrderByDescending(m => m.Model) : query.OrderBy(m => m.Model),
                "ram" => desc ? query.OrderByDescending(m => m.Ram) : query.OrderBy(m => m.Ram),
                "storage" => desc ? query.OrderByDescending(m => m.Storage) : query.OrderBy(m => m.Storage),
                "location" => desc ? query.OrderByDescending(m => m.Location) : query.OrderBy(m => m.Location),
                "processor" => desc ? query.OrderByDescending(m => m.Processor) : query.OrderBy(m => m.Processor),
                _ => desc ? query.OrderByDescending(m => m.Id) : query.OrderBy(m => m.Id),
            };

            // 📄 PAGINATION
            var totalItems = await query.CountAsync();
            var mobiles = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                data = mobiles
            });
        }


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

            // raw locations
            var rawLocations = await _context.Mobiles
                .Select(m => m.Location)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToListAsync();

            // split + distinct
            var locations = rawLocations
                .SelectMany(l => l.Split(',', StringSplitOptions.RemoveEmptyEntries))
                .Select(l => l.Trim())
                .Where(l => l != "")
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(l => l)
                .ToList();

            return Ok(new { brands, rams, storages, locations });
        }




        // ✅ GET single mobile
        [HttpGet("{id}")]
        public async Task<ActionResult<Mobile>> GetMobile(int id)
        {
            var mobile = await _context.Mobiles
                .Include(m => m.Asset)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (mobile == null)
                return NotFound();

            return mobile;
        }

        // ✅ POST new mobile
        [HttpPost]
        public async Task<ActionResult<Mobile>> PostMobile([FromBody] Mobile mobile)
        {
            bool exists = await _context.Mobiles
                .AnyAsync(m => m.AssetTag.ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower().Contains("mobile"));

            if (asset == null)
            {
                asset = new Asset { Name = "Mobiles", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            mobile.AssetId = asset.Id;
            _context.Mobiles.Add(mobile);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMobile), new { id = mobile.Id }, mobile);
        }

        // ✅ PUT existing mobile
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMobile(int id, [FromBody] Mobile mobile)
        {
            mobile.Id = id;

            bool exists = await _context.Mobiles
                .AnyAsync(m => m.Id != id && m.AssetTag.ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another mobile with the same AssetTag exists" });

            _context.Entry(mobile).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Mobiles.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            if (mobile.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(mobile.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ DELETE + Log delete
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMobile(int id)
        {
            var mobile = await _context.Mobiles.FindAsync(id);
            if (mobile == null)
                return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = mobile.AssetTag,
                ItemType = "Mobile",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };
            _context.AdminDeleteHistories.Add(history);

            int? assetId = mobile.AssetId;

            _context.Mobiles.Remove(mobile);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ Duplicate assetTag check
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Mobiles
                .AnyAsync(m => m.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
