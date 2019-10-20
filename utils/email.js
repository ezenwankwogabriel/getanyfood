const debug = require('debug')('app:startup');
const ejs = require('ejs');
const sendmail = require('sendmail')();
const config = require('config');
const RootDir = require('../rootDir');

class Email {
  constructor(details) {
    this.details = details;
    this.email = process.env.getanySupport;
    this.appName = process.env.appName;
    this.ip = config.get('api');
  }

  async getContent() {
    const {
      email: to, template, ...rest
    } = this.details;
    const date = new Date().toDateString();
    const emailTemplate = await ejs.renderFile(`${RootDir}/views/${template}.ejs`, {
      date, ip: this.ip, link: false, to, ...rest,
    });
    return emailTemplate;
  }

  async mailjet(content) {
    /* using mailjet */
    const { email: to, name, subject } = this.details;
    const publickey = '88ebbc2d46c71d0c01e9a12a930746ce';
    const privatekey = '4083d5cd515334023063c9e8aaed3cbe';

    // eslint-disable-next-line global-require
    const mailjet = require('node-mailjet').connect(publickey, privatekey);

    try {
      await mailjet.post('send', { version: 'v3.1' }).request({
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
      debug(`Email sent Successfully to ${to}`);
    } catch (ex) {
      throw new Error(ex);
    }
  }

  async sendMail(content) {
    /* using sendmail */
    const { email: to, subject } = this.details;
    try {
      await sendmail({
        from: config.get('support'),
        to,
        subject,
        html: content,
      });
    } catch (ex) {
      throw new Error(ex);
    }
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
