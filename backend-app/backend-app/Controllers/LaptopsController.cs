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
    public class LaptopsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LaptopsController(AppDbContext context)
        {
            _context = context;
        }

        private string Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? ""
                : value.Trim().ToLower().Replace(" ", "");
        }

        // ============================================================
        // GET ALL LAPTOPS (Search + Filters + Sorting + Pagination)
        // ============================================================
        [HttpGet]
        public async Task<ActionResult<object>> GetLaptops(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "id",
            [FromQuery] string? sortDir = "asc",
            [FromQuery] string? brand = null,
            [FromQuery] string? ram = null,
            [FromQuery] string? storage = null,
            [FromQuery] string? location = null,
            [FromQuery] string? operatingSystem = null
        )
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            // 1️⃣ START QUERY
            var query = _context.Laptops
                .Include(l => l.Asset)
                .AsQueryable();

            // 2️⃣ APPLY SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();

                query = query.Where(l =>
                    l.Brand.ToLower().Contains(s) ||
                    l.ModelNumber.ToLower().Contains(s) ||
                    l.AssetTag.ToLower().Contains(s) ||
                    l.Processor.ToLower().Contains(s) ||
                    l.Ram.ToLower().Contains(s) ||
                    l.Storage.ToLower().Contains(s) ||
                    l.OperatingSystem.ToLower().Contains(s) ||
                    l.Location.ToLower().Contains(s)
                );

            }

            // 3️⃣ APPLY FILTERS
            // 3️⃣ APPLY FILTERS (EF-friendly)
            if (!string.IsNullOrWhiteSpace(brand))
            {
                string b = brand.Trim().ToLower().Replace(" ", "");
                query = query.Where(l =>
                    (l.Brand ?? "").ToLower().Replace(" ", "").Contains(b)
                );
            }

            if (!string.IsNullOrWhiteSpace(ram))
            {
                string r = ram.Trim().ToLower().Replace(" ", "");
                query = query.Where(l =>
                    (l.Ram ?? "").ToLower().Replace(" ", "").Contains(r)
                );
            }

            if (!string.IsNullOrWhiteSpace(storage))
            {
                string s = storage.Trim().ToLower().Replace(" ", "");
                query = query.Where(l =>
                    (l.Storage ?? "").ToLower().Replace(" ", "").Contains(s)
                );
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                // normalize requested location (remove extra spaces and lower-case)
                string loc = location.Trim().ToLower().Replace(" ", "");

                // Build a pattern of comma-wrapped normalized locations so we can match whole items:
                // e.g. if stored "Bangalore, Chennai" -> we check ",bangalore,chennai,".Contains(",chennai,")
                query = query.Where(l =>
                    ("," + ((l.Location ?? "").ToLower().Replace(" ", "")) + ",").Contains("," + loc + ",")
                );
            }


            if (!string.IsNullOrWhiteSpace(operatingSystem))
            {
                string os = operatingSystem.Trim().ToLower().Replace(" ", "");
                query = query.Where(l =>
                    (l.OperatingSystem ?? "").ToLower().Replace(" ", "").Contains(os)
                );
            }



            // 4️⃣ SORTING
            bool desc = sortDir?.ToLower() == "desc";

            query = sortBy?.ToLower() switch
            {
                "brand" => desc ? query.OrderByDescending(l => l.Brand) : query.OrderBy(l => l.Brand),
                "modelnumber" => desc ? query.OrderByDescending(l => l.ModelNumber) : query.OrderBy(l => l.ModelNumber),
                "ram" => desc ? query.OrderByDescending(l => l.Ram) : query.OrderBy(l => l.Ram),
                "storage" => desc ? query.OrderByDescending(l => l.Storage) : query.OrderBy(l => l.Storage),
                "location" => desc ? query.OrderByDescending(l => l.Location) : query.OrderBy(l => l.Location),
                "processor" => desc ? query.OrderByDescending(l => l.Processor) : query.OrderBy(l => l.Processor),
                "operatingsystem" => desc ? query.OrderByDescending(l => l.OperatingSystem) : query.OrderBy(l => l.OperatingSystem),
                _ => desc ? query.OrderByDescending(l => l.Id) : query.OrderBy(l => l.Id),
            };

            // 5️⃣ REMOVE ASSIGNED LAPTOPS (AFTER SEARCH & FILTERS)
            var assignedLaptopIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "laptop" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(l => !assignedLaptopIds.Contains(l.Id));

            // 6️⃣ PAGINATION
            var totalItems = await query.CountAsync();

            var laptops = await query
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
                data = laptops
            });
        }

        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Laptops
                .Select(l => l.Brand)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rams = await _context.Laptops
                .Select(l => l.Ram)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var storages = await _context.Laptops
                .Select(l => l.Storage)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            // Fetch raw location strings from DB (e.g. "Bangalore, Chennai")
            var rawLocations = await _context.Laptops
                .Select(l => l.Location)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToListAsync();

            // Split (in-memory), normalize and distinct
            var locations = rawLocations
                .SelectMany(x => x.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x) // keep original capitalization if you want; or .ToLower() for normalized list
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(x => x)
                .ToList();

            return Ok(new
            {
                brands,
                rams,
                storages,
                locations
            });
        }



        // ============================================================
        // GET SINGLE LAPTOP BY ID
        // ============================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<Laptop>> GetLaptop(int id)
        {
            var laptop = await _context.Laptops
                .Include(l => l.Asset)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (laptop == null)
                return NotFound();

            return laptop;
        }

        // ============================================================
        // CREATE LAPTOP
        // ============================================================
        [HttpPost]
        public async Task<ActionResult<Laptop>> PostLaptop([FromBody] Laptop laptop)
        {
            bool exists = await _context.Laptops
                .AnyAsync(l => l.AssetTag.ToLower() == laptop.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower().Contains("laptop"));

            if (asset == null)
            {
                asset = new Asset { Name = "Laptops", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            laptop.AssetId = asset.Id;
            _context.Laptops.Add(laptop);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLaptop), new { id = laptop.Id }, laptop);
        }

        // ============================================================
        // UPDATE LAPTOP
        // ============================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLaptop(int id, [FromBody] Laptop laptop)
        {
            laptop.Id = id;

            bool exists = await _context.Laptops
                .AnyAsync(l => l.Id != id && l.AssetTag.ToLower() == laptop.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another laptop with the same AssetTag exists" });

            _context.Entry(laptop).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Laptops.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            if (laptop.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(laptop.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ============================================================
        // DELETE LAPTOP
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLaptop(int id)
        {
            var laptop = await _context.Laptops.FindAsync(id);
            if (laptop == null)
                return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = laptop.AssetTag,
                ItemType = "Laptop",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };

            _context.AdminDeleteHistories.Add(history);

            int? assetId = laptop.AssetId;

            _context.Laptops.Remove(laptop);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ============================================================
        // CHECK DUPLICATE ASSET TAG
        // ============================================================
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Laptops
                .AnyAsync(l => l.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
