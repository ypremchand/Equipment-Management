using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Scanner3
    {
        [Key]
        public int Id { get; set; }

        [Required] public string Scanner3Brand { get; set; }
        [Required] public string Scanner3Model { get; set; }
        [Required] public string Scanner3Type { get; set; }  // Flatbed, Sheet-fed, etc.
        [Required] public string Scanner3Resolution { get; set; }  // 600dpi, 1200dpi
        [Required] public string Scanner3AssetTag { get; set; }

        public DateTime PurchaseDate { get; set; }

        [Required] public string Scanner3Location { get; set; }

        public string? Remarks { get; set; }
        public bool IsAssigned { get; set; } = false;
        public DateTime? AssignedDate { get; set; }

        [ForeignKey("Asset")]
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }
    }
}
