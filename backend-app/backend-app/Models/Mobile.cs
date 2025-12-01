using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Mobile
    {
        [Key]
        public int Id { get; set; }

        [Required] public string Brand { get; set; }
        [Required] public string Model { get; set; }
        [Required] public string IMEINumber { get; set; }
        [Required] public string AssetTag { get; set; }
        [Required] public DateTime PurchaseDate { get; set; }
        [Required] public string Processor { get; set; }
        [Required] public string Ram { get; set; }
        [Required] public string Storage { get; set; }
        [Required] public string BatteryCapacity { get; set; }
        [Required] public string DisplaySize { get; set; }
        [Required] public string SIMType { get; set; }
        [Required] public string NetworkType { get; set; }
        [Required] public string Location { get; set; }

        public string? Remarks { get; set; }
        public DateTime? LastServicedDate { get; set; }

        // 🔥 Required for assignment tracking
        public bool IsAssigned { get; set; } = false;
        public DateTime? AssignedDate { get; set; }

        [ForeignKey("Asset")]
        public int? AssetId { get; set; }
        public Asset? Asset { get; set; }
    }
}
