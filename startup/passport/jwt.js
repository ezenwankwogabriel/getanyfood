const passport = require('passport');
const passportJWT = require('passport-jwt');

const JwtStrategy = passportJWT.Strategy,
    jwtOptions = {};

ExtractJwt = passportJWT.ExtractJwt;
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.secret;

module.exports = function (User) {
    let Admin = new JwtStrategy(jwtOptions, (jwtPayload, next) => {
        User.findOne({
            _id: jwtPayload.id
        }, (err, users) => {
            if (users.permission === 1 || users.permission === 3) {
                next(null, users);
            } else {
                next(null, false);
            }
        });
    })

    passport.use('admin', Admin);
}