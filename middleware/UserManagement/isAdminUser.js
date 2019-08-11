const isAdmin = function(req, res, next) {
        if(req.user.userType === 'super_admin' || req.user.userType === 'sub_admin') 
            return next();
        return res.unAuthorized();
}

module.exports = isAdmin;