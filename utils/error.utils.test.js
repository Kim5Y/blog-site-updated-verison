import ApiError from "./error.utils.js";

// Mock the Express response object
const mockResponse = () => {
  const res = {};
  // Mock res.status to return `res` for chaining, e.g., res.status(500).json(...)
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("ApiError Utility", () => {
  let res;

  // Reset the mock response object before each test
  beforeEach(() => {
    res = mockResponse();
  });

  test("should send a default 500 error if no parameters are provided", () => {
    new ApiError(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "something went wrong",
    });
  });

  test("should send an error with a custom status code and message", () => {
    new ApiError(res, {
      statuscode: 404,
      message: "Resource not found",
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Resource not found",
    });
  });

  test("should normalize a standard Error object", () => {
    const originalError = new Error("Database connection failed");
    originalError.name = "DBError";

    new ApiError(
      res,
      {
        statuscode: 503,
        message: "This will be overridden",
      },
      originalError
    );

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      name: "DBError",
      message: "Database connection failed",
      statuscode: 503,
    });
  });

  test("should use the custom message if the passed error has no message", () => {
    const errorWithoutMessage = new Error(); // Error with an empty message

    new ApiError(
      res,
      {
        statuscode: 400,
        message: "Bad Request",
      },
      errorWithoutMessage
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Bad Request" }));
  });
});
