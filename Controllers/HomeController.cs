using Microsoft.AspNetCore.Mvc;
using mms_2025_bac_dev.Models;
using System.Diagnostics;

namespace mms_2025_bac_dev.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            // With client-side storage, we just need to render the initial view
            // All data operations will be handled by JavaScript
            var viewModel = new BACTrackerViewModel
            {
                HasProfile = false,
                UserProfile = new UserProfile(),
                Beverages = new List<Beverage>(),
                NewBeverage = new Beverage { ConsumedTime = DateTime.Now }
            };

            return View(viewModel);
        }

        [HttpGet]
        public IActionResult HealthCheck()
        {
            // Simple endpoint to check if the server is responding
            _logger.LogInformation("Health check request received at {time}", DateTime.UtcNow);
            return Json(new { status = "ok", timestamp = DateTime.UtcNow });
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}