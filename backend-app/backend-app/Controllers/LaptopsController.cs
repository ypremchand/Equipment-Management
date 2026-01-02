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

        // Payload class to accept extra damageReason in request body (not stored in Laptops table)
        public class LaptopPayload : Laptop
        {
            public string? DamageReason { get; set; }
        }

        private async Task FixMissingAssetIds()
        {
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "laptops");

            if (asset == null)
            {
                asset = new Asset { Name = "Laptops", PreCode = "LAP" };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            var missing = await _context.Laptops
                .Where(l => l.AssetId == null)
                .ToListAsync();

            if (missing.Count > 0)
            {
                foreach (var l in missing)
                    l.AssetId = asset.Id;

                await _context.SaveChangesAsync();

                asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }
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
            await FixMissingAssetIds();
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            var query = _context.Laptops
                .Include(l => l.Asset)
                .AsQueryable();

            // 🔍 SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower().Replace(" ", "");
                query = query.Where(l =>
                    ((l.Brand ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((l.ModelNumber ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((l.AssetTag ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((l.Processor ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((l.Ram ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((l.Storage ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((l.OperatingSystem ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((l.Location ?? "").ToLower().Replace(" ", "")).Contains(s)
                );
            }

            // 🎯 FILTERS (brand, ram, storage, location, os)
            if (!string.IsNullOrWhiteSpace(brand))
            {
                var b = brand.Trim().ToLower().Replace(" ", "");
                query = query.Where(l => ((l.Brand ?? "").ToLower().Replace(" ", "")).Contains(b));
            }

            if (!string.IsNullOrWhiteSpace(ram))
            {
                var r = ram.Trim().ToLower().Replace(" ", "");
                query = query.Where(l => ((l.Ram ?? "").ToLower().Replace(" ", "")).Contains(r));
            }

            if (!string.IsNullOrWhiteSpace(storage))
            {
                var st = storage.Trim().ToLower().Replace(" ", "");
                query = query.Where(l => ((l.Storage ?? "").ToLower().Replace(" ", "")).Contains(st));
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                var loc = location.Trim().ToLower().Replace(" ", "");
                query = query.Where(l =>
                    ("," + ((l.Location ?? "").ToLower().Replace(" ", "")) + ",")
                        .Contains("," + loc + ","));
            }

            if (!string.IsNullOrWhiteSpace(operatingSystem))
            {
                var os = operatingSystem.Trim().ToLower().Replace(" ", "");
                query = query.Where(l =>
                    ((l.OperatingSystem ?? "").ToLower().Replace(" ", "")).Contains(os));
            }

            // 🚫 EXCLUDE ASSIGNED LAPTOPS
            var assignedLaptopIds = await _context.AssignedAssets
                .Where(a =>
                    a.AssetType != null &&
                    a.Status == "Assigned" &&
                    a.AssetType.ToLower() == "laptop")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(l => !assignedLaptopIds.Contains(l.Id));

            // 🚫 EXCLUDE DAMAGED LAPTOPS (Remarks = "Yes")
            query = query.Where(l =>
                string.IsNullOrEmpty(l.Remarks) ||
                l.Remarks.ToLower() != "yes"
            );

            // 🔽 SORTING
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

            // 📄 PAGINATION
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


        // OPTIONS for dropdowns (brand/ram/storage/location)
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

            var rawLocations = await _context.Laptops
                .Select(l => l.Location)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToListAsync();

            var locations = rawLocations
                .SelectMany(x => x.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
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

        // GET SINGLE LAPTOP
        [HttpGet("{id}")]
        public async Task<ActionResult<Laptop>> GetLaptop(int id)
        {
            await FixMissingAssetIds();
            var laptop = await _context.Laptops
                .Include(l => l.Asset)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (laptop == null)
                return NotFound();

            return laptop;
        }

        // CREATE LAPTOP
        [HttpPost]
        public async Task<ActionResult<Laptop>> PostLaptop([FromBody] LaptopPayload payload)
        {
            if (string.IsNullOrWhiteSpace(payload.AssetTag))
            {
                var usedTags = await _context.Laptops
                    .Select(m => m.AssetTag)
                    .Where(t => t != null)
                    .ToListAsync();

                payload.AssetTag = await _context.PurchaseOrderItems
                    .Where(p => p.AssetTag != null && !usedTags.Contains(p.AssetTag))
                    .OrderBy(p => p.Id)
                    .Select(p => p.AssetTag)
                    .FirstOrDefaultAsync();

                if (payload.AssetTag == null)
                    return BadRequest(new { message = "No available asset tags" });
            }

            bool exists = await _context.Laptops
                .AnyAsync(l => (l.AssetTag ?? "").ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "laptops");

            if (asset == null)
            {
                asset = new Asset { Name = "Laptops", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            // payload is subclass of Laptop, safe to use directly when adding
            payload.AssetId = asset.Id;
            _context.Laptops.Add(payload);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // If Remarks == Yes, create DamagedAssets entry (store reason only in DamagedAssets)
            if (!string.IsNullOrWhiteSpace(payload.Remarks) && payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                {
                    // rollback: remove inserted laptop and return error OR choose to allow - here we return BadRequest
                    // remove saved laptop to keep DB consistent
                    _context.Laptops.Remove(payload);
                    await _context.SaveChangesAsync();
                    return BadRequest(new { message = "Damage reason is required when Remarks = Yes" });
                }

                var damaged = new DamagedAsset
                {
                    AssetType = "Laptop",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReason,
                    ReportedAt = DateTime.Now
                };

                _context.DamagedAssets.Add(damaged);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetLaptop), new { id = payload.Id }, payload);
        }

        // UPDATE LAPTOP
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLaptop(int id, [FromBody] LaptopPayload payload)
        {
            // Ensure id set
            if (id != payload.Id && payload.Id != 0)
                payload.Id = id;

            if (payload.AssetTag == null)
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Laptops
                .AnyAsync(l => l.Id != id && (l.AssetTag ?? "").ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another laptop with the same AssetTag exists" });

            // Update laptop entity - payload inherits Laptop so can be used directly
            _context.Entry(payload).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Laptops.AnyAsync(e => e.Id == id))
                    return NotFound();

                throw;
            }

            // If Remarks == Yes, create DamagedAssets entry (store reason only in DamagedAssets)
            if (!string.IsNullOrWhiteSpace(payload.Remarks) && payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                {
                    return BadRequest(new { message = "Damage reason is required when Remarks = Yes" });
                }

                var damaged = new DamagedAsset
                {
                    AssetType = "Laptop",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReason,
                    ReportedAt = DateTime.Now
                };

                _context.DamagedAssets.Add(damaged);
                await _context.SaveChangesAsync();
            }

            if (payload.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(payload.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }


        //Delete Laptop

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLaptop(int id, [FromBody] DeleteRequest req)
        {
            var laptop = await _context.Laptops.FindAsync(id);
            if (laptop == null)
                return NotFound();
            var adminName = req?.AdminName ?? "Unknown Admin";

            var history = new AdminDeleteHistory
            {
                DeletedItemName = laptop.AssetTag ?? "Unknown",
                ItemType = "Laptop",
                AdminName = adminName,
                DeletedAt = DateTime.Now,
                Reason = req?.Reason ?? "No reason provided"
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
        // GET NEXT AVAILABLE LAPTOP ASSET TAG (from Purchase Orders)
        // ============================================================
        [HttpGet("next-asset-tag")]
        public async Task<IActionResult> GetNextAvailableAssetTag()
        {
            // 1️⃣ Get Laptop asset
            var laptopAsset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "laptops");

            if (laptopAsset == null)
                return NotFound(new { message = "Laptop asset not found" });

            // 2️⃣ All laptop purchase tags ONLY
            var purchasedLaptopTags = await _context.PurchaseOrderItems
                .Where(p =>
                    p.AssetId == laptopAsset.Id &&
                    p.AssetTag != null
                )
                .Select(p => p.AssetTag)
                .ToListAsync();

            if (!purchasedLaptopTags.Any())
                return NotFound(new { message = "No laptop purchase tags found" });

            // 3️⃣ Tags already used by laptops
            var usedTags = await _context.Laptops
                .Select(l => l.AssetTag)
                .Where(t => t != null)
                .ToListAsync();

            // 4️⃣ First unused LAP tag
            var nextTag = purchasedLaptopTags
                .FirstOrDefault(tag => !usedTags.Contains(tag));

            if (nextTag == null)
                return NotFound(new { message = "No available laptop asset tags" });

            return Ok(new { assetTag = nextTag });
        }



        // CHECK DUPLICATE ASSET TAG
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Laptops
                .AnyAsync(l => (l.AssetTag ?? "").ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }

       

    }
}
