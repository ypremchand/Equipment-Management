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
    public class DesktopsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DesktopsController(AppDbContext context)
        {
            _context = context;
        }

        // =======================
        // PAYLOAD WITH DAMAGE INPUT
        // =======================
        public class DesktopPayload : Desktop
        {
            public string? DamageReasonInput { get; set; }
        }

        // =======================
        // AUTO-FIX OLD RECORDS WITHOUT ASSETID
        // =======================
        private async Task FixMissingAssetIds()
        {
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower() == "desktops");

            if (asset == null)
            {
                asset = new Asset { Name = "Desktops", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            var missing = await _context.Desktops
                .Where(d => d.AssetId == null)
                .ToListAsync();

            if (missing.Count > 0)
            {
                foreach (var d in missing)
                    d.AssetId = asset.Id;

                await _context.SaveChangesAsync();

                asset.Quantity = await _context.Desktops
                    .CountAsync(x => x.AssetId == asset.Id);
                await _context.SaveChangesAsync();
            }
        }

        // =======================
        // GET ALL DESKTOPS
        // =======================
        [HttpGet]
        public async Task<ActionResult<object>> GetDesktops(
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

            var query = _context.Desktops
                .Include(d => d.Asset)
                .AsQueryable();

            // SEARCH
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower().Replace(" ", "");
                query = query.Where(d =>
                    (d.Brand ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (d.ModelNumber ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (d.AssetTag ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (d.Processor ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (d.Ram ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (d.Storage ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (d.OperatingSystem ?? "").ToLower().Replace(" ", "").Contains(s) ||
                    (d.Location ?? "").ToLower().Replace(" ", "").Contains(s)
                );
            }

            // FILTERS
            if (!string.IsNullOrWhiteSpace(brand))
                query = query.Where(d => d.Brand.ToLower().Contains(brand.ToLower()));

            if (!string.IsNullOrWhiteSpace(ram))
                query = query.Where(d => d.Ram.ToLower().Contains(ram.ToLower()));

            if (!string.IsNullOrWhiteSpace(storage))
                query = query.Where(d => d.Storage.ToLower().Contains(storage.ToLower()));

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(d => d.Location.ToLower().Contains(location.ToLower()));

            if (!string.IsNullOrWhiteSpace(operatingSystem))
                query = query.Where(d => d.OperatingSystem.ToLower().Contains(operatingSystem.ToLower()));

            // EXCLUDE ASSIGNED DESKTOPS
            var assignedIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "desktop" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(d => !assignedIds.Contains(d.Id));

            // EXCLUDE DAMAGED
            query = query.Where(d =>
                string.IsNullOrEmpty(d.Remarks) ||
                d.Remarks.ToLower() != "yes");

            // SORTING
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
                _ => desc ? query.OrderByDescending(l => l.Id) : query.OrderBy(l => l.Id)
            };

            // PAGINATION
            var totalItems = await query.CountAsync();
            var desktops = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                data = desktops
            });
        }

        // =======================
        // DROPDOWN OPTIONS
        // =======================
        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            var brands = await _context.Desktops
                .Select(d => d.Brand)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rams = await _context.Desktops
                .Select(d => d.Ram)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var storages = await _context.Desktops
                .Select(d => d.Storage)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var rawLocations = await _context.Desktops
                .Select(d => d.Location)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToListAsync();

            var locations = rawLocations
                .SelectMany(x => x.Split(",", StringSplitOptions.RemoveEmptyEntries))
                .Select(x => x.Trim())
                .Distinct()
                .OrderBy(x => x)
                .ToList();

            return Ok(new { brands, rams, storages, locations });
        }

        // =======================
        // GET ONE DESKTOP
        // =======================
        [HttpGet("{id}")]
        public async Task<ActionResult<Desktop>> GetDesktop(int id)
        {
            await FixMissingAssetIds();

            var desktop = await _context.Desktops
                .Include(d => d.Asset)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (desktop == null) return NotFound();

            return desktop;
        }

        // =======================
        // CREATE DESKTOP
        // =======================
        [HttpPost]
        public async Task<ActionResult<Desktop>> PostDesktop([FromBody] DesktopPayload payload)
        {
            bool exists = await _context.Desktops
                .AnyAsync(d => d.AssetTag.ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower() == "desktops");

            if (asset == null)
            {
                asset = new Asset { Name = "Desktops", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            payload.AssetId = asset.Id;

            _context.Desktops.Add(payload);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Desktops.CountAsync(d => d.AssetId == asset.Id);
            await _context.SaveChangesAsync();

            // DAMAGE ENTRY
            if (payload.Remarks?.ToLower() == "yes")
            {
                if (string.IsNullOrWhiteSpace(payload.DamageReasonInput))
                    return BadRequest(new { message = "Damage Reason is required when Remarks = Yes" });

                _context.DamagedAssets.Add(new DamagedAsset
                {
                    AssetType = "Desktop",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReasonInput,
                    ReportedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetDesktop), new { id = payload.Id }, payload);
        }

        // =======================
        // UPDATE DESKTOP
        // =======================
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDesktop(int id, [FromBody] DesktopPayload payload)
        {
            if (payload.Id != id)
                payload.Id = id;

            bool exists = await _context.Desktops
                .AnyAsync(d => d.Id != id && d.AssetTag.ToLower() == payload.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another desktop with same AssetTag exists" });

            if (!payload.AssetId.HasValue)
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower() == "desktops");
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
                    AssetType = "Desktop",
                    AssetTypeItemId = payload.Id,
                    AssetTag = payload.AssetTag,
                    Reason = payload.DamageReasonInput,
                    ReportedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        // =======================
        // DELETE DESKTOP
        // =======================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDesktop(int id, [FromBody] DeleteRequest req)
        {
            var desktop = await _context.Desktops.FindAsync(id);
            if (desktop == null) return NotFound();

            _context.AdminDeleteHistories.Add(new AdminDeleteHistory
            {
                DeletedItemName = desktop.AssetTag,
                ItemType = "Desktop",
                Reason = req.Reason,
                AdminName = req.AdminName,
                DeletedAt = DateTime.Now
            });

            int? assetId = desktop.AssetId;

            _context.Desktops.Remove(desktop);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Desktops.CountAsync(d => d.AssetId == asset.Id);
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // =======================
        // CHECK DUPLICATE 
        // =======================
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            bool exists = await _context.Desktops
                .AnyAsync(d => d.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
