using backend_app.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminReportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminReportController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET ALL REPORTS
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetAllReports()
        {
            var reportsData = await _context.AssetRequests
                .Include(r => r.User)
                .Include(r => r.Location)
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .OrderByDescending(r => r.Id)
                .ToListAsync();

            var reports = reportsData.Select(r => new
            {
                r.Id,
                r.Status,
                r.RequestDate,
                User = r.User.Name,
                Location = r.Location.Name,
                r.Message,
                AssetItems = r.AssetRequestItems.Select(i => new
                {
                    i.Asset.Name,
                    i.RequestedQuantity,
                    i.ApprovedQuantity,
                    i.PartialReason,
                    i.Brand,
                    i.Processor,
                    i.Storage,
                    i.Ram,
                    i.OperatingSystem,
                    i.Scanner1Type,
                    i.Scanner1Resolution,
                    i.Scanner2Type,
                    i.Scanner2Resolution,
                    i.Scanner3Type,
                    i.Scanner3Resolution,
                    i.Type,
                    i.Technology,
                })
            }).ToList();

            // LOCATION SUMMARY
            var locationSummary = await _context.Locations
                .Select(loc => new
                {
                    Location = loc.Name,
                    TotalRequests = _context.AssetRequests.Count(r => r.LocationId == loc.Id),
                    Approved = _context.AssetRequests.Count(r => r.LocationId == loc.Id && r.Status == "Approved"),
                    Pending = _context.AssetRequests.Count(r => r.LocationId == loc.Id && r.Status == "Pending")
                })
                .ToDictionaryAsync(x => x.Location, x => new
                {
                    x.TotalRequests,
                    x.Approved,
                    x.Pending
                });

            // INVENTORY SUMMARY
            var inventory = new
            {
                Laptops = new
                {
                    Total = _context.Laptops.Count(),
                    Assigned = _context.Laptops.Count(x => x.IsAssigned),
                    Available = _context.Laptops.Count(x => !x.IsAssigned)
                },
                Mobiles = new
                {
                    Total = _context.Mobiles.Count(),
                    Assigned = _context.Mobiles.Count(x => x.IsAssigned),
                    Available = _context.Mobiles.Count(x => !x.IsAssigned)
                },
                Tablets = new
                {
                    Total = _context.Tablets.Count(),
                    Assigned = _context.Tablets.Count(x => x.IsAssigned),
                    Available = _context.Tablets.Count(x => !x.IsAssigned)
                },
                Printers = new
                {
                    Total = _context.Printers.Count(),
                    Assigned = _context.Printers.Count(x => x.IsAssigned),
                    Available = _context.Printers.Count(x => !x.IsAssigned)
                },
                Scanner1 = new
                {
                    Total = _context.Scanner1.Count(),
                    Assigned = _context.Scanner1.Count(x => x.IsAssigned),
                    Available = _context.Scanner1.Count(x => !x.IsAssigned)
                },
                Scanner2 = new
                {
                    Total = _context.Scanner2.Count(),
                    Assigned = _context.Scanner2.Count(x => x.IsAssigned),
                    Available = _context.Scanner2.Count(x => !x.IsAssigned)
                },
                Scanner3 = new
                {
                    Total = _context.Scanner3.Count(),
                    Assigned = _context.Scanner3.Count(x => x.IsAssigned),
                    Available = _context.Scanner3.Count(x => !x.IsAssigned)
                },
                Barcodes = new
                {
                    Total = _context.Barcodes.Count(),
                    Assigned = _context.Barcodes.Count(x => x.IsAssigned),
                    Available = _context.Barcodes.Count(x => !x.IsAssigned)
                }
            };

            return Ok(new
            {
                reports,
                inventory,
                locationSummary
            });
        }

        // ============================================================
        // GET ASSETS BY TYPE — INCLUDING "all"
        // ============================================================
        [HttpGet("by-type/{assetName}")]
        public async Task<IActionResult> GetAssetsByType(string assetName)
        {
            assetName = assetName.ToLower();

            if (assetName == "laptops")
                return Ok(await _context.Laptops.ToListAsync());

            if (assetName == "mobiles")
                return Ok(await _context.Mobiles.ToListAsync());

            if (assetName == "tablets")
                return Ok(await _context.Tablets.ToListAsync());

            if (assetName == "printers")
                return Ok(await _context.Printers.ToListAsync());

            if (assetName == "scanner1")
                return Ok(await _context.Scanner1.ToListAsync());

            if (assetName == "scanner2")
                return Ok(await _context.Scanner2.ToListAsync());

            if (assetName == "scanner3")
                return Ok(await _context.Scanner3.ToListAsync());

            if (assetName == "barcodes")
                return Ok(await _context.Barcodes.ToListAsync());

            // ⭐ NEW: ALL ASSETS IN ONE RESPONSE
            if (assetName == "all")
            {
                var allAssets = new
                {
                    Laptops = await _context.Laptops.ToListAsync(),
                    Mobiles = await _context.Mobiles.ToListAsync(),
                    Tablets = await _context.Tablets.ToListAsync(),
                    Printers = await _context.Printers.ToListAsync(),
                    Scanner1 = await _context.Scanner1.ToListAsync(),
                    Scanner2 = await _context.Scanner2.ToListAsync(),
                    Scanner3 = await _context.Scanner3.ToListAsync(),
                    Barcodes = await _context.Barcodes.ToListAsync()
                };
                return Ok(allAssets);
            }

            return NotFound("Invalid asset type.");
        }
    }
}
