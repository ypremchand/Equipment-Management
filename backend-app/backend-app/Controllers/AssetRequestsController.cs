using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [Route("api/AssetRequests")]
    [ApiController]
    public class AssetRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ POST: api/AssetRequests (User creates request)
        [HttpPost]
        public async Task<IActionResult> CreateAssetRequest([FromBody] AssetRequest request)
        {
            if (request == null || request.AssetRequestItems == null || !request.AssetRequestItems.Any())
                return BadRequest("Request must include at least one asset item.");

            try
            {
                request.Status = "Pending";
                request.RequestDate = DateTime.Now;

                // 🟨 Do NOT modify asset quantity here
                _context.AssetRequests.Add(request);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "✅ Request submitted successfully.", RequestId = request.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error processing request: {ex.Message}");
            }
        }

        // ✅ GET: api/AssetRequests (Admin view)
        [HttpGet]
        public async Task<IActionResult> GetAllRequests()
        {
            var requests = await _context.AssetRequests
                .Include(r => r.User)
                .Include(r => r.Location)
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            return Ok(requests);
        }

        // ✅ GET: api/AssetRequests/by-email?email=user@example.com (User view)
        [HttpGet("by-email")]
        public async Task<IActionResult> GetRequestsByEmail([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email is required.");

            var requests = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .Include(r => r.Location)
                .Include(r => r.User)
                .Where(r => r.User.Email.ToLower() == email.ToLower())
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            return Ok(requests);
        }

        // ✅ POST: api/AssetRequests/approve/{id}
        [HttpPost("approve/{id}")]
        public async Task<IActionResult> ApproveRequest(int id)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Status == "Approved")
                return BadRequest("Request already approved.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var item in request.AssetRequestItems)
                {
                    var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == item.AssetId);

                    if (asset == null)
                        return NotFound($"Asset with ID {item.AssetId} not found.");

                    if (asset.Quantity < item.RequestedQuantity)
                        return BadRequest($"Not enough {asset.Name} available. Only {asset.Quantity} left in stock.");

                    // ✅ Decrease the quantity and mark as modified
                    asset.Quantity -= item.RequestedQuantity;
                    _context.Entry(asset).State = EntityState.Modified;

                    item.ApprovedQuantity = item.RequestedQuantity;
                }

                request.Status = "Approved";
                _context.Entry(request).State = EntityState.Modified;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = "✅ Request approved and stock updated successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error approving request: {ex.Message}");
            }
        }


        // ✅ POST: api/AssetRequests/reject/{id}
        [HttpPost("reject/{id}")]
        public async Task<IActionResult> RejectRequest(int id)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Status == "Rejected")
                return BadRequest("Request already rejected.");

            // 🟨 No stock changes on rejection
            request.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { Message = "🚫 Request rejected successfully (no stock change)." });
        }
        // ✅ POST: api/AssetRequests/cancel/{id}
        [HttpPost("cancel/{id}")]
        public async Task<IActionResult> CancelRequest(int id)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Status != "Approved")
                return BadRequest("Only approved requests can be cancelled.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var item in request.AssetRequestItems)
                {
                    var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == item.AssetId);
                    if (asset == null)
                        return NotFound($"Asset with ID {item.AssetId} not found.");

                    // ✅ Restore quantity to stock
                    asset.Quantity += (item.ApprovedQuantity ?? 0);
                    _context.Entry(asset).State = EntityState.Modified;

                    // Reset approved quantity
                    item.ApprovedQuantity = 0;
                }

                // ✅ Update request status
                request.Status = "Cancelled";
                _context.Entry(request).State = EntityState.Modified;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = "❌ Approved request cancelled and stock restored successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error cancelling request: {ex.Message}");
            }
        }


    }
}
