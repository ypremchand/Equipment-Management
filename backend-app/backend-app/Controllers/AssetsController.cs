using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using static backend_app.Controllers.LocationsController;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetsController(AppDbContext context)
        {
            _context = context;
        }

        // ---- same logic as in React normalizeType ----
        private string NormalizeType(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return string.Empty;

            var n = name.Trim().ToLowerInvariant();

            if (n.Contains("laptop")) return "laptop";
            if (n.Contains("mobile")) return "mobile";
            if (n.Contains("tablet")) return "tablet";

            return n;
        }

        // ============================================================
        // GET ALL ASSETS (with available quantity based on items)
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetAssets()
        {
            var assets = await _context.Assets.ToListAsync();

            // load concrete items once
            var laptops = await _context.Laptops.ToListAsync();
            var mobiles = await _context.Mobiles.ToListAsync();
            var tablets = await _context.Tablets.ToListAsync();

            var result = assets.Select(a =>
            {
                var type = NormalizeType(a.Name);

                int total = 0;
                int assigned = 0;

                if (type == "laptop")
                {
                    total = laptops.Count(x => x.AssetId == a.Id);
                    assigned = laptops.Count(x => x.AssetId == a.Id && x.IsAssigned);
                }
                else if (type == "mobile")
                {
                    total = mobiles.Count(x => x.AssetId == a.Id);
                    assigned = mobiles.Count(x => x.AssetId == a.Id && x.IsAssigned);
                }
                else if (type == "tablet")
                {
                    total = tablets.Count(x => x.AssetId == a.Id);
                    assigned = tablets.Count(x => x.AssetId == a.Id && x.IsAssigned);
                }
                else
                {
                    // For Desktops / Printers / Scanners (no item table yet),
                    // fallback to the manual quantity field.
                    total = a.Quantity;
                    assigned = 0; // you can extend this later with AssignedAssets if needed
                }

                int available = Math.Max(0, total - assigned);

                return new
                {
                    id = a.Id,
                    name = a.Name,
                    totalQuantity = total,
                    assignedQuantity = assigned,
                    quantity = available   // Admin panel uses this as "Available Qty"
                };
            });

            return Ok(result);
        }

        // ============================================================
        // GET SINGLE ASSET
        // ============================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAsset(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            return Ok(asset);
        }

        // ============================================================
        // CREATE ASSET
        // ============================================================
        [HttpPost]
        public async Task<ActionResult<Asset>> CreateAsset(Asset asset)
        {
            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
        }

        // ============================================================
        // UPDATE ASSET
        // ============================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsset(int id, Asset updatedAsset)
        {
            if (id != updatedAsset.Id)
                return BadRequest("ID mismatch");

            var existing = await _context.Assets.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.Name = updatedAsset.Name;
            existing.Quantity = updatedAsset.Quantity;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ============================================================
        // DELETE ASSET
        // ============================================================

        private async Task LogDelete(string itemName, string itemType)
        {
            var log = new AdminDeleteHistory
            {
                DeletedItemName = itemName,
                ItemType = itemType,
                AdminName = "Admin", // TODO -> Replace with actual logged-in admin if available
                DeletedAt = DateTime.Now
            };

            _context.AdminDeleteHistories.Add(log);
            await _context.SaveChangesAsync();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsset(int id, [FromBody] DeleteRequest body)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = asset.Name,
                ItemType = "Asset",
                AdminName = "Admin",
                DeletedAt = DateTime.Now,
                Reason = body?.Reason ?? "No reason provided",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? ""
            };

            _context.AdminDeleteHistories.Add(history);
            _context.Assets.Remove(asset);

            await _context.SaveChangesAsync();

            return NoContent();
        }


    }
}
