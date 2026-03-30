import winston from 'winston';
import ChalkInstance from 'chalk';
const { combine, timestamp, label, printf } = winston.format, levelColors = {
    "info": ChalkInstance.rgb(51, 153, 255),
    "warn": ChalkInstance.rgb(255, 255, 102),
    "error": ChalkInstance.bgRedBright.whiteBright
}, myFormat = printf(({ level, message, label, timestamp }) => {
    const colorize = levelColors[level] || ((text) => text);
    return `${ChalkInstance.blue(timestamp)} [${ChalkInstance.magenta(label)}] ${colorize(level)}: ${ChalkInstance.rgb(204, 51, 153)(message)}`;
}), logger = (owner = null) => winston.createLogger({
    level: 'info',
    format: combine(label({ label: owner || '@SYSTEM' }), timestamp(), myFormat),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/warnings.log', level: 'warn' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});
export default logger;
//# sourceMappingURL=logger.js.map