/**
 * Logger utility for LLM interactions
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Configure the log level based on environment
const currentLogLevel = process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG

export class Logger {
  private context: string
  private requestId?: string

  constructor(context: string, requestId?: string) {
    this.context = context
    this.requestId = requestId
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString()
    const requestIdStr = this.requestId ? `[${this.requestId}]` : ""
    return `${timestamp} ${level} [${this.context}]${requestIdStr}: ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= currentLogLevel
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    console.debug(this.formatMessage("DEBUG", message))
    if (data !== undefined) {
      // Redact sensitive information
      const sanitizedData = this.sanitizeData(data)
      console.debug(sanitizedData)
    }
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return

    console.info(this.formatMessage("INFO", message))
    if (data !== undefined) {
      const sanitizedData = this.sanitizeData(data)
      console.info(sanitizedData)
    }
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return

    console.warn(this.formatMessage("WARN", message))
    if (data !== undefined) {
      const sanitizedData = this.sanitizeData(data)
      console.warn(sanitizedData)
    }
  }

  error(message: string, error?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    console.error(this.formatMessage("ERROR", message))
    if (error) {
      if (error instanceof Error) {
        console.error(this.formatMessage("ERROR", `${error.name}: ${error.message}`))
        if (error.stack) {
          console.error(error.stack)
        }
      } else {
        console.error(error)
      }
    }
  }

  // Create a child logger with the same context but a different request ID
  child(requestId: string): Logger {
    return new Logger(this.context, requestId)
  }

  // Sanitize data to remove sensitive information
  private sanitizeData(data: any): any {
    if (!data) return data

    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data))

    // Redact API keys
    if (sanitized.headers && sanitized.headers.Authorization) {
      sanitized.headers.Authorization = "Bearer [REDACTED]"
    }

    // Redact other sensitive fields if needed
    return sanitized
  }
}

// Create a default logger
export const createLogger = (context: string, requestId?: string): Logger => {
  return new Logger(context, requestId)
}
