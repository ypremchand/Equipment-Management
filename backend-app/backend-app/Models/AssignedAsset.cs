namespace backend_app.Models
{
    public class AssignedAsset
    {
        public int Id { get; set; }

        public int AssetRequestItemId { get; set; }
        public AssetRequestItem AssetRequestItem { get; set; }

        public int LaptopId { get; set; }
        public Laptop Laptop { get; set; }

        public DateTime AssignedDate { get; set; } = DateTime.Now;
        public DateTime? ReturnedDate { get; set; }

        public string Status { get; set; } = "Assigned"; // Assigned / Returned
    }
}
