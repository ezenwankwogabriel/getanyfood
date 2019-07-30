const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.secret,
};

function jwt(User) {
  const Admin = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    User.findOne(
      {
        _id: jwtPayload.id,
      },
      (err, user) => {
        if (err) return next(err);
        if (!user) return next(null, false);
        if (user.userType === 'super_admin') return next(null, user);
        return next(null, false);
      },
    );
  });

  const Merchant = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    User.findOne(
      {
        _id: jwtPayload.id,
      },
      (err, user) => {
        if (err) return next(err);
        if (!user) return next(null, false);
        if (user.userType === 'merchant') return next(null, user);
        return next(null, false);
      },
    );
  });

  const Customer = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    User.findOne(
      {
        _id: jwtPayload.id,
      },
      (err, user) => {
        if (err) return next(err);
        if (!user) return next(null, false);
        if (user.userType === 'customer') return next(null, user);
        return next(null, false);
      },
    );
  });

  const Auth = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    User.findOne(
      {
        _id: jwtPayload.id,
      },
      (err, user) => {
        if (err) return next(err);
        if (!user) return next(null, false);
        if (user.status) return next(null, user);
        return next(null, false);
      },
    );
  });

  passport.use('admin', Admin);
  passport.use('merchant', Merchant);
  passport.use('customer', Customer);
  passport.use('auth', Auth);
}

module.exports = jwt;
