module.exports = function(app) {
    app.use((req, res, next) => { //success message
        res.success = function (data) {
            this.send({
                status: true,
                data
            })
        }
        next();
    })
    app.use((req, res, next) => {
        res.unAuthenticated = function (message) {
            this.status(401).send({ //unathenticated
                status: false,
                message
            })
        }
        next();
    })
    app.use((req, res, next) => {
        res.badRequest = function (message) {
            this.status(400).send({ //bad request
                status: false,
                message
            })
        }
        next();
    })
    app.use((req, res, next) => {
        res.unAuthorized = function (message) {
            this.status(403).send({ //unauthorized
                status: false,
                message
            })
        }
        next();
    })
}