const User = require('../../models/user/index');
const asyncMiddleware = require('../../middleware/asyncMiddleware');
const encryptPassword = require('../../utils/encryptPassword');


const userActions = {
    signUp: asyncMiddleware(async (req, res) => {
        const body = req.body;
        const admin = await User.findOne({
            userType: 'admin'
        })
        if (!admin && body.userType !== 'admin') return res.unAuthorized('Create an admin account to continue');
        if (admin && body.userType === 'admin') return res.unAuthorized('Admin account already exists');
        const user = await User.findOne({
            emailAddress: body.emailAddress
        });
        if (user)
            return res.unAuthorized('Account with email address exists')
        let newUser = new User({
            firstName: body.firstName,
            businessAddress: body.businessAddress,
            emailAddress: body.emailAddress,
            phoneNumber: body.phoneNumber,
            password: encryptPassword(body.password),
            userType: body.userType
        })
        await newUser.save();
        return res.success(newUser)
    }),

    signIn: asyncMiddleware(async (req, res) => {
        if (!req.user)
            return res.unAuthenticated('Invalid details provided')
        let authenticatedUser = req.user;
        authenticatedUser.updated_time = new Date();
        await authenticatedUser.save();
        let token = await authenticatedUser.encryptPayload();
        return res.success(token)
    }),

    forgotPassword(req, res) {

    },
    
    resetPassword(req, res) {

    }
}



module.exports = userActions