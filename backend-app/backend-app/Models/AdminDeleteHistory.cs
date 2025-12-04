namespace backend_app.Models
{
    public class AdminDeleteHistory
    {
        public int Id { get; set; }

        public string DeletedItemName { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty; // Laptop, Location, etc.
        public string AdminName { get; set; } = string.Empty;


        public string Reason { get; set; } = string.Empty; // optional

        public DateTime DeletedAt { get; set; } = DateTime.Now;
    }
}
