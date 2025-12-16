using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Cryptography;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // --------------------------
        // 1) CREATE REQUEST
        // --------------------------
        [HttpPost]
        public async Task<IActionResult> CreateAssetRequest([FromBody] AssetRequest request)
        {
            if (request == null || request.AssetRequestItems == null || !request.AssetRequestItems.Any())
                return BadRequest("Request must include at least one asset item.");

            request.Status = "Pending";
            request.RequestDate = DateTime.Now;

            _context.AssetRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Request submitted successfully.",
                requestId = request.Id
            });
        }

        // --------------------------
        // 2) GET ALL (with assigned item details)
        // --------------------------
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requests = await _context.AssetRequests
                .Include(r => r.User)
                .Include(r => r.Location)
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.AssignedAssets)
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            // Create projection DTO that will include assigned item details
            var allLaptopIds = requests
                .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                .Where(a => a.AssetType?.ToLower() == "laptop")
                .Select(a => a.AssetTypeItemId)
                .Distinct()
                .ToList();

            var allMobileIds = requests
                .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                .Where(a => a.AssetType?.ToLower() == "mobile")
                .Select(a => a.AssetTypeItemId)
                .Distinct()
                .ToList();

            var allTabletIds = requests
                .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                .Where(a => a.AssetType?.ToLower() == "tablet")
                .Select(a => a.AssetTypeItemId)
                .Distinct()
                .ToList();


            var allDesktopIds = requests
           .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
           .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
           .Where(a => a.AssetType?.ToLower() == "desktop")
           .Select(a => a.AssetTypeItemId)
           .Distinct()
           .ToList();


            var allPrinterIds = requests
          .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
          .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
          .Where(a => a.AssetType?.ToLower() == "printer")
          .Select(a => a.AssetTypeItemId)
          .Distinct()
          .ToList();

            var allScanner1Ids = requests
       .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
       .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
       .Where(a => a.AssetType?.ToLower() == "scanner1")
       .Select(a => a.AssetTypeItemId)
       .Distinct()
       .ToList();



            var allScanner2Ids = requests
       .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
       .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
       .Where(a => a.AssetType?.ToLower() == "scanner2")
       .Select(a => a.AssetTypeItemId)
       .Distinct()
       .ToList();


            var allScanner3Ids = requests
       .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
       .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
       .Where(a => a.AssetType?.ToLower() == "scanner3")
       .Select(a => a.AssetTypeItemId)
       .Distinct()
       .ToList();

            var laptops = await _context.Laptops.Where(l => allLaptopIds.Contains(l.Id)).ToDictionaryAsync(l => l.Id);
            var mobiles = await _context.Mobiles.Where(m => allMobileIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id);
            var tablets = await _context.Tablets.Where(t => allTabletIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id);
            var desktops = await _context.Desktops.Where(d => allDesktopIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id);
            var printers = await _context.Printers.Where(p => allPrinterIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
            var scanner1s = await _context.Scanner1.Where(s1 => allScanner1Ids.Contains(s1.Id)).ToDictionaryAsync(s1 => s1.Id);
            var scanner2s = await _context.Scanner2.Where(s2 => allScanner2Ids.Contains(s2.Id)).ToDictionaryAsync(s2 => s2.Id);
            var scanner3s = await _context.Scanner3.Where(s3 => allScanner3Ids.Contains(s3.Id)).ToDictionaryAsync(s3 => s3.Id);

            // Project into a serializable DTO that includes assigned item detail object
            var result = requests.Select(r => new
            {
                r.Id,
                r.RequestDate,
                r.Status,
                r.Message,
                User = new { r.User.Id, r.User.Name, r.User.Email },
                Location = new { r.Location.Id, r.Location.Name },

                AssetRequestItems = r.AssetRequestItems.Select(i => new
                {
                    i.Id,
                    Asset = new { i.Asset.Id, i.Asset.Name },
                    i.RequestedQuantity,
                    i.ApprovedQuantity,
                    PartialReason = i.PartialReason,

                    // ✅ All filter fields included
                    Brand = i.Brand,
                    Processor = i.Processor,
                    Storage = i.Storage,
                    Ram = i.Ram,
                    OperatingSystem = i.OperatingSystem,
                    NetworkType = i.NetworkType,
                    SimType = i.SimType,
                    SimSupport = i.SimSupport,
                    PrinterType = i.PrinterType,
                    PaperSize = i.PaperSize,
                    Dpi = i.Dpi,
                    Scanner1Type= i.Scanner1Type,
                    Scanner1Resolution=i.Scanner1Resolution,
                    Scanner2Type = i.Scanner2Type,
                    Scanner2Resolution = i.Scanner2Resolution,
                    Scanner3Type = i.Scanner3Type,
                    Scanner3Resolution = i.Scanner3Resolution,

                    // Assigned items with details
                    AssignedAssets = i.AssignedAssets.Select(a =>
                    {
                        object detail = null;
                        var type = a.AssetType?.ToLowerInvariant();

                        if (type == "laptop" && laptops.TryGetValue(a.AssetTypeItemId, out var lap))
                            detail = new
                            {
                                lap.Id,
                                lap.Brand,
                                lap.ModelNumber,
                                lap.AssetTag,
                                lap.PurchaseDate
                            };

                        else if (type == "mobile" && mobiles.TryGetValue(a.AssetTypeItemId, out var mob))
                            detail = new
                            {
                                mob.Id,
                                mob.Brand,
                                mob.Model,
                                mob.IMEINumber,
                                mob.AssetTag,
                                mob.PurchaseDate
                            };

                        else if (type == "tablet" && tablets.TryGetValue(a.AssetTypeItemId, out var tab))
                            detail = new
                            {
                                tab.Id,
                                tab.Brand,
                                tab.Model,
                                tab.AssetTag,
                                tab.PurchaseDate
                            };
                        else if (type == "desktop" && desktops.TryGetValue(a.AssetTypeItemId, out var desk))
                            detail = new
                            {
                                desk.Id,
                                desk.Brand,
                                desk.ModelNumber,
                                desk.AssetTag,
                                desk.PurchaseDate
                            };

                        else if (type == "printer" && printers.TryGetValue(a.AssetTypeItemId, out var prin))
                            detail = new
                            {
                                prin.Id,
                                prin.Brand,
                                prin.Model,
                                prin.AssetTag,
                                prin.PurchaseDate
                            };

                        if (type == "scanner1" && scanner1s.TryGetValue(a.AssetTypeItemId, out var sc1))
                            detail = new
                            {
                                sc1.Id,
                                sc1.Scanner1Brand,
                                sc1.Scanner1Model,
                                sc1.Scanner1Type,
                                sc1.Scanner1Resolution,
                                sc1.Scanner1AssetTag,
                                sc1.PurchaseDate
                            };

                        if (type == "scanner2" && scanner2s.TryGetValue(a.AssetTypeItemId, out var sc2))
                            detail = new
                            {
                                sc2.Id,
                                sc2.Scanner2Brand,
                                sc2.Scanner2Model,
                                sc2.Scanner2Type,
                                sc2.Scanner2Resolution,
                                sc2.Scanner2AssetTag,
                                sc2.PurchaseDate
                            };

                        if (type == "scanner3" && scanner3s.TryGetValue(a.AssetTypeItemId, out var sc3))
                            detail = new
                            {
                                sc3.Id,
                                sc3.Scanner3Brand,
                                sc3.Scanner3Model,
                                sc3.Scanner3Type,
                                sc3.Scanner3Resolution,
                                sc3.Scanner3AssetTag,
                                sc3.PurchaseDate
                            };

                        return new
                        {
                            a.Id,
                            a.AssetType,
                            a.AssetTypeItemId,
                            a.Status,
                            a.AssignedDate,
                            a.ReturnedDate,
                            Detail = detail
                        };
                    })
                })
            });


            return Ok(result);
        }

        // --------------------------
        // 3) GET USER REQUESTS BY EMAIL
        // --------------------------
        [HttpGet("by-email")]
        public async Task<IActionResult> GetRequestsByEmail([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email is required.");

            var requests = await _context.AssetRequests
                .Include(r => r.AssetRequestItems).ThenInclude(i => i.Asset)
                .Include(r => r.AssetRequestItems).ThenInclude(i => i.AssignedAssets)
                .Include(r => r.Location)
                .Include(r => r.User)
                .Where(r => r.User.Email.ToLower() == email.ToLower())
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            // --- Collect assigned item IDs
            var allLaptopIds = requests
                .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                .Where(a => a.AssetType?.ToLower() == "laptop")
                .Select(a => a.AssetTypeItemId)
                .Distinct()
                .ToList();

            var allMobileIds = requests
                .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                .Where(a => a.AssetType?.ToLower() == "mobile")
                .Select(a => a.AssetTypeItemId)
                .Distinct()
                .ToList();

            var allTabletIds = requests
                .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                .Where(a => a.AssetType?.ToLower() == "tablet")
                .Select(a => a.AssetTypeItemId)
                .Distinct()
                .ToList();


            var allDesktopIds = requests
               .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
               .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
               .Where(a => a.AssetType?.ToLower() == "desktop")
               .Select(a => a.AssetTypeItemId)
               .Distinct()
               .ToList();

            var allPrinterIds = requests
              .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
              .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
              .Where(a => a.AssetType?.ToLower() == "printer")
              .Select(a => a.AssetTypeItemId)
              .Distinct()
              .ToList();

            var allScanner1Ids = requests
              .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
              .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
              .Where(a => a.AssetType?.ToLower() == "scanner1")
              .Select(a => a.AssetTypeItemId)
              .Distinct()
              .ToList();

            var allScanner2Ids = requests
              .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
              .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
              .Where(a => a.AssetType?.ToLower() == "scanner2")
              .Select(a => a.AssetTypeItemId)
              .Distinct()
              .ToList();


            var allScanner3Ids = requests
             .SelectMany(r => r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
             .SelectMany(i => i.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
             .Where(a => a.AssetType?.ToLower() == "scanner3")
             .Select(a => a.AssetTypeItemId)
             .Distinct()
             .ToList();


            // --- Load lookup tables
            var laptops = await _context.Laptops
                .Where(l => allLaptopIds.Contains(l.Id))
                .ToDictionaryAsync(l => l.Id);

            var mobiles = await _context.Mobiles
                .Where(m => allMobileIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id);

            var tablets = await _context.Tablets
                .Where(t => allTabletIds.Contains(t.Id))
                .ToDictionaryAsync(t => t.Id);

            var desktops = await _context.Desktops
             .Where(d => allDesktopIds.Contains(d.Id))
             .ToDictionaryAsync(d => d.Id);

            var printers = await _context.Printers
        .Where(p => allPrinterIds.Contains(p.Id))
        .ToDictionaryAsync(p => p.Id);

            var scanner1 = await _context.Scanner1
    .Where(s1 => allScanner1Ids.Contains(s1.Id))
    .ToDictionaryAsync(s1 => s1.Id);

            var scanner2 = await _context.Scanner2
   .Where(s2 => allScanner2Ids.Contains(s2.Id))
   .ToDictionaryAsync(s2 => s2.Id);

            var scanner3= await _context.Scanner3
   .Where(s3 => allScanner3Ids.Contains(s3.Id))
   .ToDictionaryAsync(s3 => s3.Id);

            // --- Final DTO Projection (corrected!)
            var result = requests.Select(r => new
            {
                r.Id,
                r.RequestDate,
                r.Status,
                r.Message,
                User = new { r.User.Id, r.User.Name, r.User.Email },
                Location = new { r.Location.Id, r.Location.Name },

                AssetRequestItems = r.AssetRequestItems.Select(i => new
                {
                    i.Id,
                    Asset = new { i.Asset.Id, i.Asset.Name },
                    i.RequestedQuantity,
                    i.ApprovedQuantity,
                    PartialReason = i.PartialReason,

                    // 🔥 All filters included
                    Brand = i.Brand,
                    Processor = i.Processor,
                    Storage = i.Storage,
                    Ram = i.Ram,
                    OperatingSystem = i.OperatingSystem,
                    NetworkType = i.NetworkType,
                    SimType = i.SimType,
                    SimSupport = i.SimSupport,
                    PrinterType = i.PrinterType,
                    PaperSize = i.PaperSize,
                    Dpi = i.Dpi,
                    Scanner1Type = i.Scanner1Type,
                    Scanner1Resolution = i.Scanner1Resolution,
                    Scanner2Type = i.Scanner2Type,
                    Scanner2Resolution = i.Scanner2Resolution,
                    Scanner3Type = i.Scanner3Type,
                    Scanner3Resolution = i.Scanner3Resolution,

                    AssignedAssets = i.AssignedAssets.Select(a =>
                    {
                        object detail = null;
                        var type = a.AssetType?.ToLowerInvariant();

                        if (type == "laptop" && laptops.TryGetValue(a.AssetTypeItemId, out var lap))
                            detail = new
                            {
                                lap.Id,
                                lap.Brand,
                                lap.ModelNumber,
                                lap.AssetTag,
                                lap.PurchaseDate
                            };

                        else if (type == "mobile" && mobiles.TryGetValue(a.AssetTypeItemId, out var mob))
                            detail = new
                            {
                                mob.Id,
                                mob.Brand,
                                mob.Model,
                                mob.IMEINumber,
                                mob.AssetTag,
                                mob.PurchaseDate
                            };

                        else if (type == "tablet" && tablets.TryGetValue(a.AssetTypeItemId, out var tab))
                            detail = new
                            {
                                tab.Id,
                                tab.Brand,
                                tab.Model,
                                tab.AssetTag,
                                tab.PurchaseDate
                            };


                        else if (type == "desktop" && desktops.TryGetValue(a.AssetTypeItemId, out var desk))
                            detail = new
                            {
                                desk.Id,
                                desk.Brand,
                                desk.ModelNumber,
                                desk.AssetTag,
                                desk.PurchaseDate
                            };

                        else if (type == "printer" && printers.TryGetValue(a.AssetTypeItemId, out var prin))
                            detail = new
                            {
                                prin.Id,
                                prin.Brand,
                                prin.Model,
                                prin.AssetTag,
                                prin.PurchaseDate
                            };

                        else if (type == "scanner1" && scanner1.TryGetValue(a.AssetTypeItemId, out var scan1))
                            detail = new
                            {
                                scan1.Id,
                                scan1.Scanner1Brand,
                                scan1.Scanner1Model,
                                scan1.Scanner1AssetTag,
                                scan1.PurchaseDate
                            };

                        else if (type == "scanner2" && scanner2.TryGetValue(a.AssetTypeItemId, out var scan2))
                            detail = new
                            {
                                scan2.Id,
                                scan2.Scanner2Brand,
                                scan2.Scanner2Model,
                                scan2.Scanner2AssetTag,
                                scan2.PurchaseDate
                            };
                        else if (type == "scanner3" && scanner3.TryGetValue(a.AssetTypeItemId, out var scan3))
                            detail = new
                            {
                                scan3.Id,
                                scan3.Scanner3Brand,
                                scan3.Scanner3Model,
                                scan3.Scanner3AssetTag,
                                scan3.PurchaseDate
                            };

                        return new
                        {
                            a.Id,
                            a.AssetType,
                            a.AssetTypeItemId,
                            a.Status,
                            a.AssignedDate,
                            a.ReturnedDate,
                            Detail = detail
                        };
                    })
                })
            });

            return Ok(result);
        }


        // --------------------------
        // 4) CONFIRM APPROVE (ASSIGN ITEMS)
        // --------------------------
       [HttpPost("confirm-approve/{requestId}")]
public async Task<IActionResult> ConfirmApprove(int requestId, [FromBody] ApproveRequestDto dto)
{
    var request = await _context.AssetRequests
        .Include(r => r.User)
        .Include(r => r.Location)
        .Include(r => r.AssetRequestItems)
            .ThenInclude(i => i.Asset)
        .Include(r => r.AssetRequestItems)
            .ThenInclude(i => i.AssignedAssets)
        .FirstOrDefaultAsync(r => r.Id == requestId);

    if (request == null)
        return NotFound("Request not found.");

    using var tx = await _context.Database.BeginTransactionAsync();

    try
    {
        foreach (var assign in dto.Assignments)
        {
            var item = request.AssetRequestItems.FirstOrDefault(i => i.Id == assign.ItemId);
            if (item == null)
                return BadRequest($"Item with id {assign.ItemId} not found in request.");

            // ===============================
            // PARTIAL APPROVAL LOGIC
            // ===============================
            int approvedCount = assign.AssetTypeItemIds?.Count ?? 0;

            if (approvedCount < item.RequestedQuantity)
                item.PartialReason = string.IsNullOrWhiteSpace(assign.PartialReason)
                    ? "Partially approved — less items available"
                    : assign.PartialReason;
            else
                item.PartialReason = null;

            // ===============================
            // RESTORE OLD ASSIGNMENTS
            // ===============================
            var oldAssigned = await _context.AssignedAssets
                .Where(a => a.AssetRequestItemId == item.Id)
                .ToListAsync();

            foreach (var old in oldAssigned)
            {
                if (old.Status != "Assigned") continue;

                var type = old.AssetType?.ToLowerInvariant();

                if (type == "laptop")
                {
                    var lap = await _context.Laptops.FindAsync(old.AssetTypeItemId);
                    if (lap != null)
                    {
                        lap.IsAssigned = false;
                        lap.AssignedDate = null;
                    }
                }
                else if (type == "mobile")
                {
                    var mob = await _context.Mobiles.FindAsync(old.AssetTypeItemId);
                    if (mob != null)
                    {
                        mob.IsAssigned = false;
                        mob.AssignedDate = null;
                    }
                }
                else if (type == "tablet")
                {
                    var tab = await _context.Tablets.FindAsync(old.AssetTypeItemId);
                    if (tab != null)
                    {
                        tab.IsAssigned = false;
                        tab.AssignedDate = null;
                    }
                }
                else if (type == "desktop")
                {
                    var desk = await _context.Desktops.FindAsync(old.AssetTypeItemId);
                    if (desk != null)
                    {
                        desk.IsAssigned = false;
                        desk.AssignedDate = null;
                    }
                }
                else if (type == "printer")
                {
                    var prin = await _context.Printers.FindAsync(old.AssetTypeItemId);
                    if (prin != null)
                    {
                        prin.IsAssigned = false;
                        prin.AssignedDate = null;
                    }
                }
                else if (type == "scanner1")
                {
                    var scan1 = await _context.Scanner1.FindAsync(old.AssetTypeItemId);
                    if (scan1 != null)
                    {
                        scan1.IsAssigned = false;
                        scan1.AssignedDate = null;
                    }
                }
                else if (type == "scanner2")
                {
                    var scan2 = await _context.Scanner2.FindAsync(old.AssetTypeItemId);
                    if (scan2 != null)
                    {
                        scan2.IsAssigned = false;
                        scan2.AssignedDate = null;
                    }
                }
                else if (type == "scanner3")
                {
                    var scan3 = await _context.Scanner3.FindAsync(old.AssetTypeItemId);
                    if (scan3 != null)
                    {
                        scan3.IsAssigned = false;
                        scan3.AssignedDate = null;
                    }
                }
            }

            _context.AssignedAssets.RemoveRange(oldAssigned);
            await _context.SaveChangesAsync();

            // ===============================
            // COMMON HISTORY DATA
            // ===============================
            var userName = request.User?.Name ?? "Unknown User";
            var locationName = request.Location?.Name ?? "Unknown Location";

            // ===============================
            // CREATE NEW ASSIGNMENTS + HISTORY
            // ===============================
            foreach (var assetTypeItemId in assign.AssetTypeItemIds)
            {
                var type = assign.AssetType?.Trim().ToLowerInvariant();

                _context.AssignedAssets.Add(new AssignedAsset
                {
                    AssetRequestItemId = item.Id,
                    AssetType = type,
                    AssetTypeItemId = assetTypeItemId,
                    AssignedDate = DateTime.Now,
                    Status = "Assigned"
                });

                if (type == "laptop")
                {
                    var lap = await _context.Laptops.FindAsync(assetTypeItemId);
                    if (lap != null)
                    {
                        lap.IsAssigned = true;
                        lap.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = lap.AssetTag,
                            Brand = lap.Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else if (type == "mobile")
                {
                    var mob = await _context.Mobiles.FindAsync(assetTypeItemId);
                    if (mob != null)
                    {
                        mob.IsAssigned = true;
                        mob.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = mob.AssetTag,
                            Brand = mob.Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else if (type == "tablet")
                {
                    var tab = await _context.Tablets.FindAsync(assetTypeItemId);
                    if (tab != null)
                    {
                        tab.IsAssigned = true;
                        tab.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = tab.AssetTag,
                            Brand = tab.Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else if (type == "desktop")
                {
                    var desk = await _context.Desktops.FindAsync(assetTypeItemId);
                    if (desk != null)
                    {
                        desk.IsAssigned = true;
                        desk.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = desk.AssetTag,
                            Brand = desk.Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else if (type == "printer")
                {
                    var prin = await _context.Printers.FindAsync(assetTypeItemId);
                    if (prin != null)
                    {
                        prin.IsAssigned = true;
                        prin.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = prin.AssetTag,
                            Brand = prin.Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else if (type == "scanner1")
                {
                    var scan1 = await _context.Scanner1.FindAsync(assetTypeItemId);
                    if (scan1 != null)
                    {
                        scan1.IsAssigned = true;
                        scan1.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = scan1.Scanner1AssetTag,
                            Brand = scan1.Scanner1Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else if (type == "scanner2")
                {
                    var scan2 = await _context.Scanner2.FindAsync(assetTypeItemId);
                    if (scan2 != null)
                    {
                        scan2.IsAssigned = true;
                        scan2.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = scan2.Scanner2AssetTag,
                            Brand = scan2.Scanner2Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else if (type == "scanner3")
                {
                    var scan3 = await _context.Scanner3.FindAsync(assetTypeItemId);
                    if (scan3 != null)
                    {
                        scan3.IsAssigned = true;
                        scan3.AssignedDate = DateTime.Now;

                        _context.AssetHistories.Add(new AssetHistory
                        {
                            AssetTag = scan3.Scanner3AssetTag,
                            Brand = scan3.Scanner3Brand,
                            Location = locationName,
                            RequestedDate = request.RequestDate,
                            RequestedBy = userName,
                            AssignedDate = DateTime.Now,
                            AssignedBy = "Admin",
                            Remarks = "Asset assigned"
                        });
                    }
                }
                else
                {
                    await tx.RollbackAsync();
                    return BadRequest($"Unknown AssetType '{assign.AssetType}'.");
                }
            }

            item.ApprovedQuantity = approvedCount;
        }

        request.Status = "Approved";
        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { message = "Request approved, items assigned & history logged!" });
    }
    catch (Exception ex)
    {
        await tx.RollbackAsync();
        return StatusCode(500, ex.Message);
    }
}



        // DTOs used by ConfirmApprove
        public class ApproveRequestDto
        {
            public List<AssignForItemDto> Assignments { get; set; } = new();
        }

        public class AssignForItemDto
        {
            public int ItemId { get; set; }

            // "laptop" | "mobile" | "tablet"
            public string AssetType { get; set; }

            // list of ids from corresponding table (Laptop.Id or Mobile.Id etc)
            public List<int> AssetTypeItemIds { get; set; } = new();

            // ⭐ NEW: Partial approval reason
            public string? PartialReason { get; set; }
        }

        // --------------------------
        // 4.5) REJECT REQUEST (new)
        // --------------------------
        [HttpPost("reject/{id}")]
        public async Task<IActionResult> RejectRequest(int id)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.AssignedAssets)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            // Optional: only allow rejecting pending
            if (!string.Equals(request.Status, "Pending", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Only pending requests can be rejected.");
            }

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                // Unassign any already assigned items (usually none for pending, but safe)
                foreach (var item in request.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                {
                    foreach (var assigned in item.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                    {
                        var type = assigned.AssetType?.ToLowerInvariant();

                        if (type == "laptop")
                        {
                            var lap = await _context.Laptops.FindAsync(assigned.AssetTypeItemId);
                            if (lap != null)
                            {
                                lap.IsAssigned = false;
                                lap.AssignedDate = null;
                            }
                        }
                        else if (type == "mobile")
                        {
                            var mob = await _context.Mobiles.FindAsync(assigned.AssetTypeItemId);
                            if (mob != null)
                            {
                                mob.IsAssigned = false;
                                mob.AssignedDate = null;
                            }
                        }
                        else if (type == "tablet")
                        {
                            var tab = await _context.Tablets.FindAsync(assigned.AssetTypeItemId);
                            if (tab != null)
                            {
                                tab.IsAssigned = false;
                                tab.AssignedDate = null;
                            }
                        }
                        else if (type == "desktop")
                        {
                            var desk = await _context.Desktops.FindAsync(assigned.AssetTypeItemId);
                            if (desk != null)
                            {
                                desk.IsAssigned = false;
                                desk.AssignedDate = null;
                            }
                        }

                        else if (type == "printer")
                        {
                            var prin = await _context.Printers.FindAsync(assigned.AssetTypeItemId);
                            if (prin != null)
                            {
                                prin.IsAssigned = false;
                                prin.AssignedDate = null;
                            }
                        }

                        else if (type == "scanner1")
                        {
                            var scan1 = await _context.Scanner1.FindAsync(assigned.AssetTypeItemId);
                            if (scan1 != null)
                            {
                                scan1.IsAssigned = false;
                                scan1.AssignedDate = null;
                            }
                        }
                        else if (type == "scanner2")
                        {
                            var scan2 = await _context.Scanner2.FindAsync(assigned.AssetTypeItemId);
                            if (scan2 != null)
                            {
                                scan2.IsAssigned = false;
                                scan2.AssignedDate = null;
                            }
                        }

                        else if (type == "scanner3")
                        {
                            var scan3 = await _context.Scanner3.FindAsync(assigned.AssetTypeItemId);
                            if (scan3 != null)
                            {
                                scan3.IsAssigned = false;
                                scan3.AssignedDate = null;
                            }
                        }
                    }
                }

                // Remove AssignedAssets rows, but keep request & items
                _context.AssignedAssets.RemoveRange(
                    request.AssetRequestItems.SelectMany(i => i.AssignedAssets)
                );

                request.Status = "Rejected";

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Request rejected successfully." });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }

        // --------------------------
        // RETURN ITEM (with damage flow + assetTag fix)
        // --------------------------
        public class ReturnPayload
        {
            public bool IsDamaged { get; set; }
            public string? DamageReason { get; set; }
        }

        [HttpPost("return-item/{assignedId}")]
        public async Task<IActionResult> ReturnItem(int assignedId, [FromBody] ReturnPayload payload)
        {
            using var tx = await _context.Database.BeginTransactionAsync();

            try
            {
                var assigned = await _context.AssignedAssets
                    .Include(a => a.AssetRequestItem)
                        .ThenInclude(i => i.AssetRequest)
                            .ThenInclude(r => r.User)
                    .Include(a => a.AssetRequestItem)
                        .ThenInclude(i => i.AssetRequest)
                            .ThenInclude(r => r.Location)
                    .FirstOrDefaultAsync(a => a.Id == assignedId);

                if (assigned == null)
                    return NotFound("Assigned asset not found.");

                if (assigned.Status == "Returned")
                    return BadRequest("Item already returned.");

                assigned.Status = "Returned";
                assigned.ReturnedDate = DateTime.Now;

                var type = assigned.AssetType?.ToLowerInvariant();
                string assetTag = null;
                string brand = null;

                // ===============================
                // RESTORE STOCK
                // ===============================
                if (type == "laptop")
                {
                    var lap = await _context.Laptops.FindAsync(assigned.AssetTypeItemId);
                    if (lap != null)
                    {
                        assetTag = lap.AssetTag;
                        brand = lap.Brand;
                        lap.IsAssigned = false;
                        lap.AssignedDate = null;
                        if (payload.IsDamaged) lap.Remarks = "Yes";
                    }
                }
                else if (type == "mobile")
                {
                    var mob = await _context.Mobiles.FindAsync(assigned.AssetTypeItemId);
                    if (mob != null)
                    {
                        assetTag = mob.AssetTag;
                        brand = mob.Brand;
                        mob.IsAssigned = false;
                        mob.AssignedDate = null;
                        if (payload.IsDamaged) mob.Remarks = "Yes";
                    }
                }
                else if (type == "tablet")
                {
                    var tab = await _context.Tablets.FindAsync(assigned.AssetTypeItemId);
                    if (tab != null)
                    {
                        assetTag = tab.AssetTag;
                        brand = tab.Brand;
                        tab.IsAssigned = false;
                        tab.AssignedDate = null;
                        if (payload.IsDamaged) tab.Remarks = "Yes";
                    }
                }
                else if (type == "desktop")
                {
                    var desk = await _context.Desktops.FindAsync(assigned.AssetTypeItemId);
                    if (desk != null)
                    {
                        assetTag = desk.AssetTag;
                        brand = desk.Brand;
                        desk.IsAssigned = false;
                        desk.AssignedDate = null;
                        if (payload.IsDamaged) desk.Remarks = "Yes";
                    }
                }
                else if (type == "printer")
                {
                    var prin = await _context.Printers.FindAsync(assigned.AssetTypeItemId);
                    if (prin != null)
                    {
                        assetTag = prin.AssetTag;
                        brand = prin.Brand;
                        prin.IsAssigned = false;
                        prin.AssignedDate = null;
                        if (payload.IsDamaged) prin.Remarks = "Yes";
                    }
                }
                else if (type == "scanner1")
                {
                    var scan1 = await _context.Scanner1.FindAsync(assigned.AssetTypeItemId);
                    if (scan1 != null)
                    {
                        assetTag = scan1.Scanner1AssetTag;
                        brand = scan1.Scanner1Brand;
                        scan1.IsAssigned = false;
                        scan1.AssignedDate = null;
                        if (payload.IsDamaged) scan1.Remarks = "Yes";
                    }
                }
                else if (type == "scanner2")
                {
                    var scan2 = await _context.Scanner2.FindAsync(assigned.AssetTypeItemId);
                    if (scan2 != null)
                    {
                        assetTag = scan2.Scanner2AssetTag;
                        brand = scan2.Scanner2Brand;
                        scan2.IsAssigned = false;
                        scan2.AssignedDate = null;
                        if (payload.IsDamaged) scan2.Remarks = "Yes";
                    }
                }
                else if (type == "scanner3")
                {
                    var scan3 = await _context.Scanner3.FindAsync(assigned.AssetTypeItemId);
                    if (scan3 != null)
                    {
                        assetTag = scan3.Scanner3AssetTag;
                        brand = scan3.Scanner3Brand;
                        scan3.IsAssigned = false;
                        scan3.AssignedDate = null;
                        if (payload.IsDamaged) scan3.Remarks = "Yes";
                    }
                }

                if (string.IsNullOrWhiteSpace(assetTag))
                    return BadRequest("Unable to resolve AssetTag for return.");

                // 🔍 Find existing assignment history
                var history = await _context.AssetHistories
                    .Where(h => h.AssetTag == assetTag && h.ReturnDate == null)
                    .OrderByDescending(h => h.AssignedDate)
                    .FirstOrDefaultAsync();

                if (history == null)
                {
                    return BadRequest("Assignment history not found for this asset.");
                }

                // ✅ UPDATE SAME RECORD
                history.ReturnDate = DateTime.Now;
                history.Remarks = payload.IsDamaged
                    ? $"Returned (Damaged): {payload.DamageReason}"
                    : "Returned successfully";


                // ===============================
                // DAMAGED TABLE
                // ===============================
                if (payload.IsDamaged)
                {
                    if (string.IsNullOrWhiteSpace(payload.DamageReason))
                        return BadRequest("Damage reason is required.");

                    _context.DamagedAssets.Add(new DamagedAsset
                    {
                        AssetType = assigned.AssetType,
                        AssetTypeItemId = assigned.AssetTypeItemId,
                        AssetTag = assetTag,
                        Reason = payload.DamageReason,
                        ReportedAt = DateTime.Now
                    });
                }

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Item returned successfully & history logged." });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }




        // --------------------------
        // 5) DELETE REQUEST
        // --------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id, [FromBody] DeleteRequest req)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .Include(r => r.AssetRequestItems)
                    .ThenInclude(i => i.AssignedAssets)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                // =====================================================
                // 1) LOG ADMIN DELETE HISTORY  (MATCHING TABLET STYLE)
                // =====================================================
                var history = new AdminDeleteHistory
                {
                    DeletedItemName = $"Request #{request.Id}",
                    ItemType = "AssetRequest",
                    AdminName = req?.AdminName ?? "Unknown Admin",
                    Reason = req?.Reason ?? "No reason provided",
                    DeletedAt = DateTime.Now
                };

                _context.AdminDeleteHistories.Add(history);


                // =====================================================
                // 2) RESTORE STOCK (YOUR ORIGINAL LOGIC)
                // =====================================================
                foreach (var item in request.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                {
                    foreach (var assigned in item.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                    {
                        var type = assigned.AssetType?.ToLowerInvariant();

                        if (type == "laptop")
                        {
                            var lap = await _context.Laptops.FindAsync(assigned.AssetTypeItemId);
                            if (lap != null && lap.IsAssigned == true)
                            {
                                lap.IsAssigned = false;
                                lap.AssignedDate = null;
                            }
                        }
                        else if (type == "mobile")
                        {
                            var mob = await _context.Mobiles.FindAsync(assigned.AssetTypeItemId);
                            if (mob != null && mob.IsAssigned == true)
                            {
                                mob.IsAssigned = false;
                                mob.AssignedDate = null;
                            }
                        }
                        else if (type == "tablet")
                        {
                            var tab = await _context.Tablets.FindAsync(assigned.AssetTypeItemId);
                            if (tab != null && tab.IsAssigned == true)
                            {
                                tab.IsAssigned = false;
                                tab.AssignedDate = null;
                            }
                        }

                        else if (type == "desktop")
                        {
                            var desk = await _context.Desktops.FindAsync(assigned.AssetTypeItemId);
                            if (desk != null && desk.IsAssigned == true)
                            {
                                desk.IsAssigned = false;
                                desk.AssignedDate = null;
                            }
                        }

                        else if (type == "printer")
                        {
                            var prin = await _context.Printers.FindAsync(assigned.AssetTypeItemId);
                            if (prin != null && prin.IsAssigned == true)
                            {
                                prin.IsAssigned = false;
                                prin.AssignedDate = null;
                            }
                        }

                        else if (type == "scanner1")
                        {
                            var scan1 = await _context.Scanner1.FindAsync(assigned.AssetTypeItemId);
                            if (scan1 != null && scan1.IsAssigned == true)
                            {
                                scan1.IsAssigned = false;
                                scan1.AssignedDate = null;
                            }
                        }

                        else if (type == "scanner2")
                        {
                            var scan2 = await _context.Scanner2.FindAsync(assigned.AssetTypeItemId);
                            if (scan2 != null && scan2.IsAssigned == true)
                            {
                                scan2.IsAssigned = false;
                                scan2.AssignedDate = null;
                            }
                        }
                        else if (type == "scanner3")
                        {
                            var scan3 = await _context.Scanner3.FindAsync(assigned.AssetTypeItemId);
                            if (scan3 != null && scan3.IsAssigned == true)
                            {
                                scan3.IsAssigned = false;
                                scan3.AssignedDate = null;
                            }
                        }
                    }
                }

                // =====================================================
                // 3) DELETE REQUEST + ITEMS (YOUR ORIGINAL CODE)
                // =====================================================
                _context.AssignedAssets.RemoveRange(
                    request.AssetRequestItems.SelectMany(i => i.AssignedAssets)
                );

                _context.AssetRequestItems.RemoveRange(request.AssetRequestItems);
                _context.AssetRequests.Remove(request);

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Request deleted successfully." });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, ex.Message);
            }
        }


        [HttpDelete("user-delete/{id}")]
        public async Task<IActionResult> DeleteRequestByUser(int id, [FromBody] DeleteRequest req)
        {
            var request = await _context.AssetRequests
                .Include(r => r.AssetRequestItems)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound("Request not found.");

            // lookup username from user table
            var user = await _context.Users.FindAsync(request.UserId);

            var entry = new UserDeleteHistory
            {
                DeletedItemName = $"Request #{request.Id}",
                ItemType = "AssetRequest",
                UserName = user?.Name ?? "Unknown User",
                DeletedAt = DateTime.Now
            };

            _context.UserDeleteHistories.Add(entry);

            _context.AssetRequestItems.RemoveRange(request.AssetRequestItems);
            _context.AssetRequests.Remove(request);

            await _context.SaveChangesAsync();

            return Ok(new { message = "User request deleted successfully." });
        }



        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var r = await _context.AssetRequests
                .Include(x => x.AssetRequestItems)
                    .ThenInclude(i => i.Asset)
                .Include(x => x.Location)
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (r == null)
                return NotFound("Request not found.");

            return Ok(new
            {
                r.Id,
                r.RequestDate,
                r.Status,
                r.Message,
                PhoneNumber = r.User.PhoneNumber,
                Location = new { r.Location.Id, r.Location.Name },
                AssetRequestItems = r.AssetRequestItems.Select(i => new
                {
                    i.Id,
                    RequestedQuantity = i.RequestedQuantity,
                    Asset = new { i.Asset.Id, i.Asset.Name },

                    // Laptops / Mobiles / Tablets
                    Brand = i.Brand,
                    Processor = i.Processor,
                    Storage = i.Storage,
                    Ram = i.Ram,
                    OperatingSystem = i.OperatingSystem,
                    NetworkType = i.NetworkType,
                    SimType = i.SimType,
                    SimSupport = i.SimSupport,


                    // Printers
                    PrinterType = i.PrinterType,
                    PaperSize = i.PaperSize,
                    Dpi = i.Dpi,

                    //Sscanner1
                    Scanner1Type=i.Scanner1Type,
                    Scanner1Resolution=i.Scanner1Resolution,

                    //Sscanner2
                    Scanner2Type = i.Scanner2Type,
                    Scanner2Resolution = i.Scanner2Resolution,

                    //Sscanner3
                    Scanner3Type = i.Scanner3Type,
                    Scanner3Resolution = i.Scanner3Resolution,

                })

            });
        }
    }
}