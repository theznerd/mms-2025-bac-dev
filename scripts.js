document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const ELIMINATION_RATE = 0.016; // BAC reduction per hour
    const DISTRIBUTION_RATIO = {
        male: 0.68,
        female: 0.55
    };
    const ALCOHOL_DENSITY = 0.789; // g/ml
    
    // DOM Elements
    const userProfileForm = document.getElementById('userProfileForm');
    const userProfileSection = document.getElementById('userProfileSection');
    const bacDisplaySection = document.getElementById('bacDisplaySection');
    const addBeverageSection = document.getElementById('addBeverageSection');
    const beverageListSection = document.getElementById('beverageListSection');
    const addBeverageForm = document.getElementById('addBeverageForm');
    const beverageList = document.getElementById('beverageList');
    const noBeverages = document.getElementById('noBeverages');
    const bacValue = document.getElementById('bacValue');
    const timeToZero = document.getElementById('timeToZero');
    const newSessionBtn = document.getElementById('newSession');
    const consumedTimeInput = document.getElementById('consumedTime');

    // Set default time to now
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 16);
    consumedTimeInput.value = formattedNow;

    // App state
    let userProfile = {
        gender: '',
        weight: 0,
        weightUnit: 'lb'
    };
    
    let beverages = [];
    let updateInterval;

    // Initialize the app
    initApp();

    function initApp() {
        loadFromLocalStorage();
        setupEventListeners();
        
        if (userProfile.gender && userProfile.weight > 0) {
            showMainApp();
            updateBACDisplay();
        }
    }

    function setupEventListeners() {
        userProfileForm.addEventListener('submit', handleProfileSubmit);
        addBeverageForm.addEventListener('submit', handleAddBeverage);
        newSessionBtn.addEventListener('click', clearData);
    }

    function handleProfileSubmit(e) {
        e.preventDefault();
        
        const gender = document.getElementById('gender').value;
        const weight = parseFloat(document.getElementById('weight').value);
        const weightUnit = document.getElementById('weightUnit').value;
        
        if (gender && weight > 0) {
            userProfile = { gender, weight, weightUnit };
            saveToLocalStorage();
            showMainApp();
            updateBACDisplay();
        }
    }

    function handleAddBeverage(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const volumeUnit = document.getElementById('volumeUnit').value;
        const abv = parseFloat(document.getElementById('abv').value);
        const consumedTime = document.getElementById('consumedTime').value;
        
        if (amount > 0 && abv > 0 && consumedTime) {
            const beverage = {
                id: Date.now(),
                amount,
                volumeUnit,
                abv,
                consumedTime: new Date(consumedTime).toISOString()
            };
            
            beverages.push(beverage);
            saveToLocalStorage();
            renderBeverageList();
            updateBACDisplay();
            
            // Reset form
            document.getElementById('amount').value = '';
            document.getElementById('abv').value = '';
            const now = new Date();
            consumedTimeInput.value = now.toISOString().slice(0, 16);

            // Animate the BAC display on update
            bacValue.classList.add('pulse');
            setTimeout(() => bacValue.classList.remove('pulse'), 1000);
        }
    }

    function deleteBeverage(id) {
        beverages = beverages.filter(b => b.id !== id);
        saveToLocalStorage();
        renderBeverageList();
        updateBACDisplay();
    }

    function showMainApp() {
        userProfileSection.classList.add('hidden');
        bacDisplaySection.classList.remove('hidden');
        addBeverageSection.classList.remove('hidden');
        beverageListSection.classList.remove('hidden');
        
        // Start the BAC update interval
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(updateBACDisplay, 60000); // Update every minute
    }

    function loadFromLocalStorage() {
        try {
            const savedProfile = localStorage.getItem('bacTrackerProfile');
            const savedBeverages = localStorage.getItem('bacTrackerBeverages');
            
            if (savedProfile) {
                userProfile = JSON.parse(savedProfile);
            }
            
            if (savedBeverages) {
                beverages = JSON.parse(savedBeverages);
            }
            
            renderBeverageList();
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem('bacTrackerProfile', JSON.stringify(userProfile));
            localStorage.setItem('bacTrackerBeverages', JSON.stringify(beverages));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    function clearData() {
        if (confirm('Are you sure you want to clear all data and start a new session?')) {
            userProfile = {
                gender: '',
                weight: 0,
                weightUnit: 'lb'
            };
            beverages = [];
            saveToLocalStorage();
            
            clearInterval(updateInterval);
            userProfileSection.classList.remove('hidden');
            bacDisplaySection.classList.add('hidden');
            addBeverageSection.classList.add('hidden');
            beverageListSection.classList.add('hidden');
        }
    }

    function renderBeverageList() {
        beverageList.innerHTML = '';
        
        if (beverages.length === 0) {
            noBeverages.classList.remove('hidden');
            return;
        }
        
        noBeverages.classList.add('hidden');
        
        // Sort beverages by consumed time (newest first)
        const sortedBeverages = [...beverages].sort((a, b) => 
            new Date(b.consumedTime) - new Date(a.consumedTime)
        );
        
        sortedBeverages.forEach(beverage => {
            const tr = document.createElement('tr');
            
            // Format date
            const consumedDate = new Date(beverage.consumedTime);
            const formattedDate = consumedDate.toLocaleString();
            
            tr.innerHTML = `
                <td class="py-2 px-4 border-b">${formattedDate}</td>
                <td class="py-2 px-4 border-b">${beverage.amount} ${beverage.volumeUnit}</td>
                <td class="py-2 px-4 border-b">${beverage.abv}%</td>
                <td class="py-2 px-4 border-b">
                    <button class="text-red-600 hover:text-red-800 delete-btn" data-id="${beverage.id}">
                        Delete
                    </button>
                </td>
            `;
            
            beverageList.appendChild(tr);
            
            // Add event listener to the delete button
            const deleteBtn = tr.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteBeverage(beverage.id));
        });
    }

    function calculateBAC() {
        if (beverages.length === 0) return 0;
        
        const now = new Date();
        let totalBAC = 0;
        
        // Convert weight to grams
        let weightInGrams = userProfile.weight;
        switch (userProfile.weightUnit) {
            case 'lb':
                weightInGrams = userProfile.weight * 453.592; // lb to g
                break;
            case 'kg':
                weightInGrams = userProfile.weight * 1000; // kg to g
                break;
            case 'stone':
                weightInGrams = userProfile.weight * 6350.29; // stone to g
                break;
        }
        
        const r = DISTRIBUTION_RATIO[userProfile.gender];
        
        beverages.forEach(beverage => {
            // Calculate alcohol amount in grams
            let amountInMl = beverage.amount;
            if (beverage.volumeUnit === 'oz') {
                amountInMl = beverage.amount * 29.5735; // fl oz to ml
            }
            
            const alcoholGrams = amountInMl * (beverage.abv / 100) * ALCOHOL_DENSITY;
            
            // Calculate initial BAC from this drink
            const initialBAC = (alcoholGrams / (weightInGrams * r)) * 100;
            
            // Calculate hours elapsed since consumption
            const consumedTime = new Date(beverage.consumedTime);
            const hoursElapsed = (now - consumedTime) / (1000 * 60 * 60);
            
            // Calculate remaining BAC after elimination
            const remainingBAC = Math.max(0, initialBAC - (ELIMINATION_RATE * hoursElapsed));
            
            totalBAC += remainingBAC;
        });
        
        // Round to 3 decimal places
        return Math.max(0, parseFloat(totalBAC.toFixed(3)));
    }

    function updateBACDisplay() {
        const currentBAC = calculateBAC();
        bacValue.textContent = currentBAC.toFixed(3) + '%';
        
        // Update color based on BAC level
        bacValue.className = 'text-5xl font-bold my-4';
        if (currentBAC >= 0.08) {
            bacValue.classList.add('bac-danger');
        } else if (currentBAC >= 0.04) {
            bacValue.classList.add('bac-caution');
        } else {
            bacValue.classList.add('bac-safe');
        }
        
        // Calculate time to zero
        if (currentBAC > 0) {
            const hoursToZero = currentBAC / ELIMINATION_RATE;
            const minutesToZero = Math.ceil(hoursToZero * 60);
            
            const hours = Math.floor(minutesToZero / 60);
            const minutes = minutesToZero % 60;
            
            let timeStr = '';
            if (hours > 0) {
                timeStr += `${hours} hour${hours !== 1 ? 's' : ''}`;
            }
            if (minutes > 0) {
                timeStr += `${hours > 0 ? ' ' : ''}${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
            
            timeToZero.textContent = timeStr;
        } else {
            timeToZero.textContent = 'N/A';
        }
    }
});