/**
 * Security Audit Logging
 *
 * Logs security-relevant events for monitoring and forensics
 */

export type AuditEventType =
  | "authentication"
  | "authorization"
  | "payment"
  | "proof_generation"
  | "proof_verification"
  | "reputation_update"
  | "merchant_registration"
  | "security_violation"
  | "rate_limit_exceeded"
  | "invalid_input"
  | "error";

export interface AuditEvent {
  timestamp: number;
  type: AuditEventType;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditLogger = (event: AuditEvent) => void | Promise<void>;

/**
 * Default audit logger (console-based)
 */
export class ConsoleAuditLogger {
  log(event: AuditEvent): void {
    const logLevel =
      event.severity === "critical" || event.severity === "high"
        ? "error"
        : event.severity === "medium"
          ? "warn"
          : "info";

    const logMessage = `[AUDIT] ${new Date(event.timestamp).toISOString()} [${event.severity.toUpperCase()}] ${event.type}: ${event.message}`;

    if (event.metadata) {
      console[logLevel](logMessage, event.metadata);
    } else {
      console[logLevel](logMessage);
    }
  }
}

/**
 * Audit log manager
 */
export class AuditLogManager {
  private loggers: AuditLogger[] = [];
  private defaultLogger: AuditLogger;

  constructor(defaultLogger?: AuditLogger) {
    this.defaultLogger = defaultLogger || new ConsoleAuditLogger().log;
  }

  /**
   * Add a custom logger
   */
  addLogger(logger: AuditLogger): void {
    this.loggers.push(logger);
  }

  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    // Always use default logger
    await this.defaultLogger(event);

    // Use additional loggers
    for (const logger of this.loggers) {
      try {
        await logger(event);
      } catch (error) {
        // Don't let logger errors break the application
        console.error("Audit logger error:", error);
      }
    }
  }

  /**
   * Create and log an audit event
   */
  async createEvent(
    type: AuditEventType,
    severity: AuditEvent["severity"],
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const event: AuditEvent = {
      timestamp: Date.now(),
      type,
      severity,
      message,
      metadata,
    };

    await this.log(event);
  }
}

/**
 * Global audit log manager instance
 */
export const auditLog = new AuditLogManager();

/**
 * Helper functions for common audit events
 */
export const auditHelpers = {
  logPayment: async (
    amount: bigint,
    metadata?: Record<string, unknown>
  ) => {
    await auditLog.createEvent(
      "payment",
      "medium",
      `Payment processed: ${amount}`,
      metadata
    );
  },

  logProofGeneration: async (proofType: string, metadata?: Record<string, unknown>) => {
    await auditLog.createEvent(
      "proof_generation",
      "low",
      `Proof generated: ${proofType}`,
      metadata
    );
  },

  logSecurityViolation: async (
    violation: string,
    metadata?: Record<string, unknown>
  ) => {
    await auditLog.createEvent(
      "security_violation",
      "high",
      `Security violation: ${violation}`,
      metadata
    );
  },

  logRateLimitExceeded: async (
    identifier: string,
    metadata?: Record<string, unknown>
  ) => {
    await auditLog.createEvent(
      "rate_limit_exceeded",
      "medium",
      `Rate limit exceeded for: ${identifier}`,
      metadata
    );
  },

  logInvalidInput: async (
    inputType: string,
    metadata?: Record<string, unknown>
  ) => {
    await auditLog.createEvent(
      "invalid_input",
      "low",
      `Invalid input detected: ${inputType}`,
      metadata
    );
  },
};

