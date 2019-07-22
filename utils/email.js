const {debug} = require('../utils/common');

class Email {
    constructor(details) {
        this.details = details
    }
    send() {
        debug('sending email', this.details)
    }
}

module.exports = Email;