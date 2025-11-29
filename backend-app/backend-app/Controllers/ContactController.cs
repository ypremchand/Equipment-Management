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

            // GET USER
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null)
                return NotFound("User not found.");

            // GET LOCATION
            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.Name.ToLower() == request.Location.ToLower());

            if (location == null)
                return NotFound("Location not found.");


            // ✅ Create asset request (Pending status)
            var assetRequest = new AssetRequest
            {
                UserId = user.Id,
                LocationId = location.Id,
                RequestDate = DateTime.Now,
                Status = "Pending",
                Message = request.Message
            };

            _context.AssetRequests.Add(assetRequest);
            await _context.SaveChangesAsync();

            // ✅ Add request items
            foreach (var item in request.AssetRequests)
            {
                var asset = await _context.Assets
    .FirstOrDefaultAsync(a => a.Name.ToLower() == item.Asset.ToLower());


                if (asset != null)
                {
                    _context.AssetRequestItems.Add(new AssetRequestItem
                    {
                        AssetRequestId = assetRequest.Id,
                        AssetId = asset.Id,
                        RequestedQuantity = item.RequestedQuantity
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "✅ Request submitted successfully. Waiting for admin approval." });
        }

        // ✅ GET: api/contact?email=user@mail.com (Get user's asset requests)
        [HttpGet]
        public async Task<IActionResult> GetRequests([FromQuery] string? email)
        {
            var query = _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .Include(r => r.Location)
                .Include(r => r.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(email))
            {
                query = query.Where(r =>
                    string.Equals(r.User.Email, email, StringComparison.OrdinalIgnoreCase));
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

        // ✅ PUT: api/contact/return/{id}
        [HttpPut("return/{id}")]
        public async Task<IActionResult> ReturnAssets(int id)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.AssignedAssets)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            if (string.Equals(request.Status, "Returned", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Assets already returned.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var item in request.AssetRequestItems)
                {
                    foreach (var assigned in item.AssignedAssets)
                    {
                        // Mark return
                        assigned.Status = "Returned";
                        assigned.ReturnedDate = DateTime.Now;

                        var type = assigned.AssetType.ToLower();

                        if (string.Equals(type, "laptop", StringComparison.OrdinalIgnoreCase))
                        {
                            var lap = await _context.Laptops.FindAsync(assigned.AssetTypeItemId);
                            if (lap?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(lap.AssetId.Value);
                                if (asset != null)
                                    asset.Quantity += 1;
                            }
                        }
                        else if (string.Equals(type, "mobile", StringComparison.OrdinalIgnoreCase))
                        {
                            var mob = await _context.Mobiles.FindAsync(assigned.AssetTypeItemId);
                            if (mob?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(mob.AssetId.Value);
                                if (asset != null)
                                    asset.Quantity += 1;
                            }
                        }
                        else if (string.Equals(type, "tablet", StringComparison.OrdinalIgnoreCase))
                        {
                            var tab = await _context.Tablets.FindAsync(assigned.AssetTypeItemId);
                            if (tab?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(tab.AssetId.Value);
                                if (asset != null)
                                    asset.Quantity += 1;
                            }
                        }
                    }
                }

                request.Status = "Returned";
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Assets returned successfully!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Error returning assets: {ex.Message}");
            }
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRequest(int id, [FromBody] AssetRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request.");

            var existing = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (existing == null)
                return NotFound("Request not found.");

            if (!string.Equals(existing.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only pending requests can be edited.");

            // Update location
            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.Name.ToLower() == request.Location.ToLower());

            if (location == null)
                return BadRequest("Location not found.");

            existing.LocationId = location.Id;

            // Update message
            existing.Message = request.Message;

            // Update phone
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user != null)
            {
                user.PhoneNumber = request.PhoneNumber;
            }

            // Remove old asset items
            _context.AssetRequestItems.RemoveRange(existing.AssetRequestItems);

            // Add new items
            foreach (var item in request.AssetRequests)
            {
                var asset = await _context.Assets
                    .FirstOrDefaultAsync(a => a.Name.ToLower() == item.Asset.ToLower());

                if (asset == null) continue;

                _context.AssetRequestItems.Add(new AssetRequestItem
                {
                    AssetRequestId = existing.Id,
                    AssetId = asset.Id,
                    RequestedQuantity = item.RequestedQuantity
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Request updated successfully." });
        }


        // ===============================
        // ✅ DTOs (Warning-Free)
        // ===============================

        public class AssetRequestDto(
     string Username,
     string Email,
     string PhoneNumber,
     string Location,
     string Message,
     List<AssetRequestItemDto> AssetRequests)
        {
            public string Username { get; set; } = Username;
            public string Email { get; set; } = Email;
            public string PhoneNumber { get; set; } = PhoneNumber;
            public string Location { get; set; } = Location;
            public string Message { get; set; } = Message;

            // Collection initialization simplified
            public List<AssetRequestItemDto> AssetRequests { get; set; } = AssetRequests ?? new();
        }


        public class AssetRequestItemDto(
    string Asset,
    int RequestedQuantity,
    int AvailableQuantity)
        {
            public string Asset { get; set; } = Asset;
            public int RequestedQuantity { get; set; } = RequestedQuantity;
            public int AvailableQuantity { get; set; } = AvailableQuantity;
        }

    }
}
