using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LocationsController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/locations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Location>>> GetLocations()
        {
            return await _context.Locations.ToListAsync();
        }

        // ✅ GET: api/locations/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Location>> GetLocation(int id)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null)
                return NotFound();

            return location;
        }

        // ✅ POST: api/locations
        [HttpPost]
        public async Task<ActionResult<Location>> PostLocation(Location location)
        {
            if (string.IsNullOrWhiteSpace(location.Name))
                return BadRequest("Location name is required");

            _context.Locations.Add(location);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLocation), new { id = location.Id }, location);
        }

        // ✅ PUT: api/locations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLocation(int id, Location location)
        {
            if (id != location.Id)
                return BadRequest();

            var existing = await _context.Locations.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.Name = location.Name;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ✅ DELETE: api/locations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var location = await _context.Locations.FindAsync(id);
            if (location == null)
                return NotFound();

            _context.Locations.Remove(location);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
