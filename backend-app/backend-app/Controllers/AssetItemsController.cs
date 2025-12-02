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

            if (type == "laptop")
            {
                var data = await _context.Laptops
                    .Where(x => x.IsAssigned == false)
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

            if (type == "mobile")
            {
                var data = await _context.Mobiles
                    .Where(x => x.IsAssigned == false)
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

            if (type == "tablet")
            {
                var data = await _context.Tablets
                    .Where(x => x.IsAssigned == false)
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

            return BadRequest("Unknown asset type.");
        }

    }
    }
