using backend_app.Data;
using backend_app.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetsController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // NORMALIZE ASSET TYPE
        // ============================================================
        private static string NormalizeType(string? name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";

            var n = name.Trim().ToLowerInvariant();

            if (n.Contains("laptop")) return "laptop";
            if (n.Contains("mobile")) return "mobile";
            if (n.Contains("tablet")) return "tablet";
            if (n.Contains("desktop")) return "desktop";
            if (n.Contains("printer")) return "printer";
            if (n.Contains("scanner1")) return "scanner1";
            if (n.Contains("scanner2")) return "scanner2";
            if (n.Contains("scanner3")) return "scanner3";
            if (n.Contains("barcode")) return "barcode";

            return "";
        }

        // ============================================================
        // 🔥 CENTRALIZED QUANTITY CALCULATION (INSIDE CONTROLLER)
        // ============================================================
        private async Task RecalculateAssetQuantityAsync(int assetId)
        {
            var asset = await _context.Assets.FindAsync(assetId);
            if (asset == null) return;

            var type = NormalizeType(asset.Name);

            int total = 0;
            int assigned = 0;

            if (type == "laptop")
            {
                total = await _context.Laptops.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Laptops.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "mobile")
            {
                total = await _context.Mobiles.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Mobiles.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "tablet")
            {
                total = await _context.Tablets.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Tablets.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "desktop")
            {
                total = await _context.Desktops.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Desktops.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "printer")
            {
                total = await _context.Printers.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Printers.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "scanner1")
            {
                total = await _context.Scanner1.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Scanner1.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "scanner2")
            {
                total = await _context.Scanner2.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Scanner2.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "scanner3")
            {
                total = await _context.Scanner3.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Scanner3.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }
            else if (type == "barcode")
            {
                total = await _context.Barcodes.CountAsync(x => x.AssetId == assetId);
                assigned = await _context.Barcodes.CountAsync(x => x.AssetId == assetId && x.IsAssigned);
            }

            asset.Quantity = Math.Max(0, total - assigned);
        }

        // ============================================================
        // GET ALL ASSETS (ALWAYS SYNC DB BEFORE RETURN)
        // ============================================================
        [HttpGet]
        public async Task<IActionResult> GetAssets()
        {
            var assets = await _context.Assets.ToListAsync();

            foreach (var asset in assets)
            {
                await RecalculateAssetQuantityAsync(asset.Id);
            }

            await _context.SaveChangesAsync();

            return Ok(assets.Select(a => new
            {
                id = a.Id,
                name = a.Name,
                preCode = a.PreCode,
                quantity = a.Quantity
            }));
        }

        // ============================================================
        // GET SINGLE ASSET
        // ============================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAsset(int id)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            await RecalculateAssetQuantityAsync(id);
            await _context.SaveChangesAsync();

            return Ok(asset);
        }

        // ============================================================
        // CREATE ASSET
        // ============================================================
      
        [HttpPost]
        public async Task<IActionResult> CreateAsset([FromBody] Asset asset)
        {
            if (string.IsNullOrWhiteSpace(asset.Name))
                return BadRequest(new { message = "Asset name is required." });

            asset.PreCode = string.IsNullOrWhiteSpace(asset.PreCode)
                ? GeneratePreCode(asset.Name)
                : asset.PreCode.Trim().ToUpper();

            asset.Quantity = 0;

            // 🔥 FIND EXISTING ASSET WITH SAME PRECODE
            var existingAsset = await _context.Assets
                .FirstOrDefaultAsync(a => a.PreCode == asset.PreCode);

            if (existingAsset != null)
            {
                return Conflict(new
                {
                    message = $"Code '{asset.PreCode}' already exists for '{existingAsset.Name}'."
                });
            }

            _context.Assets.Add(asset);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
        }







        // ============================================================
        // UPDATE ASSET (NAME / PRECODE ONLY)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsset(int id, [FromBody] Asset updatedAsset)
        {
            if (id != updatedAsset.Id)
                return BadRequest(new { message = "ID mismatch." });

            var existing = await _context.Assets.FindAsync(id);
            if (existing == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(updatedAsset.Name))
                return BadRequest(new { message = "Asset name is required." });

            var finalPreCode = string.IsNullOrWhiteSpace(updatedAsset.PreCode)
                ? GeneratePreCode(updatedAsset.Name)
                : updatedAsset.PreCode.Trim().ToUpper();

            // 🔥 FIXED DUPLICATE CHECK
            var existingAssetWithSameCode = await _context.Assets
                .FirstOrDefaultAsync(a => a.PreCode == finalPreCode && a.Id != id);

            if (existingAssetWithSameCode != null)
            {
                return Conflict(new
                {
                    message = $"Code '{finalPreCode}' already exists for '{existingAssetWithSameCode.Name}'."
                });
            }

            existing.Name = updatedAsset.Name;
            existing.PreCode = finalPreCode;

            await _context.SaveChangesAsync();
            return NoContent();
        }





        // ============================================================
        // DELETE ASSET (BLOCK IF ITEMS EXIST)
        // ============================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsset(int id, [FromBody] DeleteRequest req)
        {
            var asset = await _context.Assets.FindAsync(id);
            if (asset == null)
                return NotFound();

            var type = NormalizeType(asset.Name);
            bool inUse = false;

            if (type == "laptop") inUse = await _context.Laptops.AnyAsync(x => x.AssetId == id);
            else if (type == "mobile") inUse = await _context.Mobiles.AnyAsync(x => x.AssetId == id);
            else if (type == "tablet") inUse = await _context.Tablets.AnyAsync(x => x.AssetId == id);
            else if (type == "desktop") inUse = await _context.Desktops.AnyAsync(x => x.AssetId == id);
            else if (type == "printer") inUse = await _context.Printers.AnyAsync(x => x.AssetId == id);
            else if (type == "scanner1") inUse = await _context.Scanner1.AnyAsync(x => x.AssetId == id);
            else if (type == "scanner2") inUse = await _context.Scanner2.AnyAsync(x => x.AssetId == id);
            else if (type == "scanner3") inUse = await _context.Scanner3.AnyAsync(x => x.AssetId == id);
            else if (type == "barcode") inUse = await _context.Barcodes.AnyAsync(x => x.AssetId == id);

            if (inUse)
                return BadRequest("Cannot delete asset. Items exist under this asset.");

            _context.AdminDeleteHistories.Add(new AdminDeleteHistory
            {
                DeletedItemName = asset.Name,
                ItemType = "Asset",
                AdminName = req?.AdminName ?? "Unknown Admin",
                DeletedAt = DateTime.Now,
                Reason = req?.Reason ?? "No reason provided"
            });

            _context.Assets.Remove(asset);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static string GeneratePreCode(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";

            var words = name
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries);

            if (words.Length == 1)
                return words[0].Substring(0, Math.Min(3, words[0].Length)).ToUpper();

            if (words.Length == 2)
                return (words[0].Substring(0, 2) + words[1][0]).ToUpper();

            return string.Concat(words.Take(3).Select(w => w[0])).ToUpper();
        }

    }
}
