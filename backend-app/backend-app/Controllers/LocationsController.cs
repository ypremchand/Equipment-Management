using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/locations")]
    public class LocationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationsController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET all locations
        [HttpGet("")]
        public async Task<ActionResult<IEnumerable<Location>>> GetLocations()
        {
            var locations = await _context.Locations.ToListAsync();
            return Ok(locations);
        }

        // ✅ POST create location
        [HttpPost("")]
        public async Task<ActionResult<Location>> CreateLocation([FromBody] Location location)
        {
            if (location == null || string.IsNullOrWhiteSpace(location.Name))
                return BadRequest("Location name is required.");

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLocations), new { id = location.Id }, location);
        }

        // ✅ PUT update location
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] Location location)
        {
            if (id != location.Id)
                return BadRequest("Mismatched location ID.");

            var existing = await _context.Locations.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.Name = location.Name;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ✅ DELETE location + log delete history
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null)
                return NotFound();

            // 🔹 Log Delete History
            var history = new AdminDeleteHistory
            {
                DeletedItemName = location.Name,
                ItemType = "Location",
                AdminName = "AdminUser", // Replace with logged-in admin if available
                DeletedAt = DateTime.Now
            };
            _context.AdminDeleteHistories.Add(history);

            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
