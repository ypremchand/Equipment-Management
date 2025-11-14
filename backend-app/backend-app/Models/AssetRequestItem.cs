using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace backend_app.Models
{
    public class AssetRequestItem
    {
        [Key]
        public int Id { get; set; }

        // -----------------------------
        // Parent: AssetRequest
        // -----------------------------
        [ForeignKey("AssetRequest")]
        public int AssetRequestId { get; set; }

        [JsonIgnore]  // Prevent circular JSON when returning API data
        public AssetRequest AssetRequest { get; set; }

        // -----------------------------
        // Requested Asset Type
        // -----------------------------
        [ForeignKey("Asset")]
        public int AssetId { get; set; }
        public Asset Asset { get; set; }

        // -----------------------------
        // Quantities
        // -----------------------------
        [Required]
        public int RequestedQuantity { get; set; }

        public int? ApprovedQuantity { get; set; } // Filled after admin approval

        // -----------------------------
        // Assigned Items (Laptops / Mobiles / Tablets / etc.)
        // -----------------------------
        public ICollection<AssignedAsset> AssignedAssets { get; set; } = new List<AssignedAsset>();
    }
}
