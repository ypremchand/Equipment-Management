using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace backend_app.Models
{
    public class AssetRequestItem
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("AssetRequest")]
        public int AssetRequestId { get; set; }
        [JsonIgnore]  // ✅ Prevent sending back full request inside each item
        public AssetRequest AssetRequest { get; set; }

        [ForeignKey("Asset")]
        public int AssetId { get; set; }
        public Asset Asset { get; set; }

        [Required]
        public int RequestedQuantity { get; set; }

        public int? ApprovedQuantity { get; set; } // When admin approves
    }
}
