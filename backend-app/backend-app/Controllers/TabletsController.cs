using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

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

        // ✅ GET: api/tablets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tablet>>> GetTablets()
        {
            return await _context.Tablets.Include(t => t.Asset).ToListAsync();
        }

        // ✅ GET: api/tablets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Tablet>> GetTablet(int id)
        {
            var tablet = await _context.Tablets
                .Include(t => t.Asset)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tablet == null)
                return NotFound();

            return tablet;
        }

        // ✅ POST: api/tablets
        [HttpPost]
        public async Task<ActionResult<Tablet>> PostTablet([FromBody] Tablet tablet)
        {
            // 🔍 Prevent duplicate AssetTag
            bool exists = await _context.Tablets.AnyAsync(t =>
                t.AssetTag.ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            // ✅ Find or create corresponding Asset record dynamically
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower().Contains("tablet"));

            if (asset == null)
            {
                asset = new Asset { Name = "Tablets", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            // ✅ Link tablet to the asset
            tablet.AssetId = asset.Id;

            _context.Tablets.Add(tablet);
            await _context.SaveChangesAsync();

            // ✅ Update asset quantity dynamically
            asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTablet), new { id = tablet.Id }, tablet);
        }

        // ✅ PUT:     
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTablet(int id, [FromBody] Tablet tablet)
        {
            if (id != tablet.Id)
                return BadRequest();

            // 🔍 Check for duplicate AssetTag (excluding current)
            bool exists = await _context.Tablets.AnyAsync(t =>
                t.Id != id && t.AssetTag.ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another tablet with the same Asset number already exists" });

            _context.Entry(tablet).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // ✅ Update related asset quantity
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

        // ✅ DELETE:
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTablet(int id)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null)
                return NotFound();

            int? assetId = tablet.AssetId;

            _context.Tablets.Remove(tablet);
            await _context.SaveChangesAsync();

            // ✅ Update asset quantity after delete
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

        // ✅ Duplicate AssetTag check for frontend validation
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "Asset tag is required" });

            bool exists = await _context.Tablets.AnyAsync(t =>
                t.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
