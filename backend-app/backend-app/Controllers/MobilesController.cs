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
    public class MobilesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MobilesController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/mobiles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Mobile>>> GetMobiles()
        {
            return await _context.Mobiles.Include(m => m.Asset).ToListAsync();
        }

        // ✅ GET: api/mobiles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Mobile>> GetMobile(int id)
        {
            var mobile = await _context.Mobiles
                .Include(m => m.Asset)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (mobile == null)
                return NotFound();

            return mobile;
        }

        // ✅ POST: api/mobiles
        [HttpPost]
        public async Task<ActionResult<Mobile>> PostMobile([FromBody] Mobile mobile)
        {
            // 🔍 Check if AssetTag already exists
            bool exists = await _context.Mobiles
                .AnyAsync(m => m.AssetTag.ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            // ✅ Find or create dynamic asset for mobiles
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower().Contains("mobile"));

            if (asset == null)
            {
                asset = new Asset { Name = "Mobiles", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            // ✅ Link the mobile to the asset
            mobile.AssetId = asset.Id;

            _context.Mobiles.Add(mobile);
            await _context.SaveChangesAsync();

            // ✅ Update asset quantity dynamically
            asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMobile), new { id = mobile.Id }, mobile);
        }

        // ✅ PUT: api/mobiles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMobile(int id, [FromBody] Mobile mobile)
        {
            if (id != mobile.Id)
                return BadRequest();

            // 🔍 Check for duplicate AssetTag
            bool exists = await _context.Mobiles
                .AnyAsync(m => m.Id != id && m.AssetTag.ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another mobile with the same Asset number already exists" });

            _context.Entry(mobile).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // ✅ Recalculate asset quantity (if linked)
            if (mobile.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(mobile.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ DELETE: api/mobiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMobile(int id)
        {
            var mobile = await _context.Mobiles.FindAsync(id);
            if (mobile == null)
                return NotFound();

            int? assetId = mobile.AssetId;

            _context.Mobiles.Remove(mobile);
            await _context.SaveChangesAsync();

            // ✅ Update quantity after delete
            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ Real-time check endpoint for frontend validation
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "Asset tag is required" });

            bool exists = await _context.Mobiles
                .AnyAsync(m => m.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
