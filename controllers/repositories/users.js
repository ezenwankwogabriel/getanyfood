const User = require('../../models/user');

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

      next();
    } catch (err) {
      next(err);
    }
  },

  showOne: (req, res) => res.success(req.scopedUser),

  update: async (req, res, next) => {
    const {
      firstName,
      lastName,
      profilePhoto,
      phoneNumber,
      oldPassword,
      password,
    } = req.body;

    if (firstName) req.scopedUser.firstName = firstName;

    if (lastName) req.scopedUser.lastName = lastName;

    if (profilePhoto) req.scopedUser.profilePhoto = profilePhoto;

    if (phoneNumber) req.scopedUser.phoneNumber = phoneNumber;

    if (password && oldPassword) {
      if (req.scopedUser.id !== req.user.id) {
        return res.badRequest('You can only change your own password');
      }
      if (!req.scopedUser.verifyPassword(oldPassword)) {
        return res.badRequest('Enter your current password correctly');
      }
      req.scopedUser.password = password;
    }

    req.scopedUser.updated_time = new Date();

    try {
      const updatedUser = await req.scopedUser.save();
      return res.success(updatedUser);
    } catch (err) {
      next(err);
    }
  },

  updateMerchant: async (req, res, next) => {
    const {
      firstName,
      lastName,
      businessName,
      phoneNumber,
      businessAddress,
      businessDescription,
      businessImage,
      workingHours,
      businessType,
      businessCategory,
      delivery,
      location,
      bankDetails,
    } = req.body;

    try {
      await req.scopedUser.update({
        firstName,
        lastName,
        businessName,
        phoneNumber,
        businessAddress,
        businessDescription,
        businessImage,
        workingHours,
        businessType,
        businessCategory,
        delivery,
        location,
        bankDetails,
      });

      res.success(req.scopedUser);
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
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
