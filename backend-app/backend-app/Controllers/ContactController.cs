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

        [HttpPost]
        public async Task<IActionResult> CreateContact([FromBody] AssetRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request data.");

            // Find the user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
                return NotFound("User not found.");

            // Find location by name
            var location = await _context.Locations.FirstOrDefaultAsync(l => l.Name == request.Location);
            if (location == null)
                return NotFound("Location not found.");

            var assetRequest = new AssetRequest
            {
                UserId = user.Id,
                LocationId = location.Id,
                RequestDate = DateTime.Now,
                Status = "Pending",
                Message = request.Message   // ✅ Now this will work
            };

            _context.AssetRequests.Add(assetRequest);
            await _context.SaveChangesAsync();

            // Save the individual items
            foreach (var item in request.AssetRequests)
            {
                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Name == item.Asset);
                if (asset != null)
                {
                    _context.AssetRequestItems.Add(new AssetRequestItem
                    {
                        AssetRequestId = assetRequest.Id,
                        AssetId = asset.Id,
                        RequestedQuantity = item.RequestedQuantity,
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Request saved successfully." });
        }
    }

    // ✅ DTOs for request mapping
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
