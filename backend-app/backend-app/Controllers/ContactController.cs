using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContactController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ POST: api/contact (User creates request)
        [HttpPost]
        public async Task<IActionResult> CreateContact([FromBody] AssetRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request data.");

            // ✅ Check if user exists
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return NotFound("User not found.");

            // ✅ Check if location exists
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.Name == request.Location);
            if (location == null)
                return NotFound("Location not found.");

            // ✅ Create asset request with Pending status (not auto-approved)
            var assetRequest = new AssetRequest
            {
                UserId = user.Id,
                LocationId = location.Id,
                RequestDate = DateTime.Now,
                Status = "Pending", // 🟩 Corrected — do not auto-approve
                Message = request.Message
            };

            _context.AssetRequests.Add(assetRequest);
            await _context.SaveChangesAsync();

            // ✅ Add requested items (without modifying stock yet)
            foreach (var item in request.AssetRequests)
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name == item.Asset);
                if (asset != null)
                {
                    _context.AssetRequestItems.Add(new AssetRequestItem
                    {
                        AssetRequestId = assetRequest.Id,
                        AssetId = asset.Id,
                        RequestedQuantity = item.RequestedQuantity
                    });
                    // ❌ DO NOT modify asset.Quantity here
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "✅ Request submitted successfully. Waiting for admin approval." });
        }

        // ✅ GET: api/contact?email=user@example.com (Get user’s requests)
        [HttpGet]
        public async Task<IActionResult> GetRequests([FromQuery] string? email)
        {
            var query = _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .Include(r => r.Location)
                .Include(r => r.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(email))
            {
                query = query.Where(r => r.User.Email.ToLower() == email.ToLower());
            }

            var result = await query
                .Select(r => new
                {
                    r.Id,
                    r.RequestDate,
                    r.Status,
                    Location = r.Location.Name,
                    AssetRequestItems = r.AssetRequestItems.Select(i => new
                    {
                        AssetName = i.Asset.Name,
                        i.RequestedQuantity
                    })
                })
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            return Ok(result);
        }

        // ✅ PUT: api/contact/return/{id} (User returns assets)
        [HttpPut("return/{id}")]
        public async Task<IActionResult> ReturnAssets(int id)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                .ThenInclude(i => i.Asset)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            if (request.Status == "Returned")
                return BadRequest("Assets already returned.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // ✅ Restore asset stock
                foreach (var item in request.AssetRequestItems)
                {
                    if (item.Asset != null)
                    {
                        item.Asset.Quantity += item.RequestedQuantity;
                        _context.Entry(item.Asset).State = EntityState.Modified;
                    }
                }

                // ✅ Update request status
                request.Status = "Returned";
                _context.Entry(request).State = EntityState.Modified;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "✅ Assets returned successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error returning assets: {ex.Message}");
            }
        }
    }

    // ✅ DTOs (Data Transfer Objects)
    public class AssetRequestDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Location { get; set; }
        public string Message { get; set; }
        public List<AssetRequestItemDto> AssetRequests { get; set; }
    }

    public class AssetRequestItemDto
    {
        public string Asset { get; set; }
        public int RequestedQuantity { get; set; }
        public int AvailableQuantity { get; set; }
    }
}