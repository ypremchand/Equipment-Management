using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/asset-items")]
    public class AssetItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetItemsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable([FromQuery] string type)
        {
            if (string.IsNullOrWhiteSpace(type))
                return BadRequest("Type is required.");

            type = type.Trim().ToLower();

            // Load damaged IDs once for the requested type
            var damagedIds = await _context.DamagedAssets
                .Where(d => d.AssetType.ToLower() == type)
                .Select(d => d.AssetTypeItemId)
                .ToListAsync();

            // ===========================
            //         LAPTOPS
            // ===========================
            if (type == "laptop")
            {
                var data = await _context.Laptops
                    .Where(x => !x.IsAssigned && !damagedIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.Brand,
                        x.ModelNumber,
                        x.AssetTag,
                        x.PurchaseDate,
                        x.Processor,
                        x.Ram,
                        x.Storage,
                        x.GraphicsCard,
                        x.DisplaySize,
                        x.OperatingSystem,
                        x.BatteryCapacity,
                        x.Location,
                        x.Remarks,
                        x.LastServicedDate,
                        x.IsAssigned,
                        x.AssignedDate,
                        x.AssetId
                    })
                    .ToListAsync();

                return Ok(data);
            }

            // ===========================
            //         MOBILES
            // ===========================
            if (type == "mobile")
            {
                var data = await _context.Mobiles
                    .Where(x => !x.IsAssigned && !damagedIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.Brand,
                        x.Model,
                        x.IMEINumber,
                        x.AssetTag,
                        x.PurchaseDate,
                        x.Processor,
                        x.Ram,
                        x.Storage,
                        x.NetworkType,
                        x.Location,
                        x.Remarks,
                        x.LastServicedDate,
                        x.IsAssigned,
                        x.AssignedDate,
                        x.AssetId
                    })
                    .ToListAsync();

                return Ok(data);
            }

            // ===========================
            //         TABLETS
            // ===========================
            if (type == "tablet")
            {
                var data = await _context.Tablets
                    .Where(x => !x.IsAssigned && !damagedIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.Brand,
                        x.Model,
                        x.AssetTag,
                        x.PurchaseDate,
                        x.Processor,
                        x.Ram,
                        x.Storage,
                        x.DisplaySize,
                        x.BatteryCapacity,
                        x.IMEINumber,
                        x.SIMSupport,
                        x.NetworkType,
                        x.Location,
                        x.Remarks,
                        x.LastServicedDate,
                        x.IsAssigned,
                        x.AssignedDate,
                        x.AssetId
                    })
                    .ToListAsync();

                return Ok(data);
            }
            if (type == "desktop")
            {
                var data = await _context.Desktops
                    .Where(x => !x.IsAssigned && !damagedIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.Brand,
                        x.ModelNumber,
                        x.AssetTag,
                        x.PurchaseDate,
                        x.Processor,
                        x.Ram,
                        x.Storage,
                        x.Location,
                        x.Remarks,
                        x.LastServicedDate,
                        x.IsAssigned,
                        x.AssignedDate,
                        x.AssetId
                    })
                    .ToListAsync();

                return Ok(data);
            }
            if (type == "printer")
            {
                var data = await _context.Printers
                    .Where(x => !x.IsAssigned && !damagedIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.Brand,
                        x.Model,
                        x.PrinterType,
                        x.PaperSize,
                        x.Dpi,
                        x.AssetTag,
                        x.PurchaseDate,
                        x.Location,
                        x.Remarks,
                        x.IsAssigned,
                        x.AssignedDate,
                        x.AssetId
                    })
                    .ToListAsync();

                return Ok(data);
            }
            if (type == "scanner1")
            {
                var data = await _context.Scanner1
                    .Where(x => !x.IsAssigned && !damagedIds.Contains(x.Id))
                    .Select(x => new
                    {
                        id = x.Id,
                        scanner1Brand = x.Scanner1Brand,
                        scanner1Model = x.Scanner1Model,
                        scanner1Type = x.Scanner1Type,
                        scanner1Resolution = x.Scanner1Resolution,
                        scanner1AssetTag = x.Scanner1AssetTag,

                        purchaseDate = x.PurchaseDate,
                        scanner1Location = x.Scanner1Location,
                        remarks = x.Remarks,
                        isAssigned = x.IsAssigned,
                        assignedDate = x.AssignedDate,
                        assetId = x.AssetId
                    })
                    .ToListAsync();

                return Ok(data);
            }

            return BadRequest("Unknown asset type.");
        }
    }
}
