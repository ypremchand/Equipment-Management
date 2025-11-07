using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LaptopsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LaptopsController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET all laptops
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Laptop>>> GetLaptops()
        {
            return await _context.Laptops.Include(l => l.Asset).ToListAsync();
        }

        // ✅ GET single laptop
        [HttpGet("{id}")]
        public async Task<ActionResult<Laptop>> GetLaptop(int id)
        {
            var laptop = await _context.Laptops.Include(l => l.Asset)
                                               .FirstOrDefaultAsync(l => l.Id == id);
            if (laptop == null)
                return NotFound();

            return laptop;
        }

        // ✅ POST (Add new laptop)
        [HttpPost]
        public async Task<ActionResult<Laptop>> PostLaptop([FromBody] Laptop laptop)
        {
            // Prevent duplicate AssetTag
            bool exists = await _context.Laptops
                .AnyAsync(l => l.AssetTag.ToLower() == laptop.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            // ✅ Find or create a generic asset dynamically
            // Look for existing asset whose name loosely matches "laptop"
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower().Contains("laptop"));

            // If no such asset found, create one dynamically
            if (asset == null)
            {
                asset = new Asset
                {
                    Name = "Laptops",
                    Quantity = 0
                };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            // ✅ Link laptop to asset
            laptop.AssetId = asset.Id;

            _context.Laptops.Add(laptop);
            await _context.SaveChangesAsync();

            // ✅ Update asset quantity automatically
            asset.Quantity = await _context.Laptops
                .CountAsync(l => l.AssetId == asset.Id);

            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLaptop), new { id = laptop.Id }, laptop);
        }

        // ✅ PUT (Edit existing laptop)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLaptop(int id, [FromBody] Laptop laptop)
        {
            if (id != laptop.Id)
                return BadRequest();

            bool exists = await _context.Laptops
                .AnyAsync(l => l.Id != id && l.AssetTag.ToLower() == laptop.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another laptop with the same AssetTag exists" });

            _context.Entry(laptop).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // ✅ Ensure the asset link remains consistent
            if (laptop.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(laptop.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Laptops
                        .CountAsync(l => l.AssetId == asset.Id);

                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLaptop(int id)
        {
            var laptop = await _context.Laptops.FindAsync(id);
            if (laptop == null)
                return NotFound();

            int? assetId = laptop.AssetId;

            _context.Laptops.Remove(laptop);
            await _context.SaveChangesAsync();

            // ✅ Auto-update linked asset’s quantity
            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Laptops
                        .CountAsync(l => l.AssetId == asset.Id);

                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ Check for duplicate AssetTag
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Laptops
                .AnyAsync(l => l.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
