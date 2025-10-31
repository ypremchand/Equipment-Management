using backend_app.Data;
using EquipmentDispatchManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipmentDispatchManagement.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContactController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ POST: api/contact
        [HttpPost]
        public async Task<IActionResult> PostRequest([FromBody] AssetRequestDto requestDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var newRequest = new AssetRequest
            {
                Username = requestDto.Username,
                Email = requestDto.Email,
                PhoneNumber = requestDto.PhoneNumber,
                Location = requestDto.Location,
                Message = requestDto.Message,
                AssetRequestItems = requestDto.AssetRequests.Select(a => new AssetRequestItem
                {
                    Asset = a.Asset,
                    RequestedQuantity = a.RequestedQuantity,
                    AvailableQuantity = a.AvailableQuantity
                }).ToList()
            };

            _context.AssetRequests.Add(newRequest);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Request submitted successfully" });
        }

        // ✅ GET: api/contact?email=user@example.com
        [HttpGet]
        public async Task<IActionResult> GetRequests([FromQuery] string? email)
        {
            var query = _context.AssetRequests.AsQueryable();

            if (!string.IsNullOrEmpty(email))
                query = query.Where(r => r.Email.ToLower() == email.ToLower());

            var requests = await query
                .Select(r => new
                {
                    r.Id,
                    r.Username,
                    r.Email,
                    r.PhoneNumber,
                    r.Location,
                    r.Message
                })
                .ToListAsync();

            return Ok(requests);
        }



        // ✅ PUT: api/contact/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRequest(int id, [FromBody] AssetRequest updatedRequest)
        {
            var existing = await _context.AssetRequests.FindAsync(id);
            if (existing == null)
                return NotFound("Request not found.");

            existing.Username = updatedRequest.Username;
            existing.Email = updatedRequest.Email;
            existing.PhoneNumber = updatedRequest.PhoneNumber;
            existing.Location = updatedRequest.Location;
            existing.Message = updatedRequest.Message;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // ✅ DELETE: api/contact/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            var request = await _context.AssetRequests.FindAsync(id);
            if (request == null)
                return NotFound("Request not found.");

            _context.AssetRequests.Remove(request);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully" });
        }
    }

    // ✅ DTOs
    public class AssetRequestDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string Location { get; set; }
        public string? Message { get; set; }
        public List<AssetRequestItemDto> AssetRequests { get; set; }
    }

    public class AssetRequestItemDto
    {
        public string Asset { get; set; }
        public int RequestedQuantity { get; set; }
        public int AvailableQuantity { get; set; }
    }
}
