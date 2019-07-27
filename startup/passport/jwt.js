const passport = require('passport');
const passportJWT = require('passport-jwt');

const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {};

const { ExtractJwt } = passportJWT;
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.secret;

function jwt(User) {
  const Admin = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    User.findOne({
      _id: jwtPayload.id,
    }, (err, user) => {
      if (err)
        return next(err);
      if(!user)
       return next(null, false)
      if (user.userType === 'super_admin')
         return next(null, user)
      return next(null, false);
    });
  });

  const Auth = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
    User.findOne({
      _id: jwtPayload.id,
    }, (err, user) => {
      if (err)
        return next(err);
      if(!user)
        return next(null, false)
      if (user.status)
        return next(null, user)
      return next(null, false);
    });
  });

  passport.use('isAdmin', Admin);
  passport.use('auth', Auth);
}

module.exports = jwt;
