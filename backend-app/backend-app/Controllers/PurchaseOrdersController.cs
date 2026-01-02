using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/purchaseorders")]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseOrdersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] PurchaseOrderDto dto)
        {
            if (dto == null || dto.AssetTags.Count == 0)
                return BadRequest("Invalid purchase order data");

            var purchaseOrder = new PurchaseOrder
            {
                AssetId = dto.AssetId,
                AssetName = dto.AssetName,
                PreCode = dto.PreCode,
                Quantity = dto.Quantity,
                PurchaseDate = DateTime.Now
            };

            foreach (var tag in dto.AssetTags)
            {
                purchaseOrder.Items.Add(new PurchaseOrderItem
                {
                    AssetId = dto.AssetId,
                    AssetTag = tag
                });
            }

            _context.PurchaseOrders.Add(purchaseOrder);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Purchase Order saved successfully",
                purchaseOrderId = purchaseOrder.Id
            });
        }
        [HttpGet]
        public IActionResult GetPurchaseOrders()
        {
            var data = _context.PurchaseOrders
                .Select(po => new
                {
                    po.Id,
                    po.AssetId,
                    po.AssetName,
                    po.PreCode,
                    po.Quantity,
                    po.PurchaseDate,
                    po.DocumentFileName, 
                    po.DocumentPath,
                    AssetTags = po.Items.Select(i => i.AssetTag).ToList()
                })
                //.OrderByDescending(po => po.Id)
                .ToList();

            return Ok(data);
        }

        [HttpGet("next-sequence")]
        public IActionResult GetNextSequence(
    int assetId,
    string preCode
)
        {
            var tags = _context.PurchaseOrderItems
                .Where(i => i.AssetId == assetId && i.AssetTag.StartsWith(preCode))
                .Select(i => i.AssetTag)
                .ToList();

            int lastNumber = 60000;

            foreach (var tag in tags)
            {
                var parts = tag.Split('-');
                if (int.TryParse(parts.Last(), out int num))
                {
                    if (num > lastNumber)
                        lastNumber = num;
                }
            }

            return Ok(new { nextNumber = lastNumber + 1 });
        }

        [HttpPost("upload/{purchaseOrderId}")]
        public async Task<IActionResult> UploadFile(int purchaseOrderId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var po = await _context.PurchaseOrders.FindAsync(purchaseOrderId);
            if (po == null)
                return NotFound("Purchase order not found");

            var uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "wwwroot",
                "Files",
                "PurchaseOrderFiles"
            );

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // 🔁 OPTIONAL: delete old file
            if (!string.IsNullOrEmpty(po.DocumentPath))
            {
                var oldPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    po.DocumentPath.TrimStart('/')
                );

                if (System.IO.File.Exists(oldPath))
                    System.IO.File.Delete(oldPath);
            }

            var fileName = $"{purchaseOrderId}_{DateTime.Now.Ticks}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            po.DocumentFileName = file.FileName;
            po.DocumentPath = $"/Files/PurchaseOrderFiles/{fileName}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "File uploaded successfully",
                po.DocumentFileName,
                po.DocumentPath
            });
        }


    }
    public class PurchaseOrderDto
    {
        public int AssetId { get; set; }
        public string AssetName { get; set; }
        public string PreCode { get; set; }
        public int Quantity { get; set; }
        public List<string> AssetTags { get; set; } = new();
    }


}
