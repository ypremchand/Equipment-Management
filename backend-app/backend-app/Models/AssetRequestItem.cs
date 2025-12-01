using backend_app.Models;
using System.ComponentModel.DataAnnotations;

public class AssetRequestItem
{
    [Key]
    public int Id { get; set; }

    public int AssetRequestId { get; set; }
    public AssetRequest AssetRequest { get; set; }

    public int AssetId { get; set; }
    public Asset Asset { get; set; }

    [Required]
    public int RequestedQuantity { get; set; }
    public int? ApprovedQuantity { get; set; }

    // ========================
    // NEW: Optional Specifications
    // ========================
    public string? Brand { get; set; }
    public string? Processor { get; set; }
    public string? Storage { get; set; }
    public string? Ram { get; set; }
    public string? OperatingSystem { get; set; }
    public string? NetworkType { get; set; }
    public string? SimType { get; set; }
    public string? SimSupport { get; set; }

    public string? ScannerType { get; set; }
    public string? ScanSpeed { get; set; }

    public string? PrinterType { get; set; }
    public string? PaperSize { get; set; }
    public string? Dpi { get; set; }

    public ICollection<AssignedAsset> AssignedAssets { get; set; } = new List<AssignedAsset>();
}
