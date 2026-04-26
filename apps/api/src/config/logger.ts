/* eslint-disable no-console */
const timestamp = () => new Date().toISOString();

const logger = {
  info: (msg: string) => console.log(`[${timestamp()}] INFO  ${msg}`),
  warn: (msg: string) => console.warn(`[${timestamp()}] WARN  ${msg}`),
  error: (msg: string, err?: unknown) => console.error(`[${timestamp()}] ERROR ${msg}`, err ?? ''),
};

export default logger;
