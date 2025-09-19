export const CONFIG = {
  RATE_LIMITING: {
    CALLS_PER_HOUR: parseInt(process.env.RATE_LIMIT_CALLS_PER_HOUR || '10'),
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000')
  },
  LIMITS: {
    MAX_METADATA_SIZE: parseInt(process.env.MAX_METADATA_SIZE_BYTES || '1024'),
    MAX_WIDGETS_PER_USER: parseInt(process.env.MAX_WIDGETS_PER_USER || '10'),
    MAX_WIDGET_NAME_LENGTH: parseInt(process.env.MAX_WIDGET_NAME_LENGTH || '100')
  },
  SECURITY: {
    ALLOWED_DEV_DOMAINS: process.env.ALLOWED_DEV_DOMAINS?.split(',') || ['localhost'],
    RETELL_TIMEOUT_MS: parseInt(process.env.RETELL_API_TIMEOUT_MS || '10000')
  }
};