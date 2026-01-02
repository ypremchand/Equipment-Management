namespace backend_app.Models
{
    public class PurchaseOrder
    {
        public int Id { get; set; }

        public int AssetId { get; set; }
        public string AssetName { get; set; } = string.Empty;
        public string PreCode { get; set; } = string.Empty;

        public int Quantity { get; set; }
        public DateTime PurchaseDate { get; set; }
        public string? DocumentFileName { get; set; }
        public string? DocumentPath { get; set; }

        public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    }

}
