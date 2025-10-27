using System.ComponentModel.DataAnnotations;

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
        public string SerialNumber { get; set; }

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

        [Required]
        public string OperatingSystem { get; set; }

        [Required]
        public string SIMSupport { get; set; } // e.g. WiFi / WiFi + Cellular

        [Required]
        public string NetworkType { get; set; } // e.g. 4G / 5G / None

        [Required]
        public string Location { get; set; }

        [Required]
        public string Status { get; set; } = "Available";

        [Required]
        public string AssignedTo { get; set; }

        public string Remarks { get; set; }

        public DateTime? LastServicedDate { get; set; }
    }
}
