using System.ComponentModel.DataAnnotations;

namespace mms_2025_bac_dev.Models
{
    public class Beverage
    {
        public long Id { get; set; }
        
        [Required]
        [Range(0.1, double.MaxValue, ErrorMessage = "Please enter a value greater than 0")]
        public double Amount { get; set; }
        
        public string VolumeUnit { get; set; } = "oz";
        
        [Required]
        [Range(0.1, 100, ErrorMessage = "ABV must be between 0.1 and 100")]
        public double ABV { get; set; }
        
        [Required]
        public DateTime ConsumedTime { get; set; }
    }
}