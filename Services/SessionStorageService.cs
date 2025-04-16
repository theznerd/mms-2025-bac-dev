using System.Text.Json;
using Microsoft.AspNetCore.Http;
using mms_2025_bac_dev.Models;

namespace mms_2025_bac_dev.Services
{
    public class SessionStorageService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private const string UserProfileKey = "UserProfile";
        private const string BeveragesKey = "Beverages";

        public SessionStorageService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public UserProfile? GetUserProfile()
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            string? userProfileJson = session?.GetString(UserProfileKey);
            
            if (string.IsNullOrEmpty(userProfileJson))
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<UserProfile>(userProfileJson);
            }
            catch
            {
                return null;
            }
        }

        public void SaveUserProfile(UserProfile userProfile)
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            string userProfileJson = JsonSerializer.Serialize(userProfile);
            session?.SetString(UserProfileKey, userProfileJson);
        }

        public List<Beverage> GetBeverages()
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            string? beveragesJson = session?.GetString(BeveragesKey);
            
            if (string.IsNullOrEmpty(beveragesJson))
            {
                return new List<Beverage>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<Beverage>>(beveragesJson) ?? new List<Beverage>();
            }
            catch
            {
                return new List<Beverage>();
            }
        }

        public void SaveBeverages(List<Beverage> beverages)
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            string beveragesJson = JsonSerializer.Serialize(beverages);
            session?.SetString(BeveragesKey, beveragesJson);
        }

        public void AddBeverage(Beverage newBeverage)
        {
            var beverages = GetBeverages();
            newBeverage.Id = DateTime.Now.Ticks;
            beverages.Add(newBeverage);
            SaveBeverages(beverages);
        }

        public void DeleteBeverage(long id)
        {
            var beverages = GetBeverages();
            var filtered = beverages.Where(b => b.Id != id).ToList();
            SaveBeverages(filtered);
        }

        public void ClearAllData()
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            session?.Remove(UserProfileKey);
            session?.Remove(BeveragesKey);
        }
    }
}