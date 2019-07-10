const User = require('../../models/user/index');


const userActions = {
    signUp(req, res) {

    },
    signIn(req, res) {

    },
    forgotPassword(req, res) {

    },
    resetPassword(req, res) {

    }
}
const createAdmin = async function(req,res) {
    let body = req.body;
    console.log({body});
    let x = await User.createAdmin(body);
    console.log({x});
    res.unAuthorized('no details provided');
}

module.exports = createAdmin