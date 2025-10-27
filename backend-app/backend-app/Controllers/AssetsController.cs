using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        // ✅ GET: api/assets - dynamically calculate and update quantity in DB
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Asset>>> GetAssets()
        {
            var assets = await _context.Assets.ToListAsync();

            // Update quantities in DB for each asset
            foreach (var asset in assets)
            {
                int liveCount = GetAssetQuantity(asset.Name);

                if (asset.Quantity != liveCount) // update only if changed
                {
                    asset.Quantity = liveCount;
                    _context.Entry(asset).State = EntityState.Modified;
                }
            }

            await _context.SaveChangesAsync(); // persist updated counts

            return Ok(assets);
        }

        // ✅ GET: api/assets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Asset>> GetAsset(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            int liveCount = GetAssetQuantity(asset.Name);

            // Update DB if quantity is outdated
            if (asset.Quantity != liveCount)
            {
                asset.Quantity = liveCount;
                _context.Entry(asset).State = EntityState.Modified;
                await _context.SaveChangesAsync();
            }

            return Ok(asset);
        }

        // ✅ POST: api/assets
        [HttpPost]
        public async Task<ActionResult<Asset>> CreateAsset(Asset asset)
        {
            // Set live quantity before saving
            asset.Quantity = GetAssetQuantity(asset.Name);
            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
        }

        // ✅ PUT: api/assets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsset(int id, Asset asset)
        {
            if (id != asset.Id)
                return BadRequest();

            // Always refresh live quantity before updating
            asset.Quantity = GetAssetQuantity(asset.Name);
            _context.Entry(asset).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Assets.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // ✅ DELETE: api/assets/5
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

        // 🔧 Helper Method — Returns real-time count from respective tables
        private int GetAssetQuantity(string assetName)
        {
            return assetName.ToLower() switch
            {
                "laptop" or "laptops" => _context.Laptops.Count(),
                "mobile" or "mobiles" => _context.Mobiles.Count(),
                "tablet" or "tablets" => _context.Tablets.Count(),
                _ => 0
            };
        }
    }
}
