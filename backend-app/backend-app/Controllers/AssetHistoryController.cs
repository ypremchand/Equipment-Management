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
        // GET: api/AssetHistory/{assetType}/{assetTag}
        // Used by React "View History" modal
        // ============================================================
        [HttpGet("{assetType}/{assetTag}")]
        public async Task<IActionResult> GetHistory(string assetType, string assetTag)
        {
            if (string.IsNullOrWhiteSpace(assetType) || string.IsNullOrWhiteSpace(assetTag))
                return BadRequest("AssetType and AssetTag are required.");

            assetType = assetType
                .ToLower()
                .Trim()
                .TrimEnd('s'); // 🔥 REMOVE PLURAL

            var history = await _context.AssetHistories
                .Where(h =>
                    h.AssetType == assetType &&
                    h.AssetTag == assetTag
                )
                .OrderByDescending(h => h.AssignedDate)
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
        // Optional: manual history insert
        // ============================================================
        [HttpPost]
        public async Task<IActionResult> AddHistory([FromBody] AssetHistory model)
        {
            if (model == null)
                return BadRequest("Invalid history data.");

            if (string.IsNullOrWhiteSpace(model.AssetType))
                return BadRequest("AssetType is required.");

            _context.AssetHistories.Add(model);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Asset history saved successfully." });
        }
    }
}
