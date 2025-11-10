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
    public class LaptopsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LaptopsController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET all laptops (with pagination + search)
        [HttpGet]
        public async Task<ActionResult<object>> GetLaptops(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] string? search = null)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 5;

            var query = _context.Laptops
                .Include(l => l.Asset)
                .AsQueryable();

            // ✅ Apply case-insensitive + space-insensitive search
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower().Replace(" ", "");

                query = query.Where(l =>
                    EF.Functions.Like(l.Brand.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(l.ModelNumber.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(l.AssetTag.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(l.Processor.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(l.Ram.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(l.Storage.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(l.OperatingSystem.ToLower().Replace(" ", ""), $"%{search}%") ||
                    EF.Functions.Like(l.Location.ToLower().Replace(" ", ""), $"%{search}%")
                );
            }

            var totalItems = await query.CountAsync();
            var laptops = await query
                .OrderBy(l => l.Id)
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
                data = laptops
            });
        }

        // ✅ GET single laptop
        [HttpGet("{id}")]
        public async Task<ActionResult<Laptop>> GetLaptop(int id)
        {
            var laptop = await _context.Laptops
                .Include(l => l.Asset)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (laptop == null)
                return NotFound();

            return laptop;
        }

        // ✅ POST (Add new laptop)
        [HttpPost]
        public async Task<ActionResult<Laptop>> PostLaptop([FromBody] Laptop laptop)
        {
            bool exists = await _context.Laptops
                .AnyAsync(l => l.AssetTag.ToLower() == laptop.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Asset number already exists" });

            var asset = await _context.Assets
                .FirstOrDefaultAsync(a => a.Name.ToLower().Contains("laptop"));

            if (asset == null)
            {
                asset = new Asset { Name = "Laptops", Quantity = 0 };
                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();
            }

            laptop.AssetId = asset.Id;
            _context.Laptops.Add(laptop);
            await _context.SaveChangesAsync();

            asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
            _context.Entry(asset).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLaptop), new { id = laptop.Id }, laptop);
        }

        // ✅ PUT (Edit existing laptop)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLaptop(int id, [FromBody] Laptop laptop)
        {
            laptop.Id = id;

            bool exists = await _context.Laptops
                .AnyAsync(l => l.Id != id && l.AssetTag.ToLower() == laptop.AssetTag.ToLower());

            if (exists)
                return BadRequest(new { message = "Another laptop with the same AssetTag exists" });

            _context.Entry(laptop).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Laptops.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            if (laptop.AssetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(laptop.AssetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
                    _context.Entry(asset).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            return NoContent();
        }

        // ✅ DELETE (with delete history)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLaptop(int id)
        {
            var laptop = await _context.Laptops.FindAsync(id);
            if (laptop == null)
                return NotFound();

            var history = new AdminDeleteHistory
            {
                DeletedItemName = laptop.AssetTag,
                ItemType = "Laptop",
                AdminName = "AdminUser",
                DeletedAt = DateTime.Now
            };
            _context.AdminDeleteHistories.Add(history);

            int? assetId = laptop.AssetId;

            _context.Laptops.Remove(laptop);
            await _context.SaveChangesAsync();

            if (assetId.HasValue)
            {
                var asset = await _context.Assets.FindAsync(assetId.Value);
                if (asset != null)
                {
                    asset.Quantity = await _context.Laptops.CountAsync(l => l.AssetId == asset.Id);
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
