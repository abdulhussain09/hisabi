const PLAN_HIERARCHY = { free: 0, gold: 1, premium: 2 };

const PLAN_LIMITS = {
    free: {
        invoicesPerMonth: 50,
        maxProducts: 100,
        maxStaff: 1,
        historyMonths: 6,
        features: {
            customPdfLogo: false,
            advancedAnalytics: false,
            multipleLocations: false,
            reports: true,
            suppliers: true,
            purchases: true,
            endOfDay: true,
            discountCodes: true,
            salesTargets: true,
            prioritySupport: false,
            customBranding: false,
        }
    },
    gold: {
        invoicesPerMonth: 500,
        maxProducts: Infinity,
        maxStaff: 3,
        historyMonths: 24,
        features: {
            customPdfLogo: true,
            advancedAnalytics: false,
            multipleLocations: false,
            reports: true,
            suppliers: true,
            purchases: true,
            endOfDay: true,
            discountCodes: true,
            salesTargets: true,
            prioritySupport: true,
            customBranding: false,
        }
    },
    premium: {
        invoicesPerMonth: Infinity,
        maxProducts: Infinity,
        maxStaff: Infinity,
        historyMonths: Infinity,
        features: {
            customPdfLogo: true,
            advancedAnalytics: true,
            multipleLocations: true,
            reports: true,
            suppliers: true,
            purchases: true,
            endOfDay: true,
            discountCodes: true,
            salesTargets: true,
            prioritySupport: true,
            customBranding: true,
        }
    }
};

const getPlanLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free;

module.exports = {
    PLAN_HIERARCHY,
    PLAN_LIMITS,
    getPlanLimits
};
