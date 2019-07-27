const { debug } = require('../utils');

class Email {
  constructor(details) {
    this.details = details;
  }

  send() {
    debug('sending email', this.details);
  }
}

module.exports = Email;
