using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class Tablet
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Brand { get; set; }

        [Required]
        public string Model { get; set; }

        [Required]
        public string AssetTag { get; set; }

        [Required]
        public DateTime PurchaseDate { get; set; }

        [Required]
        public string Processor { get; set; }

        [Required]
        public string Ram { get; set; }

        [Required]
        public string Storage { get; set; }

        [Required]
        public string DisplaySize { get; set; }

        [Required]
        public string BatteryCapacity { get; set; }

        // ✅ Optional IMEI number (only required for "Wi-Fi + Cellular")
        public string? IMEINumber { get; set; }

        // ✅ SIM Support: Wi-Fi Only / Wi-Fi + Cellular
        [Required]
        public string SIMSupport { get; set; }

        [Required]
        public string NetworkType { get; set; } // e.g., 4G / 5G / None

        [Required]
        public string Location { get; set; }

        public string? Remarks { get; set; }

        public DateTime? LastServicedDate { get; set; }

        // ✅ Relation to Asset table (for inventory tracking)
        [ForeignKey("Asset")]
        public int? AssetId { get; set; }

        public Asset? Asset { get; set; }
    }
}
