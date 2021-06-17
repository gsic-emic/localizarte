const winston = require('winston');

const miformato = winston.format.printf(({level, message, timestamp}) => {return `${timestamp} [${level}] ${message}`;});


const logger = winston.createLogger({
    transports: [
        new winston.transports.File(
            { 
                filename: './log/error.log', 
                level: 'error' 
            }),
        new winston.transports.File(
            { 
                filename: './log/acciones.log',
                level: 'info',
                json: true,
                maxSize: 1000000,
                maxFiles: 10
            }),
        new winston.transports.File(
            { 
                filename: './log/peticiones.log', 
                level: 'http',
                json: false
            })
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