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
    public class MobilesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MobilesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Mobile>>> GetMobiles()
        {
            return await _context.Mobiles.Include(m => m.Asset).ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Mobile>> GetMobile(int id)
        {
            var mobile = await _context.Mobiles.Include(m => m.Asset)
                                               .FirstOrDefaultAsync(m => m.Id == id);
            if (mobile == null)
                return NotFound();

            return mobile;
        }

        [HttpPost]
        public async Task<ActionResult<Mobile>> PostMobile([FromBody] Mobile mobile)
        {
            if (await _context.Mobiles.AnyAsync(m => m.AssetTag.ToLower() == mobile.AssetTag.ToLower()))
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower().Contains("mobile"))
                        ?? new Asset { Name = "Mobiles", Quantity = 0 };

            if (asset.Id == 0)
            {
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            mobile.AssetId = asset.Id;
            _context.Mobiles.Add(mobile);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Mobiles.CountAsync(m => m.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMobile), new { id = mobile.Id }, mobile);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMobile(int id, [FromBody] Mobile mobile)
        {
            if (id != mobile.Id)
                return BadRequest();

            if (await _context.Mobiles.AnyAsync(m => m.Id != id && m.AssetTag.ToLower() == mobile.AssetTag.ToLower()))
                return BadRequest(new { message = "Duplicate asset tag" });

            _context.Entry(mobile).State = EntityState.Modified;
            await _context.SaveChangesAsync();

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

        // ✅ DELETE + log
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMobile(int id)
        {
            var mobile = await _context.Mobiles.FindAsync(id);
            if (mobile == null)
                return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = mobile.AssetTag,
                ItemType = "Mobile",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };
            _context.AdminDeleteHistories.Add(history);

            int? assetId = mobile.AssetId;
            _context.Mobiles.Remove(mobile);
            await _context.SaveChangesAsync();

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
