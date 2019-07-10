module.exports = function(app) {
    app.use('/', require('../controllers/routes/auth'))
    
}