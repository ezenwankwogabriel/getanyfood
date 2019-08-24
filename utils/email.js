const debug = require('debug')('app:startup');

class Email {
  constructor(details) {
    this.details = details;
  }

  send() {
    debug('sending email', this.details);
  }
}

module.exports = data => new Email(data);
