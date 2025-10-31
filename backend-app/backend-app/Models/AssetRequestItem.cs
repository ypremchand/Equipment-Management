using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EquipmentDispatchManagement.Models
{
    public class AssetRequestItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Asset { get; set; }

        [Required]
        public int RequestedQuantity { get; set; }
        [Required]
        public int AvailableQuantity { get; set; }

        // Foreign key
        [ForeignKey("AssetRequest")]
        public int AssetRequestId { get; set; }

        // Navigation property
        public AssetRequest AssetRequest { get; set; }
    }
}
