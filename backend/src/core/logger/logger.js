/**
 * Structured Logger with Secret Sanitization
 */

const SENSITIVE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9_\-\.]+/gi,
  /key=[A-Za-z0-9_\-\.]+/gi,
  /api[_-]?key["':\s]+["']?([A-Za-z0-9_\-\.]{8,})["']?/gi,
  /secret["':\s]+["']?([A-Za-z0-9_\-\.]{8,})["']?/gi,
];

export const sanitizeLog = (message, meta) => {
  let cleanMsg = typeof message === 'string' ? message : JSON.stringify(message);
  for (const pattern of SENSITIVE_PATTERNS) {
    cleanMsg = cleanMsg.replace(pattern, '[REDACTED_SECRET]');
  }

  let cleanMeta = meta;
  if (meta && typeof meta === 'object') {
    cleanMeta = JSON.parse(JSON.stringify(meta));
    const redactObj = (obj) => {
      for (const k of Object.keys(obj)) {
        if (
          k.toLowerCase().includes('key') ||
          k.toLowerCase().includes('secret') ||
          k.toLowerCase().includes('auth') ||
          k.toLowerCase().includes('token')
        ) {
          obj[k] = '[REDACTED]';
        } else if (obj[k] && typeof obj[k] === 'object') {
          redactObj(obj[k]);
        }
      }
    };
    redactObj(cleanMeta);
  }

  return { cleanMsg, cleanMeta };
};

export const logger = {
  info: (msg, meta) => {
    const { cleanMsg, cleanMeta } = sanitizeLog(msg, meta);
    console.log(`[${new Date().toISOString()}] [INFO] ${cleanMsg}`, cleanMeta ? JSON.stringify(cleanMeta) : '');
  },
  warn: (msg, meta) => {
    const { cleanMsg, cleanMeta } = sanitizeLog(msg, meta);
    console.warn(`[${new Date().toISOString()}] [WARN] ${cleanMsg}`, cleanMeta ? JSON.stringify(cleanMeta) : '');
  },
  error: (msg, meta) => {
    const { cleanMsg, cleanMeta } = sanitizeLog(msg, meta);
    console.error(`[${new Date().toISOString()}] [ERROR] ${cleanMsg}`, cleanMeta ? JSON.stringify(cleanMeta) : '');
  },
  debug: (msg, meta) => {
    if (process.env.DEBUG || process.env.NODE_ENV !== 'production') {
      const { cleanMsg, cleanMeta } = sanitizeLog(msg, meta);
      console.log(`[${new Date().toISOString()}] [DEBUG] ${cleanMsg}`, cleanMeta ? JSON.stringify(cleanMeta) : '');
    }
  },
};

export default logger;
