namespace backend_app.Models
{
    public class PurchaseOrderItem
    {
        public int Id { get; set; }

        public int PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; }

        public int AssetId { get; set; }
        public string AssetTag { get; set; } = string.Empty;
    }

}
