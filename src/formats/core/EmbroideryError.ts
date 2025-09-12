type ErrorCode = "BUFFER_UNDEFINED";
export class EmbroideryError extends Error {
  public readonly code: ErrorCode;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor({ message, code, context }: { message: string; code: ErrorCode; context?: Record<string, unknown> }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}
