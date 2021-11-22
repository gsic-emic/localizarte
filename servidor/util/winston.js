const winston = require('winston');
const { combine, timestamp } = winston.format;

const miformato = winston.format.printf(({ level, message, timestamp }) => { return `[[${level}]] || ${timestamp} || ${message}`; });


const logger = winston.createLogger({
    format: combine(
        timestamp(),
        miformato
    ),
    transports: [
        new winston.transports.File(
            {
                filename: './log/acciones2.log',
                level: 'debug',
                maxsize: 20971520,
            }),
    ],
    exitOnError: false,
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'exceptions.log'
        })
    ],
});

/*if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
        level: 'silly'
    }));
}*/

module.exports = logger;