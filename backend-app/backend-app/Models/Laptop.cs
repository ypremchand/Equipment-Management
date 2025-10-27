using System;
using System.ComponentModel.DataAnnotations;

namespace backend_app.Models
{
    public class Laptop
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Brand { get; set; }

        [Required]
        public string SerialNumber { get; set; }
        [Required]
        public string AssetTag { get; set; }
        [Required]
        public DateTime? PurchaseDate { get; set; }
        [Required]
        public DateTime? WarrantyExpiry { get; set; }
        [Required]
        public string Processor { get; set; }
        [Required]
        public string Ram { get; set; }
        [Required]
        public string Storage { get; set; }
        [Required]
        public string GraphicsCard { get; set; }
        [Required]
        public string DisplaySize { get; set; }
        [Required]
        public string OperatingSystem { get; set; }
        [Required]
        public string BatteryCapacity { get; set; }
        [Required]
        public string Location { get; set; }
        [Required]
        public string Status { get; set; } = "Available";
        [Required]
        public string AssignedTo { get; set; }
        [Required]
        public string Remarks { get; set; }
        [Required]
        public DateTime? LastServicedDate { get; set; }
    }
}
