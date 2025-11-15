using backend_app.Models;

public class AssignedAsset
{
    public int Id { get; set; }

    public int AssetRequestItemId { get; set; }
    public AssetRequestItem AssetRequestItem { get; set; }

    public string AssetType { get; set; }

    public int AssetTypeItemId { get; set; }

    public string Status { get; set; } = "Assigned";

    public DateTime AssignedDate { get; set; } = DateTime.Now;

    // ✅ Add this
    public DateTime? ReturnedDate { get; set; }
}
