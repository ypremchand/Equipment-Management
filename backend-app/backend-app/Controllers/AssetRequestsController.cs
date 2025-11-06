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
                    var asset = item.Asset;

                    if (asset == null)
                        return NotFound($"Asset not found for item {item.Id}.");

                    if (asset.Quantity < item.RequestedQuantity)
                        return BadRequest($"Not enough stock for {asset.Name}. Only {asset.Quantity} left.");

                    // ✅ Deduct stock only once here
                    asset.Quantity -= item.RequestedQuantity;
                    item.ApprovedQuantity = item.RequestedQuantity;

                    _context.Entry(asset).State = EntityState.Modified;
                }

                request.Status = "Approved";
                _context.Entry(request).State = EntityState.Modified;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "✅ Request approved and quantity updated." });
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

            // ✅ Reject request but do NOT change stock
            request.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "🚫 Request rejected successfully. Quantity unchanged." });
        }


        // ✅ DELETE: api/AssetRequests/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            Console.WriteLine($"🧩 Trying to delete request ID: {id}");

            bool exists = await _context.AssetRequests.AnyAsync(r => r.Id == id);
            Console.WriteLine($"🧩 Exists in EF? {exists}");

            // ✅ Simplified query (avoid Include() tracking issues)
            var request = await _context.AssetRequests.FindAsync(id);

            if (request == null)
            {
                Console.WriteLine("🧩 Not found inside simplified query!");
                return NotFound(new { Message = $"Request with ID {id} not found in EF." });
            }

            // ✅ Load related items manually (EF-safe)
            await _context.Entry(request)
                .Collection(r => r.AssetRequestItems)
                .Query()
                .Include(i => i.Asset)
                .LoadAsync();

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // ✅ Restore stock if Approved
                if (request.Status == "Approved")
                {
                    foreach (var item in request.AssetRequestItems)
                    {
                        var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == item.AssetId);
                        if (asset != null)
                        {
                            asset.Quantity += (item.ApprovedQuantity ?? 0);
                            _context.Entry(asset).State = EntityState.Modified;
                        }
                    }
                }

                // ✅ Remove related items and main request
                _context.AssetRequestItems.RemoveRange(request.AssetRequestItems);
                _context.AssetRequests.Remove(request);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                Console.WriteLine($"✅ Successfully deleted request ID: {id}");
                return Ok(new { Message = "🗑️ Request deleted successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"❌ Error deleting request: {ex.Message}");
                return StatusCode(500, $"Error deleting request: {ex.Message}");
            }
        }
    }
}
