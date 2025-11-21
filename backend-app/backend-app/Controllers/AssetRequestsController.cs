using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

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
        // Helper: Load assigned item details in bulk
        // --------------------------
        private async Task AttachAssignedItemDetailsAsync(List<AssetRequest> requests)
        {
            // collect ids by type
            var laptopIds = new HashSet<int>();
            var mobileIds = new HashSet<int>();
            var tabletIds = new HashSet<int>();

            foreach (var r in requests)
            {
                foreach (var item in r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                {
                    foreach (var a in item.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                    {
                        if (string.IsNullOrWhiteSpace(a.AssetType)) continue;
                        var t = a.AssetType.Trim().ToLowerInvariant();
                        if (t == "laptop") laptopIds.Add(a.AssetTypeItemId);
                        else if (t == "mobile") mobileIds.Add(a.AssetTypeItemId);
                        else if (t == "tablet") tabletIds.Add(a.AssetTypeItemId);
                    }
                }
            }

            // load in batches
            var laptops = await _context.Laptops
                .Where(x => laptopIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id);

            var mobiles = await _context.Mobiles
                .Where(x => mobileIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id);

            var tablets = await _context.Tablets
                .Where(x => tabletIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id);

            // attach objects to AssignedAsset wrapper property (we will use a lightweight dynamic holder)
            // since your AssignedAsset model doesn't have navigation to Laptop/Mobile/Tablet,
            // we will use a dictionary in-memory to map details to the assigned instance using an expando-like approach:
            foreach (var r in requests)
            {
                foreach (var item in r.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                {
                    foreach (var a in item.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                    {
                        a.AssetType = a.AssetType?.Trim().ToLowerInvariant();

                        if (a.AssetType == "laptop" && laptops.TryGetValue(a.AssetTypeItemId, out var lap))
                        {
                            // embed minimal detail into the Remarks field (or create a DTO in future)
                            // For now: set Status or Remarks? We can't change model shape; better return raw objects from controller actions.
                            // So we leave the model intact and controllers that return data will project DTOs (see GetAll / GetRequestsByEmail).
                        }
                        // similarly for mobile/tablet - all data is already loaded in dictionaries above for projection usage
                    }
                }
            }

            // Note: this helper just loads data into local variables for the controller method to use in projection.
            // See GetAll and GetRequestsByEmail for actual projection that returns combined details.
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

            var laptops = await _context.Laptops.Where(l => allLaptopIds.Contains(l.Id)).ToDictionaryAsync(l => l.Id);
            var mobiles = await _context.Mobiles.Where(m => allMobileIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id);
            var tablets = await _context.Tablets.Where(t => allTabletIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id);

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
                    AssignedAssets = i.AssignedAssets.Select(a =>
                    {
                        object detail = null;
                        var type = a.AssetType?.ToLowerInvariant();
                        if (type == "laptop" && laptops.TryGetValue(a.AssetTypeItemId, out var lap)) detail = new
                        {
                            lap.Id,
                            lap.Brand,
                            lap.ModelNumber,
                            lap.AssetTag,
                            lap.PurchaseDate
                        };
                        else if (type == "mobile" && mobiles.TryGetValue(a.AssetTypeItemId, out var mob)) detail = new
                        {
                            mob.Id,
                            mob.Brand,
                            mob.Model,
                            mob.IMEINumber,
                            mob.AssetTag,
                            mob.PurchaseDate
                        };
                        else if (type == "tablet" && tablets.TryGetValue(a.AssetTypeItemId, out var tab)) detail = new
                        {
                            tab.Id,
                            tab.Brand,
                            tab.Model,
                            tab.AssetTag,
                            tab.PurchaseDate
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

            // same projection pattern as GetAll to attach details
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

            var laptops = await _context.Laptops.Where(l => allLaptopIds.Contains(l.Id)).ToDictionaryAsync(l => l.Id);
            var mobiles = await _context.Mobiles.Where(m => allMobileIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id);
            var tablets = await _context.Tablets.Where(t => allTabletIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id);

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
                    AssignedAssets = i.AssignedAssets.Select(a =>
                    {
                        object detail = null;
                        var type = a.AssetType?.ToLowerInvariant();
                        if (type == "laptop" && laptops.TryGetValue(a.AssetTypeItemId, out var lap)) detail = new
                        {
                            lap.Id,
                            lap.Brand,
                            lap.ModelNumber,
                            lap.AssetTag,
                            lap.PurchaseDate
                        };
                        else if (type == "mobile" && mobiles.TryGetValue(a.AssetTypeItemId, out var mob)) detail = new
                        {
                            mob.Id,
                            mob.Brand,
                            mob.Model,
                            mob.IMEINumber,
                            mob.AssetTag,
                            mob.PurchaseDate
                        };
                        else if (type == "tablet" && tablets.TryGetValue(a.AssetTypeItemId, out var tab)) detail = new
                        {
                            tab.Id,
                            tab.Brand,
                            tab.Model,
                            tab.AssetTag,
                            tab.PurchaseDate
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
        // Expecting DTO: { Assignments: [ { ItemId, AssetType, AssetTypeItemIds: [int] } ] }
        // --------------------------
        [HttpPost("confirm-approve/{requestId}")]
        public async Task<IActionResult> ConfirmApprove(int requestId, [FromBody] ApproveRequestDto dto)
        {
            var request = await _context.AssetRequests
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

                    // Remove old assignments and restore stock for those
                    var oldAssigned = await _context.AssignedAssets
                        .Where(a => a.AssetRequestItemId == item.Id)
                        .ToListAsync();

                    // Restore stock for each old assignment by finding the target item's AssetId
                    foreach (var old in oldAssigned)
                    {
                        // ❗ Only restore if it was still assigned
                        if (old.Status != "Assigned")
                            continue;

                        var t = old.AssetType?.ToLowerInvariant();

                        if (t == "laptop")
                        {
                            var lap = await _context.Laptops.FindAsync(old.AssetTypeItemId);
                            if (lap?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(lap.AssetId.Value);
                                if (asset != null)
                                    asset.Quantity += 1;
                            }
                        }
                        else if (t == "mobile")
                        {
                            var mob = await _context.Mobiles.FindAsync(old.AssetTypeItemId);
                            if (mob?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(mob.AssetId.Value);
                                if (asset != null)
                                    asset.Quantity += 1;
                            }
                        }
                        else if (t == "tablet")
                        {
                            var tab = await _context.Tablets.FindAsync(old.AssetTypeItemId);
                            if (tab?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(tab.AssetId.Value);
                                if (asset != null)
                                    asset.Quantity += 1;
                            }
                        }
                    }


                    _context.AssignedAssets.RemoveRange(oldAssigned);
                    await _context.SaveChangesAsync();

                    // Create new assignments
                    foreach (var assetTypeItemId in assign.AssetTypeItemIds)
                    {
                        var type = assign.AssetType?.Trim().ToLowerInvariant();
                        var assigned = new AssignedAsset
                        {
                            AssetRequestItemId = item.Id,
                            AssetType = type,
                            AssetTypeItemId = assetTypeItemId,
                            AssignedDate = DateTime.Now,
                            Status = "Assigned"
                        };

                        _context.AssignedAssets.Add(assigned);

                        // Reduce stock on related Asset (via the concrete table's AssetId)
                        if (type == "laptop")
                        {
                            var lap = await _context.Laptops.FindAsync(assetTypeItemId);
                            if (lap?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(lap.AssetId.Value);
                                if (asset != null) asset.Quantity = Math.Max(0, asset.Quantity - 1);
                            }
                        }
                        else if (type == "mobile")
                        {
                            var mob = await _context.Mobiles.FindAsync(assetTypeItemId);
                            if (mob?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(mob.AssetId.Value);
                                if (asset != null) asset.Quantity = Math.Max(0, asset.Quantity - 1);
                            }
                        }
                        else if (type == "tablet")
                        {
                            var tab = await _context.Tablets.FindAsync(assetTypeItemId);
                            if (tab?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(tab.AssetId.Value);
                                if (asset != null) asset.Quantity = Math.Max(0, asset.Quantity - 1);
                            }
                        }
                        else
                        {
                            // Unknown type - skip or return error
                            await tx.RollbackAsync();
                            return BadRequest($"Unknown AssetType '{assign.AssetType}' provided for assignment.");
                        }
                    }

                    item.ApprovedQuantity = assign.AssetTypeItemIds?.Count ?? 0;
                }

                request.Status = "Approved";
                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return Ok(new { message = "Request approved & items assigned!" });
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
        }

        // --------------------------
        // 5) DELETE REQUEST
        // --------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
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
                // Restore stock for each assigned asset using the concrete item's AssetId
                foreach (var item in request.AssetRequestItems ?? Enumerable.Empty<AssetRequestItem>())
                {
                    foreach (var assigned in item.AssignedAssets ?? Enumerable.Empty<AssignedAsset>())
                    {
                        var t = assigned.AssetType?.ToLowerInvariant();

                        if (t == "laptop")
                        {
                            var lap = await _context.Laptops.FindAsync(assigned.AssetTypeItemId);
                            if (lap?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(lap.AssetId.Value);
                                if (asset != null) asset.Quantity += 1;
                            }
                        }
                        else if (t == "mobile")
                        {
                            var mob = await _context.Mobiles.FindAsync(assigned.AssetTypeItemId);
                            if (mob?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(mob.AssetId.Value);
                                if (asset != null) asset.Quantity += 1;
                            }
                        }
                        else if (t == "tablet")
                        {
                            var tab = await _context.Tablets.FindAsync(assigned.AssetTypeItemId);
                            if (tab?.AssetId != null)
                            {
                                var asset = await _context.Assets.FindAsync(tab.AssetId.Value);
                                if (asset != null) asset.Quantity += 1;
                            }
                        }
                    }

                    
                }


                // Delete assigned assets, items and the request
                _context.AssignedAssets.RemoveRange(request.AssetRequestItems.SelectMany(i => i.AssignedAssets));
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
                    Asset = new { i.Asset.Id, i.Asset.Name }
                })
            });
        }

    }
}
