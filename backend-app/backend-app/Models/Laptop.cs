using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Laptop
    {
        [Key]
        public int Id { get; set; }

        [Required] public string Brand { get; set; }
        [Required] public string SerialNumber { get; set; }
        [Required] public string AssetTag { get; set; }
        [Required] public DateTime PurchaseDate { get; set; }
        [Required] public DateTime WarrantyExpiry { get; set; }
        [Required] public string Processor { get; set; }
        [Required] public string Ram { get; set; }
        [Required] public string Storage { get; set; }
        [Required] public string GraphicsCard { get; set; }
        [Required] public string DisplaySize { get; set; }
        [Required] public string OperatingSystem { get; set; }
        [Required] public string BatteryCapacity { get; set; }

        public string Status { get; set; } = "Available";
        public string? AssignedTo { get; set; }
        public string? Remarks { get; set; }
        public DateTime? LastServicedDate { get; set; }

        // ✅ Add this missing property
        [Required]
        public string Location { get; set; }

        // ✅ Foreign Key to Asset
        [ForeignKey("Asset")]
        public int? AssetId { get; set; }

        // ✅ Navigation property
        public Asset? Asset { get; set; }
    }
}
