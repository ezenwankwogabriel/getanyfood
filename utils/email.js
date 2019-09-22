const debug = require('debug')('app:startup');
const ejs = require('ejs');
const RootDir = require('../rootDir');
const {
  supportEmail, webHost,
} = require('../utils');

class Email {
  constructor(details) {
    this.details = details;
    this.email = process.env.getanyEmail;
    this.appName = process.env.appName;
  }

  async getContent() {
    const {
      email: to, name, subject, template, link,
    } = this.details;
    const date = new Date().toDateString();
    const ip = webHost;
    const content = await ejs.renderFile(
      `${RootDir}/views/${template}.ejs`,
      {
        to, name, subject, date, ip, link,
      },
    );
    return content;
  }

  async mailjet(content) {
    /* using mailjet */
    const { to, name, subject } = this.details;
    const privateKey = 'bf56cb4b9ce64ceaa0149b1693b68826' || process.env.MAILJET_PRIVATE_KEY;
    const publicKey = 'f5329092cf2c4b8a4ecebd3580451db3' || process.env.MAILJET_PUBLIC_KEY;
    // eslint-disable-next-line global-require
    const mailjet = require('node-mailjet').connect(publicKey, privateKey);

    try {
      await mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: this.email,
                Name: this.appName,
              },
              To: [
                {
                  Email: to,
                  Name: name,
                },
              ],
              Subject: subject,
              HTMLPart: content,
            },
          ],
        });

      return 'Email sent Successfully';
    } catch (ex) {
      throw new Error(ex);
    }
  }

  async sendMail(content) {
    /* using sendmail */
    const { to, name, subject } = this.details;
    const sendmail = require('sendmail')();
    sendmail({
      from: supportEmail,
      to,
      subject,
      html: content,
    }, (err, reply) => {
      // console.log(err + data + reply)
      if (!err) {
        return `Mail sent to ${to}`;
      }
      throw new Error(`Error sending mail to ${to}, ${err}`);
    });
  }

  async send() {
    try {
      const template = await this.getContent();
      await this.mailjet(template);
    } catch (ex) {
      debug(ex);
      throw new Error('error sending mail');
    }
  }
}

module.exports = data => new Email(data);
