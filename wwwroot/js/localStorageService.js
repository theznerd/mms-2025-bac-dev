/**
 * LocalStorageService - Handles client-side storage using IndexedDB
 * This service provides methods to store user profile and beverage data locally in the browser
 */
class LocalStorageService {
    constructor() {
        this.dbName = 'BACTrackerDB';
        this.dbVersion = 1;
        this.userProfileStore = 'userProfile';
        this.beveragesStore = 'beverages';
        this.db = null;
        
        // Initialize the database
        this.initDB();
    }

    /**
     * Initialize the IndexedDB database
     * @returns {Promise} Promise resolving when DB is ready
     */
    initDB() {
        return new Promise((resolve, reject) => {
            console.log('Initializing IndexedDB');
            if (!window.indexedDB) {
                console.error("Your browser doesn't support IndexedDB");
                reject("IndexedDB not supported");
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error("Database error:", event.target.error);
                reject("Error opening database");
            };
            
            request.onupgradeneeded = (event) => {
                console.log("Creating/upgrading database schema");
                const db = event.target.result;
                
                // Create stores if they don't exist
                if (!db.objectStoreNames.contains(this.userProfileStore)) {
                    db.createObjectStore(this.userProfileStore, { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains(this.beveragesStore)) {
                    db.createObjectStore(this.beveragesStore, { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("Database initialized successfully");
                resolve(this.db);
            };
        });
    }

    /**
     * Get the database connection, initializing if needed
     * @returns {Promise} Promise resolving to the database connection
     */
    getDB() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
            } else {
                this.initDB().then(db => resolve(db)).catch(err => reject(err));
            }
        });
    }

    /**
     * Save user profile to IndexedDB
     * @param {Object} profile User profile object
     * @returns {Promise} Promise that resolves when save is complete
     */
    saveUserProfile(profile) {
        return this.getDB().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.userProfileStore], 'readwrite');
                const store = transaction.objectStore(this.userProfileStore);
                
                // Always use ID 1 for the single user profile
                profile.id = 1;
                
                const request = store.put(profile);
                
                request.onerror = (event) => {
                    console.error("Error saving profile:", event.target.error);
                    reject("Failed to save profile");
                };
                
                request.onsuccess = (event) => {
                    console.log("Profile saved successfully");
                    resolve(profile);
                };
            });
        });
    }

    /**
     * Get user profile from IndexedDB
     * @returns {Promise} Promise that resolves with the user profile or null if not found
     */
    getUserProfile() {
        return this.getDB().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.userProfileStore], 'readonly');
                const store = transaction.objectStore(this.userProfileStore);
                
                // Always use ID 1 for the single user profile
                const request = store.get(1);
                
                request.onerror = (event) => {
                    console.error("Error getting profile:", event.target.error);
                    reject("Failed to get profile");
                };
                
                request.onsuccess = (event) => {
                    const profile = event.target.result;
                    console.log("Profile retrieved:", profile || "Not found");
                    resolve(profile || null);
                };
            });
        });
    }

    /**
     * Add a beverage to IndexedDB
     * @param {Object} beverage Beverage object to add
     * @returns {Promise} Promise that resolves when add is complete
     */
    addBeverage(beverage) {
        return this.getDB().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.beveragesStore], 'readwrite');
                const store = transaction.objectStore(this.beveragesStore);
                
                // Ensure the beverage has an ID
                if (!beverage.id) {
                    beverage.id = new Date().getTime();
                }
                
                const request = store.add(beverage);
                
                request.onerror = (event) => {
                    console.error("Error adding beverage:", event.target.error);
                    reject("Failed to add beverage");
                };
                
                request.onsuccess = (event) => {
                    console.log("Beverage added successfully");
                    resolve(beverage);
                };
            });
        });
    }

    /**
     * Get all beverages from IndexedDB
     * @returns {Promise} Promise that resolves with an array of beverages
     */
    getAllBeverages() {
        return this.getDB().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.beveragesStore], 'readonly');
                const store = transaction.objectStore(this.beveragesStore);
                
                const request = store.getAll();
                
                request.onerror = (event) => {
                    console.error("Error getting beverages:", event.target.error);
                    reject("Failed to get beverages");
                };
                
                request.onsuccess = (event) => {
                    const beverages = event.target.result;
                    console.log(`Retrieved ${beverages.length} beverages`);
                    resolve(beverages);
                };
            });
        });
    }

    /**
     * Delete a beverage from IndexedDB
     * @param {number} id ID of the beverage to delete
     * @returns {Promise} Promise that resolves when delete is complete
     */
    deleteBeverage(id) {
        return this.getDB().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.beveragesStore], 'readwrite');
                const store = transaction.objectStore(this.beveragesStore);
                
                const request = store.delete(id);
                
                request.onerror = (event) => {
                    console.error("Error deleting beverage:", event.target.error);
                    reject("Failed to delete beverage");
                };
                
                request.onsuccess = (event) => {
                    console.log("Beverage deleted successfully");
                    resolve(true);
                };
            });
        });
    }

    /**
     * Clear all data from IndexedDB
     * @returns {Promise} Promise that resolves when clear is complete
     */
    clearAllData() {
        return this.getDB().then(db => {
            return new Promise((resolve, reject) => {
                // Clear user profile
                let transaction = db.transaction([this.userProfileStore], 'readwrite');
                let store = transaction.objectStore(this.userProfileStore);
                
                let clearRequest = store.clear();
                
                clearRequest.onerror = (event) => {
                    console.error("Error clearing user profile:", event.target.error);
                    reject("Failed to clear user profile");
                };
                
                clearRequest.onsuccess = (event) => {
                    console.log("User profile cleared");
                    
                    // Clear beverages
                    transaction = db.transaction([this.beveragesStore], 'readwrite');
                    store = transaction.objectStore(this.beveragesStore);
                    
                    clearRequest = store.clear();
                    
                    clearRequest.onerror = (event) => {
                        console.error("Error clearing beverages:", event.target.error);
                        reject("Failed to clear beverages");
                    };
                    
                    clearRequest.onsuccess = (event) => {
                        console.log("Beverages cleared");
                        resolve(true);
                    };
                };
            });
        });
    }
}

// Create a global instance of the service
const localStorageService = new LocalStorageService();