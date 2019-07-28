const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    timestamp(),
    myFormat,
  ),
  transports: [
    // - Write to all logs with level `info` and below to `combined.log` 
    // new winston.transports.File({ filename: 'combined.log' })
    // - Write all logs error (and below) to `error.log`.
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      myFormat,
    )
  }));
}

module.exports = logger;