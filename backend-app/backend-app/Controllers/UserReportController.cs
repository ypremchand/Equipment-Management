using backend_app.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserReportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserReportController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/UserReport/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserReport(int id)
        {
            var userReport = await _context.Users
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.PhoneNumber,

                    // ⭐ ALL requests submitted by this user
                    Requests = _context.AssetRequests
                        .Where(r => r.UserId == u.Id)
                        .Select(r => new
                        {
                            r.Id,
                            r.Status,
                            r.RequestDate,
                            Location = r.Location.Name,
                            r.Message,

                            AssetItems = r.AssetRequestItems.Select(i => new
                            {
                                i.Id,
                                AssetName = i.Asset.Name,
                                i.RequestedQuantity,
                                i.ApprovedQuantity,
                                i.PartialReason,

                                // Specifications / filters
                                i.Brand,
                                i.Processor,
                                i.Storage,
                                i.Ram,
                                i.OperatingSystem,
                                i.NetworkType,
                                i.SimType,
                                i.SimSupport,
                                i.PrinterType,
                                i.PaperSize,
                                i.Dpi,
                                i.Scanner1Type,
                                i.Scanner1Resolution
                            })
                        })
                        .OrderByDescending(r => r.Id)
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (userReport == null)
                return NotFound(new { message = "User not found." });

            return Ok(userReport);
        }
    }
}
