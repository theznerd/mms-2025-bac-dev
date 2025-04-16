using Microsoft.AspNetCore.Mvc;
using mms_2025_bac_dev.Models;
using mms_2025_bac_dev.Services;
using System.Diagnostics;

namespace mms_2025_bac_dev.Controllers
{
    public class HomeController : Controller
    {
        private readonly SessionStorageService _sessionStorage;
        private readonly BACService _bacService;
        private readonly ILogger<HomeController> _logger;

        public HomeController(SessionStorageService sessionStorage, BACService bacService, ILogger<HomeController> logger)
        {
            _sessionStorage = sessionStorage;
            _bacService = bacService;
            _logger = logger;
        }

        public IActionResult Index()
        {
            var userProfile = _sessionStorage.GetUserProfile();
            var beverages = _sessionStorage.GetBeverages();

            var viewModel = new BACTrackerViewModel
            {
                HasProfile = userProfile != null,
                UserProfile = userProfile ?? new UserProfile(),
                Beverages = beverages,
                NewBeverage = new Beverage { ConsumedTime = DateTime.Now }
            };

            if (viewModel.HasProfile)
            {
                viewModel.CurrentBAC = _bacService.CalculateBAC(viewModel.UserProfile, viewModel.Beverages);
                viewModel.TimeToZero = _bacService.EstimateTimeToZero(viewModel.CurrentBAC);
            }

            return View(viewModel);
        }

        [HttpPost]
        public IActionResult SaveProfile(UserProfile userProfile)
        {
            if (ModelState.IsValid)
            {
                _sessionStorage.SaveUserProfile(userProfile);
                return RedirectToAction("Index");
            }

            var beverages = _sessionStorage.GetBeverages();
            var viewModel = new BACTrackerViewModel
            {
                UserProfile = userProfile,
                Beverages = beverages,
                HasProfile = false
            };

            return View("Index", viewModel);
        }

        [HttpPost]
        public IActionResult AddBeverage(double Amount, string VolumeUnit, double ABV, string ConsumedTime)
        {
            // Manually handle the form data instead of relying on model binding
            if (double.TryParse(ABV.ToString(), out double abvValue) && 
                double.TryParse(Amount.ToString(), out double amountValue) && 
                !string.IsNullOrEmpty(ConsumedTime))
            {
                DateTime consumedDateTime;
                // Try to parse the input datetime string
                if (DateTime.TryParse(ConsumedTime, out consumedDateTime))
                {
                    var beverage = new Beverage
                    {
                        Id = DateTime.Now.Ticks,
                        Amount = amountValue,
                        VolumeUnit = VolumeUnit,
                        ABV = abvValue,
                        ConsumedTime = consumedDateTime
                    };

                    _sessionStorage.AddBeverage(beverage);
                    return RedirectToAction("Index");
                }
            }

            // If we get here, something went wrong with the input validation
            ModelState.AddModelError("", "Please enter valid beverage information.");
            
            // Reload the view with current data
            var userProfile = _sessionStorage.GetUserProfile();
            var beverages = _sessionStorage.GetBeverages();

            var viewModel = new BACTrackerViewModel
            {
                HasProfile = userProfile != null,
                UserProfile = userProfile ?? new UserProfile(),
                Beverages = beverages,
                NewBeverage = new Beverage 
                { 
                    Amount = Amount,
                    VolumeUnit = VolumeUnit ?? "oz",
                    ABV = ABV,
                    ConsumedTime = DateTime.Now 
                }
            };

            if (viewModel.HasProfile)
            {
                viewModel.CurrentBAC = _bacService.CalculateBAC(viewModel.UserProfile, viewModel.Beverages);
                viewModel.TimeToZero = _bacService.EstimateTimeToZero(viewModel.CurrentBAC);
            }

            return View("Index", viewModel);
        }

        [HttpPost]
        public IActionResult DeleteBeverage(long id)
        {
            _sessionStorage.DeleteBeverage(id);
            return RedirectToAction("Index");
        }

        [HttpPost]
        public IActionResult ClearData()
        {
            _sessionStorage.ClearAllData();
            return RedirectToAction("Index");
        }

        [HttpGet]
        public IActionResult RefreshBAC()
        {
            var userProfile = _sessionStorage.GetUserProfile();
            var beverages = _sessionStorage.GetBeverages();

            if (userProfile == null)
            {
                return Json(new { bac = "0.000", timeToZero = "N/A" });
            }

            var currentBAC = _bacService.CalculateBAC(userProfile, beverages);
            var timeToZero = _bacService.EstimateTimeToZero(currentBAC);

            return Json(new { 
                bac = currentBAC.ToString("0.000"), 
                timeToZero = timeToZero,
                bacLevel = GetBACLevelClass(currentBAC)
            });
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        private string GetBACLevelClass(double bac)
        {
            if (bac >= 0.08) return "text-danger";
            if (bac >= 0.04) return "text-warning";
            return "text-success";
        }
    }
}