const { DateTime } = require('luxon');
const { groupBy } = require('lodash');
const User = require('../../models/user');
const utils = require('../../utils');

const userActions = {
  scopeRequest: (userType, password = false) => async (req, res, next) => {
    try {
      const user = await User.findOne(
        {
          _id: req.params.id,
          userType,
          deleted: 0,
        },
        `${password ? '' : '-password'} -deleted`,
      );

      if (!user) return res.status(404).send('This user does not exist');

      req.scopedUser = user;

      return next();
    } catch (err) {
      return next(err);
    }
  },

  async showAllMerchants(req, res, next) {
    try {
      const queryOptions = {
        userType: { $in: ['merchant', 'sub_merchant'] },
        deleted: 0,
      };

      const merchants = await utils.PaginateRequest(req, queryOptions, User);
      const ratedMerchants = await Promise.all(
        merchants.map(async (merchant) => {
          // eslint-disable-next-line no-underscore-dangle,no-param-reassign
          merchant._doc.rating = await merchant.getMerchantRating();
          return merchant;
        }),
      );

      res.success(ratedMerchants);
    } catch (err) {
      next(err);
    }
  },

  async showAllCustomers(req, res, next) {
    try {
      const queryOptions = {
        userType: 'customer',
        deleted: 0,
      };

      const customers = await utils.PaginateRequest(req, queryOptions, User);

      res.success(customers);
    } catch (err) {
      next(err);
    }
  },

  async showOne(req, res) {
    if (req.scopedUser.userType === 'merchant') {
      // eslint-disable-next-line no-underscore-dangle
      req.scopedUser._doc.rating = await req.scopedUser.getMerchantRating();
    }

    res.success(req.scopedUser);
  },

  async update(req, res, next) {
    if (req.user.id !== req.scopedUser.id) {
      return res.badRequest('You can only update your own profile.');
    }

    const { oldPassword, password } = req.body;

    if (password && !req.scopedUser.verifyPassword(oldPassword)) {
      return res.badRequest('Enter your current password correctly');
    }

    const data = {};
    Object.keys(req.body)
      .filter((key) => {
        const nonEmptyField = !!req.body[key];
        const validField = [
          'firstName',
          'lastName',
          'businessName',
          'businessDescription',
          'businessAddress',
          'businessCategory',
          'emailAddress',
          'phoneNumber',
          'location',
          'delivery',
          'bankDetails',
          'password',
          'profilePhoto',
          'profileThumbnail',
          'businessDays',
          'workingHours',
          'businessType',
        ].includes(key);
        const nameField = ['lastName'].includes(key);
        return validField && (nonEmptyField || nameField);
      })
      .map((key) => {
        data[key] = req.body[key];
        return key;
      });

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.scopedUser.id,
        {
          ...data,
          updated_time: new Date(),
        },
        { new: true, select: '-password -deleted' },
      );
      return res.success(updatedUser);
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    const { password } = req.body;

    try {
      if (req.scopedUser.verifyPassword(password)) {
        await req.scopedUser.remove();
      }
      res.success();
    } catch (err) {
      next(err);
    }
  },

  async signupStats(req, res, next) {
    try {
      const [merchants, customers] = await Promise.all([
        User.countDocuments({
          userType: 'merchant',
        }),
        User.countDocuments({
          userType: 'customer',
        }),
      ]);

      res.success({ merchants, customers });
    } catch (err) {
      next(err);
    }
  },

  async signupGrowthStats(req, res, next) {
    try {
      const users = await User.find({
        userType: { $in: ['merchant', 'customer'] },
      });
      const refinedUsers = users.map((user) => {
        const { month, year } = DateTime.fromJSDate(user.created_time);
        return {
          userType: user.userType,
          month,
          year,
          period: `${year}${month}`,
        };
      });
      const groupedUsers = groupBy(refinedUsers, 'userType');
      const stats = {};

      Object.keys(groupedUsers).map((userType) => {
        const group = groupedUsers[userType];
        const usersByPeriod = groupBy(group, 'period');
        const periodStats = Object.keys(usersByPeriod).map(period => usersByPeriod[period].reduce(
          ({ signups: total }, { month, year }) => ({
            month,
            year,
            signups: total + 1,
          }),
          { signups: 0 },
        ));

        stats[userType] = periodStats;
        return true;
      });

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userActions;
