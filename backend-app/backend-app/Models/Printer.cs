using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Printer
    {
        [Key]
        public int Id { get; set; }

        [Required] public string Brand { get; set; }
        [Required] public string Model { get; set; }
        [Required] public string PrinterType { get; set; } // Inkjet / Laser / Dot-matrix
        [Required] public string PaperSize { get; set; }   // A4 / Legal etc.
        [Required] public int Dpi { get; set; }

        [Required] public string AssetTag { get; set; }
        public DateTime PurchaseDate { get; set; }
        [Required] public string Location { get; set; }
        public string? Remarks { get; set; }

        public bool IsAssigned { get; set; } = false;
        public DateTime? AssignedDate { get; set; }

        [ForeignKey("Asset")]
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }


        
    }
}
