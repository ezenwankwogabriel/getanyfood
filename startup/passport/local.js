const passport = require('passport');
const LocalStrategy = require('passport-local');

function local(User) {
  const auth = function (username, password, done) {
    User.findOne({
      emailAddress: username,
    }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (!user.verifyPassword(password)) {
        return done(null, false);
      }
      return done(null, user);
    });
  };
  const localAuth = new LocalStrategy(auth);
  passport.use('local', localAuth);
}

module.exports = local;
