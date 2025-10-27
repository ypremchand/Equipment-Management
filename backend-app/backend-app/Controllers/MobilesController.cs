using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MobilesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MobilesController(AppDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/mobiles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Mobile>>> GetMobiles()
        {
            return await _context.Mobiles.ToListAsync();
        }

        // ✅ GET: api/mobiles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Mobile>> GetMobile(int id)
        {
            var mobile = await _context.Mobiles.FindAsync(id);

            if (mobile == null)
                return NotFound();

            return mobile;
        }

        // ✅ POST: api/mobiles
        [HttpPost]
        public async Task<ActionResult<Mobile>> PostMobile(Mobile mobile)
        {
            _context.Mobiles.Add(mobile);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMobile), new { id = mobile.Id }, mobile);
        }

        // ✅ PUT: api/mobiles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMobile(int id, Mobile mobile)
        {
            if (id != mobile.Id)
                return BadRequest();

            _context.Entry(mobile).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Mobiles.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // ✅ DELETE: api/mobiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMobile(int id)
        {
            var mobile = await _context.Mobiles.FindAsync(id);
            if (mobile == null)
                return NotFound();

            _context.Mobiles.Remove(mobile);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
