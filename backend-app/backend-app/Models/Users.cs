using System.ComponentModel.DataAnnotations;

namespace backend_app.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, Phone, StringLength(10)]
        public string PhoneNumber { get; set; } = string.Empty;


        [Required]
        [MinLength(8)]
        public string Password { get; set; } = string.Empty;


    }
}
