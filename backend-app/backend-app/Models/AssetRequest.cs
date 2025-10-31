using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EquipmentDispatchManagement.Models
{
    public class AssetRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Username { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }
        [Phone]
        public string? PhoneNumber { get; set; }

        [Required]
        public string Location { get; set; }

        public string? Message { get; set; }

        // Navigation property (one-to-many)
        public ICollection<AssetRequestItem> AssetRequestItems { get; set; }
    }
}
