
import winston from 'winston';
import ChalkInstance from 'chalk';

type ChalkLevelType = "info" | "warn" | "error";
type ChalkLevelInstances = { [K in ChalkLevelType]: typeof ChalkInstance };

const
  { combine, timestamp, label, printf } = winston.format,

  levelColors: ChalkLevelInstances = {
    "info": ChalkInstance.rgb(51, 153, 255),
    "warn": ChalkInstance.rgb(255, 255, 102),
    "error": ChalkInstance.bgRedBright.whiteBright
  },
  myFormat = printf(({ level, message, label, timestamp }) => {
    const colorize = levelColors[level as ChalkLevelType] || ((text: ChalkLevelType) => text);
    return `${ChalkInstance.blue(timestamp)} [${ChalkInstance.magenta(label)}] ${colorize(level)}: ${ChalkInstance.rgb(204, 51, 153)(message)}`;
  }),

  logger = (owner: string | null = null) => winston.createLogger({
    level: 'info',
    format: combine(
      label({ label: owner || '@SYSTEM' }),
      timestamp(),
      myFormat
    ),

    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/warnings.log', level: 'warn' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ]
  });
export default logger;
