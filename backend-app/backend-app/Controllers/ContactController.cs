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

        // CATEGORY DETECTOR
        private string GetCategoryFromAssetName(string assetName)
        {
            assetName = assetName.ToLower();

            if (assetName.Contains("laptop")) return "Laptop";
            if (assetName.Contains("mobile")) return "Mobile";
            if (assetName.Contains("tablet")) return "Tablet";
            if (assetName.Contains("desktop")) return "Desktop";
            if (assetName.Contains("printer")) return "Printer";
            if (assetName.Contains("scanner1")) return "Scanner1";
            if (assetName.Contains("scanner2")) return "Scanner2";
            if (assetName.Contains("scanner3")) return "Scanner3";
            if (assetName.Contains("barcode")) return "Barcode";

            return "Unknown";
        }


        // CLEAN SPECS BASED ON CATEGORY
        private void CleanSpecsByCategory(string category, AssetRequestItemDto item)
        {
            if (category == "Laptop")
            {
                item.NetworkType = null;
                item.SimType = null;
                item.SimSupport = null;


                // ❌ scanners not allowed
                item.Scanner1Type = null;
                item.Scanner1Resolution = null;
                item.Scanner2Type = null;
                item.Scanner2Resolution = null;
                item.Scanner3Type = null;
                item.Scanner3Resolution = null;

                // ❌ Printors not allowed
                item.PrinterType = null;
                item.PaperSize = null;
                item.Dpi = null;
            }
            else if (category == "Mobile")
            {
                item.OperatingSystem = null;
                item.SimSupport = null;


                // ❌ scanners not allowed
                item.Scanner1Type = null;
                item.Scanner1Resolution = null;
                item.Scanner2Type = null;
                item.Scanner2Resolution = null;
                item.Scanner3Type = null;
                item.Scanner3Resolution = null;
                item.PrinterType = null;
                item.PaperSize = null;
                item.Dpi = null;
            }
            else if (category == "Tablet")
            {
                item.SimType = null;

                // ❌ scanners not allowed
                item.Scanner1Type = null;
                item.Scanner1Resolution = null;
                item.Scanner2Type = null;
                item.Scanner2Resolution = null;
                item.Scanner3Type = null;
                item.Scanner3Resolution = null;
                item.PrinterType = null;
                item.PaperSize = null;
                item.Dpi = null;
            }
            else if (category == "Printer")
            {
                item.Brand = null;
                item.Processor = null;
                item.Storage = null;
                item.Ram = null;
                item.OperatingSystem = null;
                item.NetworkType = null;
                item.SimType = null;
                item.SimSupport = null;

                // ❌ scanners not allowed
                item.Scanner1Type = null;
                item.Scanner1Resolution = null;
                item.Scanner2Type = null;
                item.Scanner2Resolution = null;
                item.Scanner3Type = null;
                item.Scanner3Resolution = null;
            }
            else if (category == "Desktop")
            {
                item.NetworkType = null;
                item.SimType = null;
                item.SimSupport = null;

                // ❌ scanners not allowed
                item.Scanner1Type = null;
                item.Scanner1Resolution = null;
                item.Scanner2Type = null;
                item.Scanner2Resolution = null;
                item.Scanner3Type = null;
                item.Scanner3Resolution = null;
                item.PrinterType = null;
                item.PaperSize = null;
                item.Dpi = null;
            }
            else if (category == "Scanner1")
            {
                item.Brand = null;
                item.Processor = null;
                item.Storage = null;
                item.Ram = null;
                item.OperatingSystem = null;
                item.NetworkType = null;
                item.SimType = null;
                item.SimSupport = null;
                item.PrinterType = null;
            }

            else if (category == "Scanner2")
            {
                item.Brand = null;
                item.Processor = null;
                item.Storage = null;
                item.Ram = null;
                item.OperatingSystem = null;
                item.NetworkType = null;
                item.SimType = null;
                item.SimSupport = null;
                item.PrinterType = null;
            }
            else if (category == "Scanner3")
            {
                item.Brand = null;
                item.Processor = null;
                item.Storage = null;
                item.Ram = null;
                item.OperatingSystem = null;
                item.NetworkType = null;
                item.SimType = null;
                item.SimSupport = null;
                item.PrinterType = null;
            }

            else if (category == "Barcode")
            {
                item.Brand = null;
                item.Processor = null;
                item.Storage = null;
                item.Ram = null;
                item.OperatingSystem = null;
                item.NetworkType = null;
                item.SimType = null;
                item.SimSupport = null;

                // ❌ scanners not allowed
                item.Scanner1Type = null;
                item.Scanner1Resolution = null;
                item.Scanner2Type = null;
                item.Scanner2Resolution = null;
                item.Scanner3Type = null;
                item.Scanner3Resolution = null;

                // ❌ printer-only
                item.PrinterType = null;
                item.PaperSize = null;
                item.Dpi = null;

                // ✅ ONLY THESE ALLOWED
                // item.Type
                // item.Technology
            }


        }

        // POST: CREATE NEW REQUEST
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

            foreach (var item in request.AssetRequests)
            {
                var asset = await _context.Assets
                    .FirstOrDefaultAsync(a => a.Name.ToLower() == item.Asset.ToLower());

                if (asset != null)
                {
                    string category = GetCategoryFromAssetName(asset.Name);
                    CleanSpecsByCategory(category, item);

                    _context.AssetRequestItems.Add(new AssetRequestItem
                    {
                        AssetRequestId = assetRequest.Id,
                        AssetId = asset.Id,
                        RequestedQuantity = item.RequestedQuantity,

                        Brand = item.Brand,
                        Processor = item.Processor,
                        Storage = item.Storage,
                        Ram = item.Ram,
                        OperatingSystem = item.OperatingSystem,
                        NetworkType = item.NetworkType,
                        SimType = item.SimType,
                        SimSupport = item.SimSupport,
                        PrinterType = item.PrinterType,
                        PaperSize = item.PaperSize,
                        Dpi = item.Dpi,
                        Scanner1Type = item.Scanner1Type,
                        Scanner1Resolution=item.Scanner1Resolution,
                        Scanner2Type = item.Scanner2Type,
                        Scanner2Resolution = item.Scanner2Resolution,
                        Scanner3Type = item.Scanner3Type,
                        Scanner3Resolution = item.Scanner3Resolution,
                      Type=item.Type,
                      Technology=item.Technology,

                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Request submitted successfully." });
        }

        // PUT: UPDATE REQUEST
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

            if (existing.Status != "Pending")
                return BadRequest("Only pending requests can be edited.");

            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.Name.ToLower() == request.Location.ToLower());

            if (location == null)
                return BadRequest("Location not found.");

            existing.LocationId = location.Id;
            existing.Message = request.Message;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user != null)
            {
                user.PhoneNumber = request.PhoneNumber;
            }

            _context.AssetRequestItems.RemoveRange(existing.AssetRequestItems);

            foreach (var item in request.AssetRequests)
            {
                var asset = await _context.Assets
                    .FirstOrDefaultAsync(a => a.Name.ToLower() == item.Asset.ToLower());

                if (asset != null)
                {
                    string category = GetCategoryFromAssetName(asset.Name);
                    CleanSpecsByCategory(category, item);

                    _context.AssetRequestItems.Add(new AssetRequestItem
                    {
                        AssetRequestId = existing.Id,
                        AssetId = asset.Id,
                        RequestedQuantity = item.RequestedQuantity,

                        Brand = item.Brand,
                        Processor = item.Processor,
                        Storage = item.Storage,
                        Ram = item.Ram,
                        OperatingSystem = item.OperatingSystem,
                        NetworkType = item.NetworkType,
                        SimType = item.SimType,
                        SimSupport = item.SimSupport,
                        PrinterType = item.PrinterType,
                        PaperSize = item.PaperSize,
                        Dpi = item.Dpi,
                        Scanner1Type = item.Scanner1Type,
                        Scanner1Resolution = item.Scanner1Resolution,
                        Scanner2Type = item.Scanner2Type,
                        Scanner2Resolution = item.Scanner2Resolution,
                        Scanner3Type = item.Scanner3Type,
                        Scanner3Resolution = item.Scanner3Resolution,
                        Type=item.Type,
                        Technology=item.Technology,
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Request updated successfully." });
        }

        // DTOs
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

            public string? Brand { get; set; }
            public string? Processor { get; set; }
            public string? Storage { get; set; }
            public string? Ram { get; set; }
            public string? OperatingSystem { get; set; }
            public string? NetworkType { get; set; }
            public string? SimType { get; set; }
            public string? SimSupport { get; set; }
            public string? Scanner1Type { get; set; }
            public string? Scanner1Resolution { get; set; }
            public string? Scanner2Type { get; set; }
            public string? Scanner2Resolution { get; set; }
            public string? Scanner3Type { get; set; }
            public string? Scanner3Resolution { get; set; }
            public string? Type { get; set; }
            public string? Technology { get; set; }
            public string? PrinterType { get; set; }
            public string? PaperSize { get; set; }
            public string? Dpi { get; set; }
        }
    }
}
