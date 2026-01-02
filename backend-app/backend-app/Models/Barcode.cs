
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Barcode
    {
        [Key]
        public int Id { get; set; }

        [Required] public string Brand { get; set; }
        [Required] public string Model { get; set; }
        [Required] public string Type { get; set; }  // Flatbed, Sheet-fed, etc.
        [Required] public string Technology { get; set; }  // 600dpi, 1200dpi
        [Required] public string  AssetTag { get; set; }

        public DateTime PurchaseDate { get; set; }

        [Required] public string  Location { get; set; }

        public string? Remarks { get; set; }
        public bool IsAssigned { get; set; } = false;
        public DateTime? AssignedDate { get; set; }

        [ForeignKey("Asset")]
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }
    }

}
