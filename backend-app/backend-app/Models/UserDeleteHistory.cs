namespace backend_app.Models
{
    public class UserDeleteHistory
    {
        public int Id { get; set; }
        public string DeletedItemName { get; set; } = string.Empty;
        public string ItemType { get; set; } = string.Empty; // e.g. Request, Asset
        public string UserName { get; set; } = string.Empty;
        public DateTime DeletedAt { get; set; } = DateTime.Now;
    }
}
