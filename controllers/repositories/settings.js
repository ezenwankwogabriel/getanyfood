const Setting = require('../../models/setting');

const settingsActions = {
    scopeRequest: async (req, res, next) => {
        try {
            let settings = await Setting.findOne();

            if (!settings) {
                settings = new Setting({
                    servicePercentage: 10,
                    orderAcceptanceWindow: 600,
                    deliveryCharge: 500,
                    availableStates: ['Lagos'],
                });
            }

            req.systemSettings = await settings.save();

            next();
        } catch (err) {
            next(err);
        }
    },

    show: (req, res) => {
        return res.success(req.systemSettings);
    },

    update: async (req, res, next) => {
        const {
            servicePercentage,
            orderAcceptanceWindow,
            deliveryCharge,
            availableStates,
        } = req.body;

        if (servicePercentage)
            req.systemSettings.servicePercentage = servicePercentage;

        if (orderAcceptanceWindow)
            req.systemSettings.orderAcceptanceWindow = orderAcceptanceWindow;

        if (deliveryCharge) req.systemSettings.deliveryCharge = deliveryCharge;

        if (availableStates)
            req.systemSettings.availableStates = availableStates;

        req.systemSettings.updated_time = new Date();

        try {
            const newSettings = await req.systemSettings.save();

            return res.success(newSettings);
        } catch (err) {
            next(err);
        }
    },
};

module.exports = settingsActions;
