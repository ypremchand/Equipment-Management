using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TabletsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TabletsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tablet>>> GetTablets()
        {
            return await _context.Tablets.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Tablet>> GetTablet(int id)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null)
                return NotFound();

            return tablet;
        }

        [HttpPost]
        public async Task<ActionResult<Tablet>> PostTablet(Tablet tablet)
        {
            _context.Tablets.Add(tablet);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTablet), new { id = tablet.Id }, tablet);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTablet(int id, Tablet tablet)
        {
            if (id != tablet.Id)
                return BadRequest();

            _context.Entry(tablet).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Tablets.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTablet(int id)
        {
            var tablet = await _context.Tablets.FindAsync(id);
            if (tablet == null)
                return NotFound();

            _context.Tablets.Remove(tablet);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
