using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssetRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ POST: api/AssetRequests
        [HttpPost]
        public async Task<IActionResult> CreateAssetRequest([FromBody] AssetRequest request)
        {
            if (request == null || request.AssetRequestItems == null || !request.AssetRequestItems.Any())
                return BadRequest("Request must include at least one asset item.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 🧩 Validate stock before deducting
                foreach (var item in request.AssetRequestItems)
                {
                    var asset = await _context.Assets.FindAsync(item.AssetId);
                    if (asset == null)
                        return NotFound($"Asset with ID {item.AssetId} not found.");

                    if (asset.Quantity < item.RequestedQuantity)
                        return BadRequest($"Not enough {asset.Name} available. Only {asset.Quantity} in stock.");
                }

                // 🧩 Deduct quantities (reserve items)
                foreach (var item in request.AssetRequestItems)
                {
                    var asset = await _context.Assets.FindAsync(item.AssetId);
                    if (asset != null)
                    {
                        asset.Quantity -= item.RequestedQuantity;
                        _context.Assets.Update(asset);
                    }
                }

                // 🧩 Save request
                request.Status = "Pending";
                request.RequestDate = DateTime.Now;
                _context.AssetRequests.Add(request);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    Message = "Request submitted successfully.",
                    RequestId = request.Id
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error processing request: {ex.Message}");
            }
        }

        // ✅ GET: api/AssetRequests (admin view)
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

        // ✅ GET: api/AssetRequests?email=user@example.com (user view)
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

            foreach (var item in request.AssetRequestItems)
            {
                if (item.Asset == null)
                    continue;

                // Ensure valid approval
                item.ApprovedQuantity = item.RequestedQuantity;
            }

            request.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Request approved successfully." });
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

            // 🧩 Return reserved quantities back to stock
            foreach (var item in request.AssetRequestItems)
            {
                var asset = item.Asset;
                if (asset != null)
                {
                    asset.Quantity += item.RequestedQuantity;
                    _context.Assets.Update(asset);
                }
            }

            request.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Request rejected and stock restored." });
        }
    }
}
