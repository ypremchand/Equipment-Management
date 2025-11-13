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

                    // ✅ Deduct stock
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

            request.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "🚫 Request rejected successfully. Quantity unchanged." });
        }

        // ✅ POST: api/AssetRequests/assign/{itemId}
        [HttpPost("assign/{itemId}")]
        public async Task<IActionResult> AssignLaptops(int itemId, [FromBody] List<int> laptopIds)
        {
            if (laptopIds == null || !laptopIds.Any())
                return BadRequest("No laptops selected for assignment.");

            var item = await _context.AssetRequestItems
                .Include(i => i.Asset)
                .Include(i => i.AssetRequest)
                .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(i => i.Id == itemId);

            if (item == null)
                return NotFound("Request item not found.");

            if (item.Asset?.Name?.ToLower().Contains("laptop") != true)
                return BadRequest("Assignment is only for laptops.");

            // ✅ Ensure laptops exist
            var laptops = await _context.Laptops
                .Where(l => laptopIds.Contains(l.Id))
                .ToListAsync();

            // ✅ Check if already assigned
            var alreadyAssigned = await _context.AssignedAssets
                .Where(a => laptopIds.Contains(a.LaptopId) && a.Status == "Assigned")
                .Select(a => a.LaptopId)
                .ToListAsync();

            if (alreadyAssigned.Any())
                return BadRequest($"Some laptops are already assigned: {string.Join(", ", alreadyAssigned)}");

            // ✅ Assign laptops
            foreach (var laptop in laptops)
            {
                _context.AssignedAssets.Add(new AssignedAsset
                {
                    AssetRequestItemId = item.Id,
                    LaptopId = laptop.Id,
                    Status = "Assigned"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "✅ Laptops assigned successfully!" });
        }

        // ✅ DELETE: api/AssetRequests/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            Console.WriteLine($"🧩 Trying to delete request ID: {id}");

            bool exists = await _context.AssetRequests.AnyAsync(r => r.Id == id);
            Console.WriteLine($"🧩 Exists in EF? {exists}");

            var request = await _context.AssetRequests.FindAsync(id);
            if (request == null)
            {
                Console.WriteLine("🧩 Not found inside simplified query!");
                return NotFound(new { Message = $"Request with ID {id} not found in EF." });
            }

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

                // ✅ Remove linked AssignedAssets
                var assignedAssets = await _context.AssignedAssets
                    .Where(a => a.AssetRequestItem.AssetRequestId == request.Id)
                    .ToListAsync();
                _context.AssignedAssets.RemoveRange(assignedAssets);

                // ✅ Remove related items and request
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
        [HttpPost("confirm-approve/{requestId}")]
        public async Task<IActionResult> ConfirmApprove(
    int requestId,
    [FromBody] ApproveRequestDto dto)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
                return NotFound("Request not found.");

            using var tx = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var assign in dto.Assignments)
                {
                    var item = request.AssetRequestItems
                        .FirstOrDefault(i => i.Id == assign.ItemId);

                    if (item == null)
                        return BadRequest($"Invalid item {assign.ItemId}");

                    foreach (var laptopId in assign.LaptopIds)
                    {
                        _context.AssignedAssets.Add(new AssignedAsset
                        {
                            AssetRequestItemId = item.Id,
                            LaptopId = laptopId,
                            AssignedDate = DateTime.Now,
                            Status = "Assigned"
                        });

                        // reduce asset quantity
                        item.Asset.Quantity -= 1;
                    }

                    item.ApprovedQuantity = assign.LaptopIds.Count;
                }

                request.Status = "Approved";

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Approved & laptops assigned!" });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableLaptops()
        {
            var assigned = await _context.AssignedAssets
                .Where(a => a.Status == "Assigned")
                .Select(a => a.LaptopId)
                .ToListAsync();

            var available = await _context.Laptops
                .Where(l => !assigned.Contains(l.Id))
                .ToListAsync();

            return Ok(available);
        }

        public class ApproveRequestDto
        {
            public List<AssignmentDto> Assignments { get; set; } = new();
        }

        public class AssignmentDto
        {
            public int ItemId { get; set; }
            public List<int> LaptopIds { get; set; } = new();
        }
    }
}