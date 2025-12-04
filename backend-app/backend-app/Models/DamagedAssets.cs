namespace backend_app.Models
{
    public class DamagedAsset
    {
        public int Id { get; set; }

        public string AssetType { get; set; } = "Laptop"; // Not nullable

        public int AssetTypeItemId { get; set; }  // e.g. laptop id

        public string AssetTag { get; set; } = string.Empty;

        public string Reason { get; set; } = string.Empty;

        public DateTime ReportedAt { get; set; } = DateTime.Now;
    }
}
