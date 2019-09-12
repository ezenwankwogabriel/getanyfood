const debug = require('debug')('app:startup');
const mailjet = require('node-mailjet');

class Email {
  constructor(details) {
    this.details = details;
    this.email = process.env.getanyEmail;
    this.appName = process.env.appName;
  }

  mailjet() {
    /* using mailjet */
    const {
      to, name, subject, contents,
    } = this.details;
    const privateKey = process.env.MAILJET_PRIVATE_KEY;
    const publicKey = process.env.MAILJET_PUBLIC_KEY;

    mailjet.connect(publicKey, privateKey);
    const request = mailjet
      .post('send', {
        version: 'v3.1',
      })
      .request({
        Messages: [{
          From: {
            Email: this.email,
            Name: this.appName,
          },
          To: [{
            Email: to,
            Name: name,
          }],
          Subject: subject,
          HTMLPart: contents,
        }],
      });

    /* call the request api to send email */
    request
      .then(() => {

      })
      .catch(() => {

      });
  }

  async send() {
    try {
      return this.details;
      // await this.mailjet();
    } catch (ex) {
      debug(ex);
      throw new Error('error sending mail');
    }
  }
}

module.exports = data => new Email(data);
