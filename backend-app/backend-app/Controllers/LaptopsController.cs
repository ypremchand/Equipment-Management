using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LaptopsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LaptopsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/laptops
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Laptop>>> GetLaptops()
        {
            return await _context.Laptops.ToListAsync();
        }

        // GET: api/laptops/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Laptop>> GetLaptop(int id)
        {
            var laptop = await _context.Laptops.FindAsync(id);

            if (laptop == null)
                return NotFound();

            return laptop;
        }

        // POST: api/laptops
        [HttpPost]
        public async Task<ActionResult<Laptop>> PostLaptop(Laptop laptop)
        {
            _context.Laptops.Add(laptop);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLaptop), new { id = laptop.Id }, laptop);
        }

        // PUT: api/laptops/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLaptop(int id, Laptop laptop)
        {
            if (id != laptop.Id)
                return BadRequest();

            _context.Entry(laptop).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Laptops.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/laptops/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLaptop(int id)
        {
            var laptop = await _context.Laptops.FindAsync(id);
            if (laptop == null)
                return NotFound();

            _context.Laptops.Remove(laptop);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}