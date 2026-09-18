export class DalValidationError extends Error {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "DalValidationError";
    this.field = field;
  }
}

export class DalNotFoundError extends Error {
  constructor(message = "Activity configuration not found.") {
    super(message);
    this.name = "DalNotFoundError";
  }
}
