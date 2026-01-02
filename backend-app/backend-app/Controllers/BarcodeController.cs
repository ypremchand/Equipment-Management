using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{

    [ApiController]
    [Route("api/barcodes")] 
    public class BarcodeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BarcodeController(AppDbContext context)
        {
            _context = context;
        }

        // Payload class to accept extra damageReason in request body (not stored in Barcodes table)
        public class BarcodePayload : Barcode
        {
            public string? DamageReason { get; set; }
        }
        // ============================================================
        // GET ALL BARCODE (Search + Filters + Sorting + Pagination)
        // ============================================================
        [HttpGet]
        public async Task<ActionResult<object>> GetBarcodes(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "id",
            [FromQuery] string? sortDir = "asc",
            [FromQuery] string? brand = null,
            [FromQuery] string? type = null,
            [FromQuery] string? technology = null,
            [FromQuery] string? location = null
          
        )
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            var query = _context.Barcodes
                .Include(l => l.Asset)
                .AsQueryable();

            // 🔍 SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower().Replace(" ", "");
                query = query.Where(b =>
                    ((b.Brand ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((b.Model ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((b.AssetTag ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((b.Type ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((b.Technology ?? "").ToLower().Replace(" ", "")).Contains(s) ||
                    ((b.Location ?? "").ToLower().Replace(" ", "")).Contains(s)
                );
            }


            // 🎯 FILTERS (brand, type, technology, location, os)
            if (!string.IsNullOrWhiteSpace(brand))
            {
                var b = brand.Trim().ToLower();
                query = query.Where(x => x.Brand.ToLower().Contains(b));
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                var t = type.Trim().ToLower();
                query = query.Where(x => x.Type.ToLower().Contains(t));
            }

            if (!string.IsNullOrWhiteSpace(technology))
            {
                var tech = technology.Trim().ToLower();
                query = query.Where(x => x.Technology.ToLower().Contains(tech));
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                var loc = location.Trim().ToLower();
                query = query.Where(x => x.Location.ToLower().Contains(loc));
            }


            // 🚫 EXCLUDE ASSIGNED BARCODE SCANNER
            var assignedBarcodeIds = await _context.AssignedAssets
                .Where(a =>
                    a.AssetType != null &&
                    a.Status == "Assigned" &&
                    a.AssetType.ToLower() == "barcode")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(l => !assignedBarcodeIds.Contains(l.Id));

            // 🚫 EXCLUDE DAMAGED BARCODE SCANNERS (Remarks = "Yes")
            query = query.Where(l =>
                string.IsNullOrEmpty(l.Remarks) ||
                l.Remarks.ToLower() != "yes"
            );

            // 🔽 SORTING
            bool desc = sortDir?.ToLower() == "desc";

            query = sortBy?.ToLower() switch
            {
                "brand" =>
                    desc ? query.OrderByDescending(b => b.Brand)
                         : query.OrderBy(b => b.Brand),

                "model" =>
                    desc ? query.OrderByDescending(b => b.Model)
                         : query.OrderBy(b => b.Model),

                "type" =>
                    desc ? query.OrderByDescending(b => b.Type)
                         : query.OrderBy(b => b.Type),

                "technology" =>
                    desc ? query.OrderByDescending(b => b.Technology)
                         : query.OrderBy(b => b.Technology),

                "assettag" =>
                    desc ? query.OrderByDescending(b => b.AssetTag)
                         : query.OrderBy(b => b.AssetTag),

                "location" =>
                    desc ? query.OrderByDescending(b => b.Location)
                         : query.OrderBy(b => b.Location),

                "purchasedate" =>
                    desc ? query.OrderByDescending(b => b.PurchaseDate)
                         : query.OrderBy(b => b.PurchaseDate),

                _ =>
                    desc ? query.OrderByDescending(b => b.Id)
                         : query.OrderBy(b => b.Id),
            };


            // 📄 PAGINATION
            var totalItems = await query.CountAsync();
            var barcodes = await query
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
                data = barcodes
            });
        }


        // OPTIONS for dropdowns (brand/type/technology/location)
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Barcodes
                .Select(l => l.Brand)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var types = await _context.Barcodes
                .Select(l => l.Type)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var technology = await _context.Barcodes
                .Select(l => l.Technology)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var locations = await _context.Barcodes
               .Select(l => l.Location)
               .Where(x => !string.IsNullOrWhiteSpace(x))
               .Distinct()
               .OrderBy(x => x)
               .ToListAsync();

            return Ok(new
            {
                brands,
                types,
                technology,
                locations
            });
        }
        // GET SINGLE BARCODE
        [HttpGet("{id}")]
        public async Task<ActionResult<Barcode>> GetBarcode(int id)
        {
            var barcode = await _context.Barcodes
                .Include(b => b.Asset)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (barcode == null)
                return NotFound();

            return Ok(barcode);
        }

        // CREATE BARCODE SCANNER
        [HttpPost]
        public async Task<ActionResult<Barcode>> PostBarcode([FromBody] BarcodePayload payload)
        {
            if (string.IsNullOrWhiteSpace(payload.AssetTag))
                return BadRequest(new { message = "AssetTag is required" });

            // 🔁 Duplicate AssetTag check
            bool exists = await _context.Barcodes
                .AnyAsync(b => b.AssetTag.ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            // 🔗 Get or create Asset entry
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "barcode scanners");

            if (asset == null)
            {
                asset = new Asset
                {
                    Name = "Barcode Scanners",
                    Quantity = 0
                };

                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            // 🔗 Attach asset
            payload.AssetId = asset.Id;

            // 💾 Save barcode
            _context.Barcodes.Add(payload);
            await _context.SaveChangesAsync();

            // 🔢 Update asset quantity
            asset.Quantity = await _context.Barcodes.CountAsync(b => b.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // ⚠️ Damaged asset handling
            if (!string.IsNullOrWhiteSpace(payload.Remarks) &&
                payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                {
                    // rollback
                    _context.Barcodes.Remove(payload);
                    await _context.SaveChangesAsync();

                    return BadRequest(new
                    {
                        message = "Damage reason is required when Remarks = Yes"
                    });
                }

                var damaged = new DamagedAsset
                {
                    AssetType = "barcodescanner",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReason,
                    ReportedAt = DateTime.Now
                };

                _context.DamagedAssets.Add(damaged);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetBarcode), new { id = payload.Id }, payload);
        }

        // UPDATE BARCODE SCANNER
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBarcode(int id, [FromBody] BarcodePayload payload)
        {
            // Ensure ID consistency
            if (payload.Id == 0)
                payload.Id = id;

            if (id != payload.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (string.IsNullOrWhiteSpace(payload.AssetTag))
                return BadRequest(new { message = "AssetTag is required" });

            // 🔁 Duplicate AssetTag check
            bool exists = await _context.Barcodes
                .AnyAsync(b => b.Id != id &&
                               b.AssetTag.ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another barcode scanner with the same AssetTag exists" });

            // Ensure record exists
            var existing = await _context.Barcodes.AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id);

            if (existing == null)
                return NotFound();

            // 🔄 Update barcode
            _context.Entry(payload).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(409, "Concurrency conflict while updating barcode scanner");
            }

            // ⚠️ Damaged asset handling
            if (!string.IsNullOrWhiteSpace(payload.Remarks) &&
                payload.Remarks.Trim().ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReason))
                {
                    return BadRequest(new
                    {
                        message = "Damage reason is required when Remarks = Yes"
                    });
                }

                bool damageExists = await _context.DamagedAssets.AnyAsync(d =>
                    d.AssetType == "barcodescanner" &&
                    d.AssetTypeItemId == payload.Id
                );

                if (!damageExists)
                {
                    var damaged = new DamagedAsset
                    {
                        AssetType = "barcodescanner",
                        AssetTypeItemId = payload.Id,
                        AssetTag = payload.AssetTag,
                        Reason = payload.DamageReason,
                        ReportedAt = DateTime.Now
                    };

                    _context.DamagedAssets.Add(damaged);
                    await _context.SaveChangesAsync();
                }
            }

            // 🔢 Update Asset quantity (safety sync)
            if (payload.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(payload.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Barcodes
                        .CountAsync(b => b.AssetId == asset.Id);

                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }


        // DELETE BARCODE SCANNER
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBarcode(int id, [FromBody] DeleteRequest req)
        {
            var barcode = await _context.Barcodes.FindAsync(id);
            if (barcode == null)
                return NotFound();

            var adminName = req?.AdminName ?? "Unknown Admin";

            // 🧾 Log delete history
            var history = new AdminDeleteHistory
            {
                DeletedItemName = barcode.AssetTag ?? "Unknown",
                ItemType = "BarcodeScanner",
                AdminName = adminName,
                DeletedAt = DateTime.Now,
                Reason = req?.Reason ?? "No reason provided"
            };

            _context.AdminDeleteHistories.Add(history);

            int? assetId = barcode.AssetId;

            // 🗑️ Remove barcode
            _context.Barcodes.Remove(barcode);
            await _context.SaveChangesAsync();

            // 🔢 Update asset quantity
            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Barcodes
                        .CountAsync(b => b.AssetId == asset.Id);

                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }



   // ============================================================
// GET NEXT AVAILABLE BARCODE SCANNER ASSET TAG (from Purchase Orders)
// ============================================================
[HttpGet("next-asset-tag")]
public async Task<IActionResult> GetNextAvailableBarcodeAssetTag()
{
    // 1️⃣ Get Barcode Scanner asset
    var barcodeAsset = await _context.Assets
        .FirstOrDefaultAsync(a => a.Name.ToLower() == "barcode scanners");

    if (barcodeAsset == null)
        return NotFound(new { message = "Barcode Scanner asset not found" });

    // 2️⃣ All Barcode purchase tags ONLY
    var purchasedBarcodeTags = await _context.PurchaseOrderItems
        .Where(p =>
            p.AssetId == barcodeAsset.Id &&
            p.AssetTag != null
        )
        .OrderBy(p => p.Id)
        .Select(p => p.AssetTag)
        .ToListAsync();

    if (!purchasedBarcodeTags.Any())
        return NotFound(new { message = "No barcode purchase tags found" });

    // 3️⃣ Tags already used by barcode scanners
    var usedTags = await _context.Barcodes
        .Select(b => b.AssetTag)
        .Where(t => t != null)
        .ToListAsync();

    // 4️⃣ First unused BAR tag
    var nextTag = purchasedBarcodeTags
        .FirstOrDefault(tag => !usedTags.Contains(tag));

    if (nextTag == null)
        return NotFound(new { message = "No available barcode asset tags" });

    return Ok(new { assetTag = nextTag });
}



        // CHECK DUPLICATE BARCODE ASSET TAG
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Barcodes
                .AnyAsync(b => b.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }




    }
}
