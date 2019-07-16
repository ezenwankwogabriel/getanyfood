module.exports = function (handler) {
    return async (req, res, next) => {
        try {
            handler(req, res);
        } catch(ex){
            console.log("hot here ooo", ex)
            next(ex)
        }
    }
}