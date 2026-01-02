using System.ComponentModel.DataAnnotations;

public class Asset
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? PreCode { get; set; }

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

  
}
