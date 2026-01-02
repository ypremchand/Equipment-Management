using System.ComponentModel.DataAnnotations;

public class AssetHistory
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]   // 🔥 THIS FIXES IT
    public string AssetType { get; set; } = null!;

    [Required]
    [StringLength(100)]
    public string AssetTag { get; set; } = null!;

    public int AssetItemId { get; set; }

    [StringLength(100)]
    public string? Brand { get; set; }

    [StringLength(100)]
    public string? Location { get; set; }

    public DateTime? RequestedDate { get; set; }
    public string? RequestedBy { get; set; }

    public DateTime? AssignedDate { get; set; }
    public string? AssignedBy { get; set; }

    public DateTime? ReturnDate { get; set; }

    [StringLength(255)]
    public string? Remarks { get; set; }
}
