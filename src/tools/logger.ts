import { createLogger, format, level, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;
const logFormat = printf(({ level, message, timestamp}) => {
    return `${timestamp} - ${level} : ${message}`
})

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new transports.Console({
            format: combine(
                colorize(),
                timestamp(),
                logFormat
            )
        }),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
    ]
})


export default logger;