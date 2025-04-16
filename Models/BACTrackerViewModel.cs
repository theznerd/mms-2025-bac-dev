namespace mms_2025_bac_dev.Models
{
    public class BACTrackerViewModel
    {
        public UserProfile UserProfile { get; set; } = new UserProfile();
        public List<Beverage> Beverages { get; set; } = new List<Beverage>();
        public Beverage NewBeverage { get; set; } = new Beverage();
        public double CurrentBAC { get; set; }
        public string TimeToZero { get; set; } = "N/A";
        public bool HasProfile { get; set; }
    }
}