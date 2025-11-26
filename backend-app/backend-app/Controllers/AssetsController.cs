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

        // ---------------------------------------------
        // ✅ GET ALL ASSETS WITH AVAILABLE COUNT
        // ---------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetAssets()
        {
            var assets = await _context.Assets.ToListAsync();

            // Fetch all assigned assets
            var assigned = await _context.AssignedAssets
                .Where(a => a.Status == "Assigned")
                .ToListAsync();

            // Fetch concrete items (laptops, mobiles, tablets, etc.)
            var laptops = await _context.Laptops.ToListAsync();
            var mobiles = await _context.Mobiles.ToListAsync();
            var tablets = await _context.Tablets.ToListAsync();

            var result = assets.Select(a =>
            {
                int total = a.Quantity;
                int assignedCount = 0;

                string key = a.Name.ToLower();

                if (key == "laptops")
                {
                    assignedCount = assigned.Count(x => x.AssetType == "laptop");
                }
                else if (key == "mobiles")
                {
                    assignedCount = assigned.Count(x => x.AssetType == "mobile");
                }
                else if (key == "tablets")
                {
                    assignedCount = assigned.Count(x => x.AssetType == "tablet");
                }
                // You can extend this for Desktops, Printers etc.

                int available = Math.Max(0, total - assignedCount);

                return new
                {
                    id = a.Id,
                    name = a.Name,
                    totalQuantity = total,
                    assignedQuantity = assignedCount,
                    quantity = available  // 👈 Use this in Home component
                };
            });

            return Ok(result);
        }

        // ---------------------------------------------
        // GET BY ID
        // ---------------------------------------------
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAsset(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            return Ok(asset);
        }

        // ---------------------------------------------
        // CREATE
        // ---------------------------------------------
        [HttpPost]
        public async Task<ActionResult<Asset>> CreateAsset(Asset asset)
        {
            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
        }

        // ---------------------------------------------
        // UPDATE
        // ---------------------------------------------
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsset(int id, Asset updatedAsset)
        {
            if (id != updatedAsset.Id)
                return BadRequest("Asset ID mismatch");

            var existingAsset = await _context.Assets.FindAsync(id);
            if (existingAsset == null)
                return NotFound();

            existingAsset.Name = updatedAsset.Name;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ---------------------------------------------
        // DELETE
        // ---------------------------------------------
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
