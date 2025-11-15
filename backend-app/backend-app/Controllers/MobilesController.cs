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
    public class MobilesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MobilesController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET all mobiles (with pagination + search)
        [HttpGet]
        public async Task<ActionResult<object>> GetMobiles(
     [FromQuery] int page = 1,
     [FromQuery] int pageSize = 5,
     [FromQuery] string? search = null)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 5;

            var query = _context.Mobiles
                .Include(m => m.Asset)
                .AsQueryable();

            // 🔥 Filter out assigned mobiles (ONLY show available mobiles)
            var assignedMobileIds = await _context.AssignedAssets
                .Where(a => a.AssetType.ToLower() == "mobile" && a.Status == "Assigned")
                .Select(a => a.AssetTypeItemId)
                .ToListAsync();

            query = query.Where(m => !assignedMobileIds.Contains(m.Id));

            // 🔍 Search
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower().Replace(" ", "");

                query = query.Where(m =>
                    EF.Functions.Like(m.Brand.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(m.Model.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(m.AssetTag.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(m.Processor.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(m.Ram.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(m.Storage.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(m.Location.ToLower().Replace(" ", ""), $"%{search}%")
                );
            }

            var totalItems = await query.CountAsync();
            var mobiles = await query
                .OrderBy(m => m.Id)
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
                data = mobiles
            });
        }


        // ✅ GET single mobile
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

        // ✅ POST new mobile
        [HttpPost]
        public async Task<ActionResult<Mobile>> PostMobile([FromBody] Mobile mobile)
        {
            bool exists = await _context.Mobiles
                .AnyAsync(m => m.AssetTag.ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name.ToLower().Contains("mobile"));

            if (asset == null)
            {
                asset = new Asset { Name = "Mobiles", Quantity = 0 };
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

        // ✅ PUT existing mobile
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMobile(int id, [FromBody] Mobile mobile)
        {
            mobile.Id = id;

            bool exists = await _context.Mobiles
                .AnyAsync(m => m.Id != id && m.AssetTag.ToLower() == mobile.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another mobile with the same AssetTag exists" });

            _context.Entry(mobile).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Mobiles.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

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

        // ✅ DELETE + Log delete
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

        // ✅ Duplicate assetTag check
        [HttpGet("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromQuery] string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest(new { message = "AssetTag is required" });

            bool exists = await _context.Mobiles
                .AnyAsync(m => m.AssetTag.ToLower() == assetTag.ToLower());

            return Ok(new { exists });
        }
    }
}
