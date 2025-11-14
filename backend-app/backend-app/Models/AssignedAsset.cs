using backend_app.Models;

public class AssignedAsset
{
    public int Id { get; set; }

    public int AssetRequestItemId { get; set; }
    public AssetRequestItem AssetRequestItem { get; set; }

    // The asset type table: "laptop", "mobile", "tablet", "scanner"
    public string AssetType { get; set; }

    // ID from corresponding table (Laptop.Id or Mobile.Id etc)
    public int AssetTypeItemId { get; set; }

    public string Status { get; set; } = "Assigned";
    public DateTime AssignedDate { get; set; } = DateTime.Now;
}
