namespace mms_2025_bac_dev.Models
{
    public class UserProfile
    {
        public string Gender { get; set; } = string.Empty;
        public double Weight { get; set; }
        public string WeightUnit { get; set; } = "lb";
    }
}