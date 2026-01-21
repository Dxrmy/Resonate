/**
 * Integration Service
 * 
 * Abstraction layer for external data sources (Calendar, Health).
 * Currently uses SIMULATED data to demonstrate AI correlations immediately.
 * 
 * Future: Replace mock calls with real Google Node.js Client API calls.
 */

// Simulated Data Scenarios
const MOCK_CALENDAR_EVENTS = [
    { title: "Meeting with Boss", type: "stressor" },
    { title: "Project Deadline", type: "stressor" },
    { title: "Coffee with Friend", type: "uplift" },
    { title: "Deep Work Block", type: "neutral" }
];

const MOCK_HEALTH_DATA = {
    steps: 8500,
    sleepHours: 5.5, // Intentionally low to trigger "low sleep" correlation
    hrv: 42 // Low HRV = High Stress
};

export const IntegrationService = {

    // 1. Calendar Integration
    getTodayEvents: async () => {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return a random set of events for variety, or fixed for demo
        // For distinct correlation, let's return a Stressor today
        return [
            { id: 1, title: "Team Sync", time: "10:00 AM" },
            { id: 2, title: "Performance Review", time: "2:00 PM" } // The trigger
        ];
    },

    // 2. Health/Fit Integration
    getTodayHealth: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            steps: 3200, // Low movement
            sleep: 5.2,  // Low sleep
            restingHeartRate: 78 // Slightly elevated
        };
    },

    // 3. Sync Status
    isConnected: () => {
        return { calendar: true, health: true }; // Pretend we are connected
    }
};
