using System;

namespace backend_app.Models
{
    public class UserActionHistory
    {
        public int Id { get; set; }
        public string EntityName { get; set; }      // e.g. "Asset Request"
        public string ActionType { get; set; }      // "Edit" or "Delete"
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string PerformedBy { get; set; }     // User Name or ID
        public DateTime ActionDate { get; set; } = DateTime.Now;
    }
}
