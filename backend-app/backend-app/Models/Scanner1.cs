using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Scanner1
    {
        [Key]
        public int Id { get; set; }

        [Required] public string Scanner1Brand { get; set; }
        [Required] public string Scanner1Model { get; set; }
        [Required] public string Scanner1Type { get; set; }  // Flatbed, Sheet-fed, etc.
        [Required] public string Scanner1Resolution { get; set; }  // 600dpi, 1200dpi
        [Required] public string Scanner1AssetTag { get; set; }

        public DateTime PurchaseDate { get; set; }

        [Required] public string Scanner1Location { get; set; }

        public string? Remarks { get; set; }
        public bool IsAssigned { get; set; } = false;
        public DateTime? AssignedDate { get; set; }

        [ForeignKey("Asset")]
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }
    }
}
