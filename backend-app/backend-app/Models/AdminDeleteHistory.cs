namespace backend_app.Models
{
    public class AdminDeleteHistory
    {
        public int Id { get; set; }
        public string DeletedItemName { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty; // e.g. Asset, Location, Laptop
        public string AdminName { get; set; } = string.Empty;
        public DateTime DeletedAt { get; set; } = DateTime.Now;
    }

}
