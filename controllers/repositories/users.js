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

      res.success(merchants);
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

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.scopedUser.id,
        {
          ...req.body,
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
};

module.exports = userActions;
