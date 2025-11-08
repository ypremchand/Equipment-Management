using System;

namespace backend_app.Models
{
    public class AdminActionHistory
    {
        public int Id { get; set; }
        public string EntityName { get; set; }      // e.g. "Asset", "Location"
        public string ActionType { get; set; }      // "Edit" or "Delete"
        public string? OldValue { get; set; }       // JSON or text of previous data
        public string? NewValue { get; set; }       // JSON or text of new data
        public string PerformedBy { get; set; }     // Admin Name or ID
        public DateTime ActionDate { get; set; } = DateTime.Now;
    }
}
