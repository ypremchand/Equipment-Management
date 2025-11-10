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
    public class TabletsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TabletsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tablet>>> GetTablets()
        {
            return await _context.Tablets.Include(t => t.Asset).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Tablet>> GetTablet(int id)
        {
            var tablet = await _context.Tablets.Include(t => t.Asset)
                                               .FirstOrDefaultAsync(t => t.Id == id);
            if (tablet == null)
                return NotFound();

            return tablet;
        }

        [HttpPost]
        public async Task<ActionResult<Tablet>> PostTablet([FromBody] Tablet tablet)
        {
            if (await _context.Tablets.AnyAsync(t => t.AssetTag.ToLower() == tablet.AssetTag.ToLower()))
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower().Contains("tablet"))
                        ?? new Asset { Name = "Tablets", Quantity = 0 };

            if (asset.Id == 0)
            {
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            tablet.AssetId = asset.Id;
            _context.Tablets.Add(tablet);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTablet), new { id = tablet.Id }, tablet);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTablet(int id, [FromBody] Tablet tablet)
        {
            if (id != tablet.Id)
                return BadRequest();

            if (await _context.Tablets.AnyAsync(t => t.Id != id && t.AssetTag.ToLower() == tablet.AssetTag.ToLower()))
                return BadRequest(new { message = "Duplicate asset tag" });

            _context.Entry(tablet).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            if (tablet.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(tablet.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ DELETE + log
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTablet(int id)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null)
                return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = tablet.AssetTag,
                ItemType = "Tablet",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };
            _context.AdminDeleteHistories.Add(history);

            int? assetId = tablet.AssetId;
            _context.Tablets.Remove(tablet);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "Asset tag is required" });

            bool exists = await _context.Tablets
                .AnyAsync(t => t.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
