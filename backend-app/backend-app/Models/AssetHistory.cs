using System;

namespace backend_app.Models
{
    public class AssetHistory
    {
        public int Id { get; set; }

        public string AssetTag { get; set; } = null!;

        public string? Brand { get; set; }
        public string? Location { get; set; }

        public DateTime? RequestedDate { get; set; }
        public string? RequestedBy { get; set; }

        public DateTime? AssignedDate { get; set; }
        public string? AssignedBy { get; set; }

        public DateTime? ReturnDate { get; set; }

        public string? Remarks { get; set; }
    }
}
