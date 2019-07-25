const { Router } = require('express');
const passport = require('passport');
const User = require('../../models/user/index');
const encryptPassword = require('../../utils/encryptPassword');

const router = new Router();

const getScopedUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      userType: 'super_admin',
      deleted: 0,
    });

    if (!user) {
      return res.status(404).send();
    }

    req.scopedUser = user;

    next();
  } catch (err) {
    next(err);
  }
};

const authJWT = passport.authenticate('admin', { session: false });
router.use('/:id', authJWT, getScopedUser);
router.get('/:id', (req, res) => {
  req.scopedUser.password = undefined;
  return res.success(req.scopedUser);
});

router.patch('/:id', async (req, res) => {
  const { firstName, lastName, profilePhoto, oldPassword, password } = req.body;

  if (firstName) req.scopedUser.firstName = firstName;

  if (lastName) req.scopedUser.lastName = lastName;

  if (profilePhoto) req.scopedUser.profilePhoto = profilePhoto;

  if (password && oldPassword) {
    if (req.scopedUser.id !== req.user.id)
      return res.badRequest('You can only change your own password');

    if (!req.scopedUser.verifyPassword(oldPassword))
      return res.badRequest('Enter your current password correctly');

    req.scopedUser.password = encryptPassword(password);
  }

  req.scopedUser.updated_time = new Date();

  await req.scopedUser.save();

  return res.success(req.scopedUser);
});

module.exports = router;
