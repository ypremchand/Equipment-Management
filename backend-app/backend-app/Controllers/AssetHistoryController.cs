using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetHistoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetHistoryController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // GET: api/AssetHistory/{assetTag}
        // Used by React "View History" modal
        // ============================================================
        [HttpGet("{assetTag}")]
        public async Task<IActionResult> GetHistoryByAssetTag(string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetTag))
                return BadRequest("AssetTag is required.");

            var history = await _context.AssetHistories
                .Where(h => h.AssetTag == assetTag)
                .OrderByDescending(h => h.RequestedDate)
                .Select(h => new
                {
                    h.Id,
                    h.AssetTag,
                    h.Brand,
                    h.Location,
                    h.RequestedDate,
                    h.RequestedBy,
                    h.AssignedDate,
                    h.AssignedBy,
                    h.ReturnDate,
                    h.Remarks
                })
                .ToListAsync();

            return Ok(history);
        }

        // ============================================================
        // POST: api/AssetHistory
        // Call this when asset is Assigned / Returned
        // ============================================================
        [HttpPost]
        public async Task<IActionResult> AddHistory([FromBody] AssetHistory model)
        {
            if (model == null)
                return BadRequest("Invalid history data.");

            _context.AssetHistories.Add(model);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Asset history saved successfully." });
        }
    }
}
