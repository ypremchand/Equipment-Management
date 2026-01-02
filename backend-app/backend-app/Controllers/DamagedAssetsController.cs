using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DamagedAssetsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DamagedAssetsController(AppDbContext context)
        {
            _context = context;
        }

        // ================================
        // GET ALL DAMAGED ASSETS (pagination + search)
        // ================================
        [HttpGet]
        public async Task<IActionResult> GetDamagedAssets(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null
        )
        {
            var query = _context.DamagedAssets.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(d =>
                    d.AssetType.ToLower().Contains(s) ||
                    d.AssetTag.ToLower().Contains(s) ||
                    d.Reason.ToLower().Contains(s)
                );
            }

            var totalItems = await query.CountAsync();
            var data = await query
                .OrderByDescending(d => d.ReportedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                data
            });
        }

        // ================================
        // GET SINGLE DAMAGED ASSET
        // ================================
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var item = await _context.DamagedAssets.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }


        // ================================
        // REPAIR DAMAGED ASSET
        // ================================
        [HttpPost("repair/{id}")]
        public async Task<IActionResult> RepairDamagedAsset(int id)
        {
            var item = await _context.DamagedAssets.FindAsync(id);
            if (item == null)
                return NotFound();

            // 1️⃣ INSERT REPAIR HISTORY
            var repair = new RepairHistory
            {
                AssetTag = item.AssetTag,
                AssetType = item.AssetType,
                RepairedAt = DateTime.Now,
                Remarks = "Repaired successfully"
            };

            _context.RepairHistories.Add(repair);

            // 2️⃣ UPDATE MAIN ASSET → set Remarks = "No"
            if (item.AssetType.ToLower() == "laptop")
            {
                var laptop = await _context.Laptops
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (laptop != null)
                {
                    laptop.Remarks = "No";
                    _context.Entry(laptop).State = EntityState.Modified;
                }
            }
            else if (item.AssetType.ToLower() == "mobile")
            {
                var mobile = await _context.Mobiles
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (mobile != null)
                {
                    mobile.Remarks = "No";
                    _context.Entry(mobile).State = EntityState.Modified;
                }
            }
            else if (item.AssetType.ToLower() == "tablet")
            {
                var tablet = await _context.Tablets
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (tablet != null)
                {
                    tablet.Remarks = "No";
                    _context.Entry(tablet).State = EntityState.Modified;
                }
            }

            else if (item.AssetType.ToLower() == "desktop")
            {
                var desktop = await _context.Desktops
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (desktop != null)
                {
                    desktop.Remarks = "No";
                    _context.Entry(desktop).State = EntityState.Modified;
                }
            }

            else if (item.AssetType.ToLower() == "printer")
            {
                var printer = await _context.Printers
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (printer != null)
                {
                    printer.Remarks = "No";
                    _context.Entry(printer).State = EntityState.Modified;
                }
            }

            else if (item.AssetType.ToLower() == "scanner1")
            {
                var scanner1 = await _context.Scanner1
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (scanner1 != null)
                {
                    scanner1.Remarks = "No";
                    _context.Entry(scanner1).State = EntityState.Modified;
                }
            }

            else if (item.AssetType.ToLower() == "scanner2")
            {
                var scanner2 = await _context.Scanner2
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (scanner2 != null)
                {
                    scanner2.Remarks = "No";
                    _context.Entry(scanner2).State = EntityState.Modified;
                }
            }

            else if (item.AssetType.ToLower() == "scanner3")
            {
                var scanner3 = await _context.Scanner3
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (scanner3 != null)
                {
                    scanner3.Remarks = "No";
                    _context.Entry(scanner3).State = EntityState.Modified;
                }
            }
            else if (item.AssetType.ToLower() == "barcode")
            {
                var barcode = await _context.Barcodes
                    .FirstOrDefaultAsync(x => x.Id == item.AssetTypeItemId);

                if (barcode != null)
                {
                    barcode.Remarks = "No";
                    _context.Entry(barcode).State = EntityState.Modified;
                }
            }
            // 3️⃣ REMOVE FROM DAMAGED LIST
            _context.DamagedAssets.Remove(item);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Asset repaired and restored successfully" });
        }
    }
    }
