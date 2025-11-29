using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        // ============================================================
        // GET ALL ASSETS (with available quantity)
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetAssets()
        {
            var assets = await _context.Assets.ToListAsync();

            var assigned = await _context.AssignedAssets
                .Where(a => a.Status == "Assigned")
                .ToListAsync();

            var result = assets.Select(a =>
            {
                int total = a.Quantity;
                int assignedCount = 0;

                string key = a.Name.ToLower();

                if (key == "laptops")
                    assignedCount = assigned.Count(x => x.AssetType == "laptop");

                else if (key == "mobiles")
                    assignedCount = assigned.Count(x => x.AssetType == "mobile");

                else if (key == "tablets")
                    assignedCount = assigned.Count(x => x.AssetType == "tablet");

                int available = Math.Max(0, total - assignedCount);

                return new
                {
                    id = a.Id,
                    name = a.Name,
                    totalQuantity = total,
                    assignedQuantity = assignedCount,
                    quantity = available
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
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsset(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            _context.Assets.Remove(asset);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
