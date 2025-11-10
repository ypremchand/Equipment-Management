using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

        // ✅ GET: api/assets
        // Returns all assets from the database
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Asset>>> GetAssets()
        {
            var assets = await _context.Assets.ToListAsync();
            return Ok(assets);
        }

        // ✅ GET: api/assets/{id}
        // Returns a specific asset by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Asset>> GetAsset(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            return Ok(asset);
        }

        // ✅ POST: api/assets
        // Adds a new asset entry
        [HttpPost]
        public async Task<ActionResult<Asset>> CreateAsset(Asset asset)
        {
            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
        }

        // ✅ PUT: api/assets/{id}
        // Updates an existing asset
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsset(int id, Asset updatedAsset)
        {
            if (id != updatedAsset.Id)
                return BadRequest("Asset ID mismatch");

            var existingAsset = await _context.Assets.FindAsync(id);
            if (existingAsset == null)
                return NotFound();

            // ✅ Update only the fields that are actually editable
            existingAsset.Name = updatedAsset.Name;

            // Keep the existing quantity intact
            // (or update quantity only if it's explicitly provided)
            // existingAsset.Quantity = updatedAsset.Quantity != 0 ? updatedAsset.Quantity : existingAsset.Quantity;

            await _context.SaveChangesAsync();

            return NoContent();
        }


        // ✅ DELETE: api/assets/{id}
        // Deletes an asset and logs delete history
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsset(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            // ✅ Save Delete History
            var history = new AdminDeleteHistory
            {
                DeletedItemName = asset.Name,
                ItemType = "Asset",
                AdminName = "AdminUser", // 🔧 Replace with actual logged-in admin name if available
                DeletedAt = DateTime.Now
            };

            _context.AdminDeleteHistories.Add(history);

            // ✅ Remove the asset from database
            _context.Assets.Remove(asset);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
