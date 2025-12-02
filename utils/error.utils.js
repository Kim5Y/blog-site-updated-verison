class ApiError extends Error {
  constructor(
    res,
    {
      statuscode = 500,
      message = "something went wrong",
      errors = {},
      stack = null,
    } = {},
    err,
  ) {
    super(message);
    this.statuscode = statuscode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
    console.log("out side error", err);
    const normalizeError = () => {
      if (!err) return{
        success:this.success,
        message: this.message
      };
      if (err instanceof Error) {
        const { name, message, stack, cause, ...rest } = err;
        const errMessage = message? message: this.message;
        return {success: this.success,name, message: errMessage, statuscode: statuscode }
      }
    };
    console.log(normalizeError());
    return res.status(statuscode).json(normalizeError());
  }
}
export default ApiError;
