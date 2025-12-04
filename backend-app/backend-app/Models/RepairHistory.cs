namespace backend_app.Models
{
    public class RepairHistory
    {
        public int Id { get; set; }
        public string AssetType { get; set; }
        public string AssetTag { get; set; }
        public DateTime RepairedAt { get; set; }
        public string Remarks { get; set; }
    }
}
