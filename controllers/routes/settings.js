const { Router } = require('express');
const passport = require('passport');
const Setting = require('../../models/setting');

const router = new Router();

const getSystemSettings = async (req, res, next) => {
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
};

const authJWT = passport.authenticate('admin', { session: false });
router.use(authJWT, getSystemSettings);

router.get('/', async (req, res) => {
  res.success(req.systemSettings);
});

router.patch('/', async (req, res) => {
  const {
    servicePercentage,
    orderAcceptanceWindow,
    deliveryCharge,
    availableStates,
  } = req.body;

  if (servicePercentage) {
    req.systemSettings.servicePercentage = servicePercentage;
  }

  if (orderAcceptanceWindow) {
    req.systemSettings.orderAcceptanceWindow = orderAcceptanceWindow;
  }

  if (deliveryCharge) {
    req.systemSettings.deliveryCharge = deliveryCharge;
  }

  if (availableStates) {
    req.systemSettings.availableStates = availableStates;
  }

  req.systemSettings.updated_time = new Date();

  const newSettings = await req.systemSettings.save();

  return res.success(newSettings);
});

module.exports = router;
