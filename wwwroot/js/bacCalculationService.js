/**
 * BACCalculationService - Client-side implementation of BAC calculations
 * This service provides methods to calculate BAC and estimate time to zero
 */
class BACCalculationService {
    constructor() {
        // Constants for BAC calculation
        this.alcoholDensity = 0.789; // g/mL
        this.metabolizationRate = 0.016; // % per hour
        
        // Widmark factors
        this.maleWidmarkFactor = 0.68;
        this.femaleWidmarkFactor = 0.55;
        
        // Unit conversion factors
        this.ouncesToMl = 29.5735;
        this.lbsToKg = 0.453592;
        this.stoneToKg = 6.35029;
    }

    /**
     * Calculate Blood Alcohol Content (BAC)
     * @param {Object} userProfile - The user profile containing gender and weight
     * @param {Array} beverages - Array of consumed beverages
     * @returns {number} The calculated BAC percentage
     */
    calculateBAC(userProfile, beverages) {
        if (!userProfile || !beverages || beverages.length === 0) {
            return 0.0;
        }

        // Convert weight to kg
        let weightInKg;
        switch (userProfile.weightUnit?.toLowerCase()) {
            case 'kg':
                weightInKg = userProfile.weight;
                break;
            case 'stone':
                weightInKg = userProfile.weight * this.stoneToKg;
                break;
            case 'lb':
            default:
                weightInKg = userProfile.weight * this.lbsToKg;
                break;
        }

        // Get Widmark factor based on gender
        const widmarkFactor = userProfile.gender?.toLowerCase() === 'female' ? 
            this.femaleWidmarkFactor : this.maleWidmarkFactor;

        // Calculate total body water in liters (weight in grams * Widmark factor)
        const bodyWaterInLiters = (weightInKg*1000) * widmarkFactor;

        let totalBAC = 0.0;
        const currentTime = new Date();

        // Process each beverage
        beverages.forEach(beverage => {
            console.log("Processing beverage:", beverage);

            // Parse consumed time if it's a string
            let consumedTime = beverage.consumedTime;
            if (typeof consumedTime === 'string') {
                consumedTime = new Date(consumedTime);
            }

            // Calculate elapsed hours since consumption
            const hoursElapsed = (currentTime - consumedTime) / (1000 * 60 * 60);

            // It takes about 30-70 minutes for the alcohol to get into the bloodstream
            // We assume 45 minutes (0.75 hours) for this calculation
            // So the BAC level will go up immediately after consumption in the app
            // And we'll delay any countdown of BAC for 45 minutes.
            const absorptionDelay = 0.75;
            const effectiveHoursElapsed = Math.max(0, hoursElapsed - absorptionDelay);

            // Convert beverage volume to milliliters
            let volumeInMl;
            switch (beverage.volumeUnit?.toLowerCase()) {
                case 'ml':
                    volumeInMl = beverage.amount;
                    break;
                case 'oz':
                default:
                    volumeInMl = beverage.amount * this.ouncesToMl;
                    break;
            }

            // Calculate alcohol mass in grams: volume (mL) * ABV (%) * alcohol density (g/mL)
            const alcoholMassInGrams = volumeInMl * (beverage.abv / 100) * this.alcoholDensity;

            // Calculate BAC increase from this beverage: alcohol mass (g) / (body water (L) * 1000)
            // Calculated using the Widmark Equation
            // (Dose in grams/(Body weight in grams x Distribution ratio "r"))x100 where r(male)=.68 r(female)=.55 and assuming an average constant rate of -0.016 BAC per hour.
            const bacIncrease = (alcoholMassInGrams / bodyWaterInLiters)*100;

            // Calculate BAC decrease due to metabolism: rate (%/hr) * elapsed time (hr)
            const bacDecrease = this.metabolizationRate * effectiveHoursElapsed;
            console.log(`BAC increase: ${bacIncrease}, BAC decrease: ${bacDecrease}`);

            // Calculate net BAC contribution (ensuring it's not negative)
            const netBacContribution = Math.max(0, bacIncrease - bacDecrease);

            // Add to total BAC
            totalBAC += netBacContribution;
        });

        // BAC is already in percentage, so no need to convert
        return totalBAC;
    }

    /**
     * Estimate time until BAC reaches zero
     * @param {number} currentBAC - Current BAC percentage
     * @returns {string} Time until BAC reaches zero, formatted as hours and minutes
     */
    estimateTimeToZero(currentBAC) {
        // If current BAC is already 0 or less, return "Now"
        if (currentBAC <= 0) {
            return "Now";
        }

        // Calculate hours to metabolize current BAC
        // BAC (%) / metabolization rate (%/hr)
        const hoursToZero = currentBAC / this.metabolizationRate;

        // Calculate hours and minutes
        const hours = Math.floor(hoursToZero);
        const minutes = Math.round((hoursToZero - hours) * 60);

        // Format the result
        if (hours === 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (minutes === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Get the CSS class corresponding to BAC level
     * @param {number} bac - Current BAC percentage
     * @returns {string} CSS class name
     */
    getBACLevelClass(bac) {
        if (bac >= 0.08) return "text-danger";
        if (bac >= 0.04) return "text-warning";
        return "text-success";
    }

    /**
     * Format BAC value for display
     * @param {number} bac - BAC value to format 
     * @returns {string} Formatted BAC string (e.g., "0.045")
     */
    formatBAC(bac) {
        return bac.toFixed(3);
    }
}

// Create a global instance of the service
const bacCalculationService = new BACCalculationService();