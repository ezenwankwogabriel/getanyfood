const winston = require('winston');
const TelegramLogger = require('winston-telegram');

// require('winston-mongodb');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: {
    service: 'user-service',
  },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: './logs/combined.log',
    }),
    // new winston.transports.MongoDB({
    //     db: 'getany_test',
    //     collection: 'logs',
    //     level: 'info',
    //     capped: true
    // })
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
const env = process.env.NODE_ENV;
if (env !== 'production' && env !== 'test') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

// If appropriate credentials provided, log errors to telegram channel
const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  logger.add(
    new TelegramLogger({
      token: TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID,
      level: 'error',
    }),
  );
}

module.exports = logger;
