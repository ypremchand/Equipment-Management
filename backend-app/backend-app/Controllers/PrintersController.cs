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
    public class PrintersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PrintersController(AppDbContext context)
        {
            _context = context;
        }

        public class PrinterPayload : Printer
        {
            public string? DamageReasonInput { get; set; }
        }

        // ============================================================
        // AUTO FIX: SET AssetId for old records
        // ============================================================
        private async Task FixMissingAssetIds()
        {
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "printers");

            if (asset == null)
            {
                asset = new Asset { Name = "Printers", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            var missing = await _context.Printers
                .Where(p => p.AssetId == null)
                .ToListAsync();

            if (missing.Count > 0)
            {
                foreach (var p in missing)
                    p.AssetId = asset.Id;

                await _context.SaveChangesAsync();

                asset.Quantity = await _context.Printers.CountAsync(x => x.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }
        }

        // ============================================================
        // GET ALL PRINTERS (with filters, sort, pagination)
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetPrinters(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "id",
            [FromQuery] string? sortDir = "asc",
            [FromQuery] string? brand = null,
            [FromQuery] string? printerType = null,
            [FromQuery] string? paperSize = null,
            [FromQuery] string? location = null
        )
        {
            await FixMissingAssetIds();

            var query = _context.Printers
                .Include(p => p.Asset)
                .AsQueryable();

            // 🔍 SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower().Replace(" ", "");
                query = query.Where(p =>
                    (p.Brand ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (p.Model ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (p.AssetTag ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (p.PrinterType ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (p.PaperSize ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (p.Location ?? "").ToLower().Replace(" ", "").Contains(s)
                );
            }

            // 🎯 FILTERS
            if (!string.IsNullOrWhiteSpace(brand))
                query = query.Where(p => p.Brand.ToLower().Contains(brand.ToLower()));

            if (!string.IsNullOrWhiteSpace(printerType))
                query = query.Where(p => p.PrinterType.ToLower().Contains(printerType.ToLower()));

            if (!string.IsNullOrWhiteSpace(paperSize))
                query = query.Where(p => p.PaperSize.ToLower().Contains(paperSize.ToLower()));

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(p => p.Location.ToLower().Contains(location.ToLower()));

            // 🚫 EXCLUDE Assigned
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "printer" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(p => !assignedIds.Contains(p.Id));

            // 🚫 EXCLUDE Damaged
            query = query.Where(p =>
                string.IsNullOrEmpty(p.Remarks) ||
                p.Remarks.ToLower() != "yes"
            );

            // 🔽 SORT
            bool desc = sortDir?.ToLower() == "desc";
            query = sortBy?.ToLower() switch
            {
                "brand" => desc ? query.OrderByDescending(p => p.Brand) : query.OrderBy(p => p.Brand),
                "model" => desc ? query.OrderByDescending(p => p.Model) : query.OrderBy(p => p.Model),
                "printertype" => desc ? query.OrderByDescending(p => p.PrinterType) : query.OrderBy(p => p.PrinterType),
                "papersize" => desc ? query.OrderByDescending(p => p.PaperSize) : query.OrderBy(p => p.PaperSize),
                "location" => desc ? query.OrderByDescending(p => p.Location) : query.OrderBy(p => p.Location),
                _ => desc ? query.OrderByDescending(p => p.Id) : query.OrderBy(p => p.Id),
            };

            // PAGINATION
            var totalItems = await query.CountAsync();
            var printers = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages,
                data = printers
            });
        }

        // ============================================================
        // OPTIONS ENDPOINT
        // ============================================================
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Printers
                .Select(p => p.Brand)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var types = await _context.Printers
                .Select(p => p.PrinterType)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var sizes = await _context.Printers
                .Select(p => p.PaperSize)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rawLocations = await _context.Printers
                .Select(p => p.Location)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToListAsync();

            var locations = rawLocations
                .SelectMany(x => x.Split(",", StringSplitOptions.RemoveEmptyEntries))
                .Select(x => x.Trim())
                .Distinct()
                .OrderBy(x => x)
                .ToList();

            return Ok(new { brands, types, sizes, locations });
        }

        // ============================================================
        // GET ONE PRINTER
        // ============================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPrinter(int id)
        {
            await FixMissingAssetIds();

            var printer = await _context.Printers
                .Include(p => p.Asset)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (printer == null)
                return NotFound();

            return Ok(printer);
        }

        // ============================================================
        // CREATE PRINTER
        // ============================================================
        [HttpPost]
        public async Task<IActionResult> CreatePrinter([FromBody] PrinterPayload payload)
        {
            bool exists = await _context.Printers
                .AnyAsync(p => p.AssetTag.ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "AssetTag already exists" });

            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "printers");

            if (asset == null)
            {
                asset = new Asset { Name = "Printers", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            payload.AssetId = asset.Id;

            _context.Printers.Add(payload);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Printers.CountAsync(p => p.AssetId == asset.Id);
            await _context.SaveChangesAsync();

            // DAMAGE
            if (payload.Remarks?.ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReasonInput))
                    return BadRequest(new { message = "Damage Reason is required when Remarks = Yes" });

                _context.DamagedAssets.Add(new DamagedAsset
                {
                    AssetType = "Printer",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReasonInput,
                    ReportedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetPrinter), new { id = payload.Id }, payload);
        }

        // ============================================================
        // UPDATE PRINTER
        // ============================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePrinter(int id, [FromBody] PrinterPayload payload)
        {
            if (payload.Id != id)
                payload.Id = id;

            bool exists = await _context.Printers
                .AnyAsync(p => p.Id != id && p.AssetTag.ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another Printer with same AssetTag exists" });

            if (!payload.AssetId.HasValue)
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower() == "printers");
                payload.AssetId = asset?.Id;
            }

            _context.Entry(payload).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            if (payload.Remarks?.ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReasonInput))
                    return BadRequest(new { message = "Damage Reason is required when Remarks = Yes" });

                _context.DamagedAssets.Add(new DamagedAsset
                {
                    AssetType = "Printer",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReasonInput,
                    ReportedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        // ============================================================
        // DELETE PRINTER
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePrinter(int id, [FromBody] DeleteRequest req)
        {
            var printer = await _context.Printers.FindAsync(id);
            if (printer == null)
                return NotFound();

            _context.AdminDeleteHistories.Add(new AdminDeleteHistory
            {
                DeletedItemName = printer.AssetTag,
                ItemType = "Printer",
                Reason = req.Reason,
                AdminName = req.AdminName,
                DeletedAt = DateTime.Now
            });

            int? assetId = printer.AssetId;

            _context.Printers.Remove(printer);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Printers.CountAsync(p => p.AssetId == asset.Id);
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ============================================================
        // GET NEXT AVAILABLE PRINTER ASSET TAG (from Purchase Orders)
        // ============================================================
        [HttpGet("next-asset-tag")]
        public async Task<IActionResult> GetNextAvailableAssetTag()
        {
            // 1️⃣ Get Printer asset
            var printerAsset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "printers");

            if (printerAsset == null)
                return NotFound(new { message = "Printer asset not found" });

            // 2️⃣ All printer purchase tags ONLY
            var purchasedPrinterTags = await _context.PurchaseOrderItems
                .Where(p =>
                    p.AssetId == printerAsset.Id &&
                    p.AssetTag != null
                )
                .Select(p => p.AssetTag)
                .ToListAsync();

            if (!purchasedPrinterTags.Any())
                return NotFound(new { message = "No printer purchase tags found" });

            // 3️⃣ Tags already used by printers
            var usedTags = await _context.Printers
                .Select(l => l.AssetTag)
                .Where(t => t != null)
                .ToListAsync();

            // 4️⃣ First unused PRI tag
            var nextTag = purchasedPrinterTags
                .FirstOrDefault(tag => !usedTags.Contains(tag));

            if (nextTag == null)
                return NotFound(new { message = "No available printer asset tags" });

            return Ok(new { assetTag = nextTag });
        }

        // ============================================================
        // DUPLICATE CHECK
        // ============================================================
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Printers
                .AnyAsync(p => p.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
