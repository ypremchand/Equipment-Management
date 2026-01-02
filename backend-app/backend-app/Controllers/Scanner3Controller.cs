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
    public class Scanner3Controller : ControllerBase
    {
        private readonly AppDbContext _context;

        public Scanner3Controller(AppDbContext context)
        {
            _context = context;
        }

        public class Scanner3Payload : Scanner3
        {
            public string? DamageReasonInput { get; set; }
        }

        // ============================================================
        // FIX AssetId for old Scanner3 records
        // ============================================================
        private async Task FixMissingAssetIds()
        {
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "scanner3(omr scanner)");

            if (asset == null)
            {
                asset = new Asset { Name = "Scanner3", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            var missing = await _context.Scanner3
                .Where(s => s.AssetId == null)
                .ToListAsync();

            if (missing.Count > 0)
            {
                foreach (var s in missing)
                    s.AssetId = asset.Id;

                await _context.SaveChangesAsync();

                asset.Quantity = await _context.Scanner3
                    .CountAsync(s => s.AssetId == asset.Id);

                await _context.SaveChangesAsync();
            }
        }

        // ============================================================
        // GET — All Scanner3 items (search, filter, sort, pagination)
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetScanner3(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "id",
            [FromQuery] string? sortDir = "asc",
            [FromQuery] string? brand = null,
            [FromQuery] string? type = null,
            [FromQuery] string? resolution = null,
            [FromQuery] string? location = null
        )
        {
            await FixMissingAssetIds();

            var query = _context.Scanner3
                .Include(s => s.Asset)   // 🔥 THIS WAS MISSING
                .AsQueryable();


            // 🔍 SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(x =>
                    x.Scanner3Brand.ToLower().Contains(s) ||
                    x.Scanner3Model.ToLower().Contains(s) ||
                    x.Scanner3AssetTag.ToLower().Contains(s) ||
                    x.Scanner3Type.ToLower().Contains(s) ||
                    x.Scanner3Resolution.ToLower().Contains(s) ||
                    x.Scanner3Location.ToLower().Contains(s)
                );
            }

            // 🎯 FILTERS
            if (!string.IsNullOrWhiteSpace(brand))
                query = query.Where(x => x.Scanner3Brand.ToLower().Contains(brand.ToLower()));

            if (!string.IsNullOrWhiteSpace(type))
                query = query.Where(x => x.Scanner3Type.ToLower().Contains(type.ToLower()));

            if (!string.IsNullOrWhiteSpace(resolution))
                query = query.Where(x => x.Scanner3Resolution.ToLower().Contains(resolution.ToLower()));

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(x => x.Scanner3Location.ToLower().Contains(location.ToLower()));

            // 🚫 EXCLUDE Assigned
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "scanner3" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(s => !assignedIds.Contains(s.Id));

            // 🚫 EXCLUDE Damaged
            query = query.Where(s =>
                string.IsNullOrEmpty(s.Remarks) ||
                s.Remarks.ToLower() != "yes"
            );

            // 🔽 SORT
            bool desc = sortDir == "desc";

            query = sortBy?.ToLower() switch
            {
                "brand" => desc ? query.OrderByDescending(x => x.Scanner3Brand) : query.OrderBy(x => x.Scanner3Brand),
                "model" => desc ? query.OrderByDescending(x => x.Scanner3Model) : query.OrderBy(x => x.Scanner3Model),
                "type" => desc ? query.OrderByDescending(x => x.Scanner3Type) : query.OrderBy(x => x.Scanner3Type),
                "resolution" => desc ? query.OrderByDescending(x => x.Scanner3Resolution) : query.OrderBy(x => x.Scanner3Resolution),
                "location" => desc ? query.OrderByDescending(x => x.Scanner3Location) : query.OrderBy(x => x.Scanner3Location),
                _ => desc ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id),
            };

            // PAGINATION
            var total = await query.CountAsync();
            var scanners = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var totalPages = (int)Math.Ceiling(total / (double)pageSize);

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems = total,
                totalPages,
                data = scanners
            });
        }

        // ============================================================
        // OPTIONS (Brand, Type, Resolution, Location)
        // ============================================================
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Scanner3
                .Select(s => s.Scanner3Brand)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var types = await _context.Scanner3
                .Select(s => s.Scanner3Type)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var resolutions = await _context.Scanner3
                .Select(s => s.Scanner3Resolution)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var locations = await _context.Scanner3
                .Select(s => s.Scanner3Location)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            return Ok(new { brands, types, resolutions, locations });
        }

        // ============================================================
        // GET ONE
        // ============================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetScanner(int id)
        {
            await FixMissingAssetIds();

            var scanner = await _context.Scanner3
                .Include(s => s.Asset)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (scanner == null)
                return NotFound();

            return Ok(scanner);
        }

        // ============================================================
        // CREATE
        // ============================================================
        [HttpPost]
        public async Task<IActionResult> CreateScanner([FromBody] Scanner3Payload payload)
        {
            bool exists = await _context.Scanner3
                .AnyAsync(s => s.Scanner3AssetTag.ToLower() == payload.Scanner3AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "scanner3(omr scanner)");


            if (asset == null)
            {
                asset = new Asset { Name = "Scanner3", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            payload.AssetId = asset.Id;

            _context.Scanner3.Add(payload);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Scanner3.CountAsync(s => s.AssetId == asset.Id);
            await _context.SaveChangesAsync();

            // DAMAGED
            if (payload.Remarks?.ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReasonInput))
                    return BadRequest(new { message = "Damage Reason is required when Remarks = Yes" });

                _context.DamagedAssets.Add(new DamagedAsset
                {
                    AssetType = "Scanner3",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.Scanner3AssetTag,
                    Reason = payload.DamageReasonInput,
                    ReportedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetScanner), new { id = payload.Id }, payload);
        }

        // ============================================================
        // UPDATE
        // ============================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateScanner(int id, [FromBody] Scanner3Payload payload)
        {
            if (payload.Id != id)
                payload.Id = id;

            bool exists = await _context.Scanner3
                .AnyAsync(s => s.Id != id &&
                               s.Scanner3AssetTag.ToLower() == payload.Scanner3AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another Scanner with same AssetTag exists" });

            if (!payload.AssetId.HasValue)
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower() == "scanner3");
                payload.AssetId = asset?.Id;
            }

            _context.Entry(payload).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // DAMAGE
            if (payload.Remarks?.ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReasonInput))
                    return BadRequest(new { message = "Damage Reason is required when Remarks = Yes" });

                _context.DamagedAssets.Add(new DamagedAsset
                {
                    AssetType = "Scanner3",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.Scanner3AssetTag,
                    Reason = payload.DamageReasonInput,
                    ReportedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        // ============================================================
        // DELETE
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteScanner(int id, [FromBody] DeleteRequest req)
        {
            var scanner = await _context.Scanner3.FindAsync(id);
            if (scanner == null)
                return NotFound();

            _context.AdminDeleteHistories.Add(new AdminDeleteHistory
            {
                DeletedItemName = scanner.Scanner3AssetTag,
                ItemType = "Scanner1",
                Reason = req.Reason,
                AdminName = req.AdminName,
                DeletedAt = DateTime.Now
            });

            int? assetId = scanner.AssetId;

            _context.Scanner3.Remove(scanner);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Scanner3.CountAsync(s => s.AssetId == asset.Id);
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }


        // ============================================================
        // GET NEXT AVAILABLE SCANNER3 ASSET TAG (from Purchase Orders)
        // ============================================================
        [HttpGet("next-asset-tag")]
        public async Task<IActionResult> GetNextAvailableScanner3AssetTag()
        {
            var scannerAsset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower().Contains("scanner3"));

            if (scannerAsset == null)
                return NotFound(new { message = "Scanner3 asset not found" });

            // All Scanner3 purchase tags
            var purchasedTags = await _context.PurchaseOrderItems
                .Where(p =>
                    p.AssetId == scannerAsset.Id &&
                    p.AssetTag != null
                )
                .OrderBy(p => p.Id)
                .Select(p => p.AssetTag)
                .ToListAsync();

            if (!purchasedTags.Any())
                return NotFound(new { message = "No scanner3 purchase tags found" });

            // Used tags
            var usedTags = await _context.Scanner3
                .Select(s => s.Scanner3AssetTag)
                .Where(t => t != null)
                .ToListAsync();

            // First unused tag
            var nextTag = purchasedTags.FirstOrDefault(t => !usedTags.Contains(t));

            if (nextTag == null)
                return NotFound(new { message = "No available scanner3 asset tags" });

            return Ok(new { assetTag = nextTag });
        }
        // ============================================================
        // DUPLICATE CHECK
        // ============================================================
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Scanner3
                .AnyAsync(s => s.Scanner3AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
