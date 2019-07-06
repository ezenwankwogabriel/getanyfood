const passport = require('passport');
const passportJWT = require('passport-jwt');

const {secret} = require('../secret');
const JwtStrategy = passportJWT.Strategy,
    jwtOptions = {};

ExtractJwt = passportJWT.ExtractJwt;
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = secret;

if (!secret) {
    console.log('Please use startup/secret_sample.js to create your secret file')
    process.exit(1)
}

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