using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TabletsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TabletsController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/tablets (Pagination + Search)
        [HttpGet]
        public async Task<ActionResult<object>> GetTablets(
     [FromQuery] int page = 1,
     [FromQuery] int pageSize = 5,
     [FromQuery] string? search = null)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 5;

            var query = _context.Tablets.Include(t => t.Asset).AsQueryable();

            // 🔥 FILTER — Only show AVAILABLE tablets
            var assignedTabletIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "tablet" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(t => !assignedTabletIds.Contains(t.Id));

            // 🔍 Search
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower().Replace(" ", "");
                query = query.Where(t =>
                    EF.Functions.Like(t.Brand.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(t.Model.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(t.AssetTag.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(t.Processor.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(t.Ram.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(t.Storage.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(t.Location.ToLower().Replace(" ", ""), $"%{search}%")
                );
            }

            var totalItems = await query.CountAsync();
            var tablets = await query
                .OrderBy(t => t.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            return Ok(new
            {
                currentPage = page,
                pageSize,
                totalItems,
                totalPages,
                data = tablets
            });
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
            // Check duplicate AssetTag
            bool exists = await _context.Tablets
                .AnyAsync(t => t.AssetTag.ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            // Link to asset
            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower().Contains("tablet"));

            if (asset == null)
            {
                asset = new Asset { Name = "Tablets", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            tablet.AssetId = asset.Id;
            _context.Tablets.Add(tablet);
            await _context.SaveChangesAsync();

            // Update quantity
            asset.Quantity = await _context.Tablets.CountAsync(t => t.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTablet), new { id = tablet.Id }, tablet);
        }

        // ✅ PUT: api/tablets/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTablet(int id, [FromBody] Tablet tablet)
        {
            if (id != tablet.Id)
                return BadRequest();

            // Prevent duplicate AssetTag
            bool exists = await _context.Tablets
                .AnyAsync(t => t.Id != id && t.AssetTag.ToLower() == tablet.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another tablet with this asset tag already exists" });

            _context.Entry(tablet).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Tablets.Any(t => t.Id == id))
                    return NotFound();
                throw;
            }

            // Update quantity in related Asset
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

        // ✅ DELETE: api/tablets/5 (with delete logging)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTablet(int id)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null)
                return NotFound();

            // Log delete history
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

            // Update asset quantity
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

        // ✅ Check duplicate AssetTag
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
