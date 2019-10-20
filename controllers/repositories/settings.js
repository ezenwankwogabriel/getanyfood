const Setting = require('../../models/setting');

const settingsActions = {
  scopeRequest: async (req, res, next) => {
    try {
      let settings = await Setting.findOne(
        {},
        'orderAcceptanceWindow availableStates updatedAt',
      );

      if (!settings) {
        settings = new Setting({
          orderAcceptanceWindow: 10,
          availableStates: [],
        });
      }

      req.systemSettings = await settings.save();

      next();
    } catch (err) {
      next(err);
    }
  },

  show: (req, res) => {
    // eslint-disable-next-line no-underscore-dangle
    delete req.systemSettings._doc._id;

    res.success(req.systemSettings);
  },

  update: async (req, res, next) => {
    const { orderAcceptanceWindow, availableStates } = req.body;

    try {
      const newSettings = await Setting.findByIdAndUpdate(
        req.systemSettings.id,
        { orderAcceptanceWindow, availableStates },
        {
          runValidators: true,
          new: true,
          select: 'orderAcceptanceWindow availableStates updatedAt',
        },
      );

      // eslint-disable-next-line no-underscore-dangle
      delete newSettings._doc._id;

      return res.success(newSettings);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = settingsActions;
