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

        // Payload class so DamageReason is accepted but NOT stored in Mobiles table.
        public class MobilePayload : Mobile
        {
            public string? DamageReason { get; set; }
        }

        // ============================================================
        // GET ALL MOBILES (search, filters, pagination, exclude damaged)
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

            // 🔍 SEARCH
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

            // 🎯 FILTERS
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
                query = query.Where(m =>
                    ((m.NetworkType ?? "").ToLower().Replace(" ", "")).Contains(nt));
            }

            // 🚫 EXCLUDE ASSIGNED MOBILES
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType != null &&
                            a.Status == "Assigned" &&
                            a.AssetType.ToLower() == "mobile")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(m => !assignedIds.Contains(m.Id));

            // 🚫 EXCLUDE DAMAGED MOBILES
            var damagedIds = await _context.DamagedAssets
                .Where(d => d.AssetType.ToLower() == "mobile")
                .Select(d => d.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(m => !damagedIds.Contains(m.Id));

            // 🔽 SORTING
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

            // 📄 PAGINATION
            var totalItems = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
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
        // DROPDOWN OPTIONS
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
        // GET MOBILE BY ID
        // ============================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<Mobile>> GetMobile(int id)
        {
            var mobile = await _context.Mobiles
                .Include(m => m.Asset)
                .FirstOrDefaultAsync(m => m.Id == id);

            return mobile == null ? NotFound() : mobile;
        }

        // ============================================================
        // CREATE MOBILE (with damage workflow)
        // ============================================================
        [HttpPost]
        public async Task<ActionResult<Mobile>> PostMobile([FromBody] MobilePayload payload)
        {
            if (string.IsNullOrWhiteSpace(payload.AssetTag))
            {
                var usedTags = await _context.Mobiles
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


            bool exists = await _context.Mobiles
                .AnyAsync(m => (m.AssetTag ?? "").ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            // Assign asset
            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower() == "mobiles")
                        ?? new Asset { Name = "Mobiles", Quantity = 0 };

            if (asset.Id == 0)
            {
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            payload.AssetId = asset.Id;

            _context.Mobiles.Add(payload);
            await _context.SaveChangesAsync();

            // Update quantity
            asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
            await _context.SaveChangesAsync();

            // Damage handling
            if (!string.IsNullOrWhiteSpace(payload.Remarks) &&
                payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                    return BadRequest(new { message = "Damage reason is required when Remarks = Yes" });

                var damaged = new DamagedAsset
                {
                    AssetType = "Mobile",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReason,
                    ReportedAt = DateTime.Now
                };

                _context.DamagedAssets.Add(damaged);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetMobile), new { id = payload.Id }, payload);
        }

        // ============================================================
        // UPDATE MOBILE (with damage workflow)
        // ============================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMobile(int id, [FromBody] MobilePayload payload)
        {
            if (payload.Id != id)
                payload.Id = id;

            bool exists = await _context.Mobiles
                .AnyAsync(m => m.Id != id &&
                               (m.AssetTag ?? "").ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            // Update record
            _context.Entry(payload).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // Handle damage
            if (!string.IsNullOrWhiteSpace(payload.Remarks) &&
                payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                    return BadRequest(new { message = "Damage reason is required when Remarks = Yes" });

                var damaged = new DamagedAsset
                {
                    AssetType = "Mobile",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReason,
                    ReportedAt = DateTime.Now
                };

                _context.DamagedAssets.Add(damaged);
                await _context.SaveChangesAsync();
            }

            // Update asset quantity
            if (payload.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(payload.AssetId.Value);
                asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        // ============================================================
        // DELETE MOBILE
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMobile(int id, [FromBody] DeleteRequest req)
        {
            var mobile = await _context.Mobiles.FindAsync(id);
            if (mobile == null) return NotFound();

            var adminName = req?.AdminName ?? "Unknown Admin";

            var history = new AdminDeleteHistory
            {
                DeletedItemName = mobile.AssetTag ?? "Unknown",
                ItemType = "Mobile",
                AdminName = adminName,
                DeletedAt = DateTime.Now,
                Reason = req?.Reason ?? "No reason provided"
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
                    asset.Quantity = await _context.Mobiles.CountAsync(l => l.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ============================================================
        // GET NEXT AVAILABLE MOBILE ASSET TAG (from Purchase Orders)
        // ============================================================
        [HttpGet("next-asset-tag")]
        public async Task<IActionResult> GetNextAvailableAssetTag()
        {
            // 1️⃣ Get Mobile asset
            var mobileAsset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "mobiles");

            if (mobileAsset == null)
                return NotFound(new { message = "Mobile asset not found" });

            // 2️⃣ All mobile purchase tags ONLY
            var purchasedMobileTags = await _context.PurchaseOrderItems
                .Where(p =>
                    p.AssetId == mobileAsset.Id &&
                    p.AssetTag != null
                )
                .Select(p => p.AssetTag)
                .ToListAsync();

            if (!purchasedMobileTags.Any())
                return NotFound(new { message = "No mobile purchase tags found" });

            // 3️⃣ Tags already used by mobile
            var usedTags = await _context.Mobiles
                .Select(l => l.AssetTag)
                .Where(t => t != null)
                .ToListAsync();

            // 4️⃣ First unused MOB tag
            var nextTag = purchasedMobileTags
                .FirstOrDefault(tag => !usedTags.Contains(tag));

            if (nextTag == null)
                return NotFound(new { message = "No available mobile asset tags" });

            return Ok(new { assetTag = nextTag });
        }


        // ============================================================
        // CHECK DUPLICATE ASSET TAG
        // ============================================================
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Mobiles
                .AnyAsync(m => (m.AssetTag ?? "").ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
