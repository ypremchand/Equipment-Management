using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Scanner2
    {

        [Key]
        public int Id { get; set; }

        [Required] public string Scanner2Brand { get; set; }
        [Required] public string Scanner2Model { get; set; }
        [Required] public string Scanner2Type { get; set; }  // Flatbed, Sheet-fed, etc.
        [Required] public string Scanner2Resolution { get; set; }  // 600dpi, 1200dpi
        [Required] public string Scanner2AssetTag { get; set; }

        public DateTime PurchaseDate { get; set; }

        [Required] public string Scanner2Location { get; set; }

        public string? Remarks { get; set; }
        public bool IsAssigned { get; set; } = false;
        public DateTime? AssignedDate { get; set; }

        [ForeignKey("Asset")]
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }
    }
}
