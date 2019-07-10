const mongoose = require("mongoose");
const config = require("config");

const db = config.get('database')
//  DB Connection =============================================================

module.exports = function () {
    mongoose.connect(`mongodb://localhost/${db}`, {
        useNewUrlParser: true
    }, (err) => {
        if (err) {
            console.log('database connection error', err);
        } else {
            console.log('database connection successful');
        }
    });
}