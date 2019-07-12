module.exports = function(app) {
    app.use((req, res, next) => { //success message
        res.success = function (data) {
            this.status(200).send(data)
        }
        next();
    })
    app.use((req, res, next) => {
        res.unAuthenticated = function (message) {
            this.status(401).send(message) //unanthenticated
        }
        next();
    })
    app.use((req, res, next) => {
        res.badRequest = function (message) {
            this.status(400).send(message) //bad request
        }
        next();
    })
    app.use((req, res, next) => {
        res.unAuthorized = function (message) {
            this.status(403).send(message) //unathorized
        }
        next();
    })
    app.use((req, res, next) => {
        res.notFound = function(message) {
            this.status(404).send(message)
        }
        next();
    })
}