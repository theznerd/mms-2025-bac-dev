using mms_2025_bac_dev.Models;

namespace mms_2025_bac_dev.Services
{
    public class BACService
    {
        // Constants
        private const double ELIMINATION_RATE = 0.016; // BAC reduction per hour
        private const double ALCOHOL_DENSITY = 0.789; // g/ml
        private readonly Dictionary<string, double> DISTRIBUTION_RATIO = new Dictionary<string, double>
        {
            { "male", 0.68 },
            { "female", 0.55 }
        };

        public double CalculateBAC(UserProfile userProfile, List<Beverage> beverages)
        {
            if (beverages == null || beverages.Count == 0 || string.IsNullOrEmpty(userProfile?.Gender) || userProfile.Weight <= 0)
            {
                return 0;
            }

            DateTime now = DateTime.Now;
            double totalBAC = 0;

            // Convert weight to grams
            double weightInGrams = userProfile.Weight;
            switch (userProfile.WeightUnit)
            {
                case "lb":
                    weightInGrams = userProfile.Weight * 453.592; // lb to g
                    break;
                case "kg":
                    weightInGrams = userProfile.Weight * 1000; // kg to g
                    break;
                case "stone":
                    weightInGrams = userProfile.Weight * 6350.29; // stone to g
                    break;
            }

            if (!DISTRIBUTION_RATIO.TryGetValue(userProfile.Gender.ToLower(), out double r))
            {
                r = 0.68; // Default to male if not found
            }

            foreach (var beverage in beverages)
            {
                // Calculate alcohol amount in grams
                double amountInMl = beverage.Amount;
                if (beverage.VolumeUnit == "oz")
                {
                    amountInMl = beverage.Amount * 29.5735; // fl oz to ml
                }

                double alcoholGrams = amountInMl * (beverage.ABV / 100) * ALCOHOL_DENSITY;

                // Calculate initial BAC from this drink
                double initialBAC = (alcoholGrams / (weightInGrams * r)) * 100;

                // Calculate hours elapsed since consumption
                double hoursElapsed = (now - beverage.ConsumedTime).TotalHours;

                // Calculate remaining BAC after elimination
                double remainingBAC = Math.Max(0, initialBAC - (ELIMINATION_RATE * hoursElapsed));

                totalBAC += remainingBAC;
            }

            // Round to 3 decimal places
            return Math.Max(0, Math.Round(totalBAC, 3));
        }

        public string EstimateTimeToZero(double currentBAC)
        {
            if (currentBAC <= 0)
            {
                return "N/A";
            }

            // Calculate time to zero
            double hoursToZero = currentBAC / ELIMINATION_RATE;
            int minutesToZero = (int)Math.Ceiling(hoursToZero * 60);

            int hours = minutesToZero / 60;
            int minutes = minutesToZero % 60;

            string timeStr = "";
            if (hours > 0)
            {
                timeStr += $"{hours} hour{(hours != 1 ? "s" : "")}";
            }
            if (minutes > 0)
            {
                timeStr += $"{(hours > 0 ? " " : "")}{minutes} minute{(minutes != 1 ? "s" : "")}";
            }

            return timeStr;
        }
    }
}