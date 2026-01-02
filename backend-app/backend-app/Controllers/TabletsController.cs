using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Reflection;
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

        // Payload class (adds DamageReason only)
        public class TabletPayload : Tablet
        {
            public string? DamageReason { get; set; }
        }

        // ============================================================
        // GET ALL TABLETS (Search + Filters + Sorting + Pagination)
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

            // 🔍 SEARCH
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

            // 🎯 FILTERS
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
                query = query.Where(t =>
                    ((t.NetworkType ?? "").ToLower().Replace(" ", "")).Contains(nt));
            }

            // 🚫 EXCLUDE ASSIGNED TABLETS
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType != null &&
                            a.Status == "Assigned" &&
                            a.AssetType.ToLower() == "tablet")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(t => !assignedIds.Contains(t.Id));

            // 🚫 EXCLUDE DAMAGED TABLETS
            var damagedIds = await _context.DamagedAssets
                .Where(d => d.AssetType.ToLower() == "tablet")
                .Select(d => d.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(t => !damagedIds.Contains(t.Id));

            // 🔽 SORTING
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

            // 📄 PAGINATION
            var totalItems = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                data = items
            });
        }


        // ============================================================
        // DROPDOWN OPTIONS
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
        // GET SINGLE TABLET
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


        // ============================================================
        // CREATE TABLET (with damage handling)
        // ============================================================
        [HttpPost]
        public async Task<ActionResult<Tablet>> PostTablet([FromBody] TabletPayload payload)
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

            // Check duplicate
            bool exists = await _context.Tablets
                .AnyAsync(t => (t.AssetTag ?? "").ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "tablets");

            if (asset == null)
            {
                asset = new Asset { Name = "Tablets", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            payload.AssetId = asset.Id;

            _context.Tablets.Add(payload);
            await _context.SaveChangesAsync();

            // Update asset quantity
            asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
            await _context.SaveChangesAsync();

            // Handle damaged
            if (!string.IsNullOrWhiteSpace(payload.Remarks) &&
                payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                    return BadRequest(new { message = "Damage reason is required when Remarks = Yes" });

                var damaged = new DamagedAsset
                {
                    AssetType = "Tablet",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReason,
                    ReportedAt = DateTime.Now
                };

                _context.DamagedAssets.Add(damaged);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetTablet), new { id = payload.Id }, payload);
        }


        // ============================================================
        // UPDATE TABLET (with damage handling)
        // ============================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTablet(int id, [FromBody] TabletPayload payload)
        {
            if (payload.Id != id)
                payload.Id = id;

            // Duplicate check
            bool exists = await _context.Tablets
                .AnyAsync(t => t.Id != id &&
                               (t.AssetTag ?? "").ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another tablet with same AssetTag exists" });

            _context.Entry(payload).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch
            {
                if (!await _context.Tablets.AnyAsync(t => t.Id == id))
                    return NotFound();

                throw;
            }

            // Damage handling
            if (!string.IsNullOrWhiteSpace(payload.Remarks) &&
                payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                    return BadRequest(new { message = "Damage reason is required when Remarks = Yes" });

                var damaged = new DamagedAsset
                {
                    AssetType = "Tablet",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReason,
                    ReportedAt = DateTime.Now
                };

                _context.DamagedAssets.Add(damaged);
                await _context.SaveChangesAsync();
            }

            // update asset qty
            if (payload.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(payload.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }


        // ============================================================
        // DELETE TABLET
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTablet(int id, [FromBody] DeleteRequest req)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null)
                return NotFound();

            var adminName = req?.AdminName ?? "Unknown Admin";


            var history = new AdminDeleteHistory
            {
                DeletedItemName = tablet.AssetTag ?? "Unknown",
                ItemType = "Tablet",
                AdminName = adminName,
                DeletedAt = DateTime.Now,
                Reason = req?.Reason ?? "No reason provided"
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
                    asset.Quantity = await _context.Tablets.CountAsync(l => l.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }



        // ============================================================
        // GET NEXT AVAILABLE TABLET ASSET TAG (from Purchase Orders)
        // ============================================================

        [HttpGet("next-asset-tag")]
        public async Task<IActionResult> GetNextAvailableTabletAssetTag()
        {
            // 1️⃣ Get Tablet asset
            var tabletAsset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "tablets");

            if (tabletAsset == null)
                return NotFound(new { message = "Tablet asset not found" });

            // 2️⃣ All Tablet purchase tags ONLY
            var purchasedTabletTags = await _context.PurchaseOrderItems
                .Where(p =>
                    p.AssetId == tabletAsset.Id &&
                    p.AssetTag != null
                )
                .OrderBy(p => p.Id)
                .Select(p => p.AssetTag)
                .ToListAsync();

            if (!purchasedTabletTags.Any())
                return NotFound(new { message = "No tablet purchase tags found" });

            // 3️⃣ Used tablet tags
            var usedTags = await _context.Tablets
                .Select(t => t.AssetTag)
                .Where(t => t != null)
                .ToListAsync();

            // 4️⃣ First unused TAB tag
            var nextTag = purchasedTabletTags
                .FirstOrDefault(tag => !usedTags.Contains(tag));

            if (nextTag == null)
                return NotFound(new { message = "No available tablet asset tags" });

            return Ok(new { assetTag = nextTag });
        }


        // ============================================================
        // CHECK DUPLICATE ASSET TAG
        // ============================================================
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Tablets
                .AnyAsync(t => (t.AssetTag ?? "").ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
