using System.ComponentModel.DataAnnotations;

namespace backend_app.Models
{
    public class Asset
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        // NEW — the table name that maps to related items (Laptops, Mobiles, Tablets…)
        [StringLength(100)]
        public string? TableName { get; set; }
    }
}
