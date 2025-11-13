using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_app.Models
{
    public class AssetRequest
    {
        [Key]
        public int Id { get; set; }

        // ✅ User who made the request
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User User { get; set; }

        // ✅ Location to which assets are to be delivered
        [ForeignKey("Location")]
        public int LocationId { get; set; }
        public Location Location { get; set; }

        [Required]
        public DateTime RequestDate { get; set; } = DateTime.Now;

        [Required]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
                                                        // ✅ Optional message from the user
        [StringLength(500)]
        public string? Message { get; set; }

        // ✅ One request can include multiple asset types
        public ICollection<AssetRequestItem> AssetRequestItems { get; set; }
    }
}