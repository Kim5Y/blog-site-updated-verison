const sendResponse = (
  res,
  {
    statusCodes = 200,
    success = true,
    message = "Request successful",
    data = null,
    meta = null,
  } = {}
) => {
  const response = { success, message, data };
  return res.status(statusCodes).json(response, ...(meta && { meta }));
};
export default sendResponse;
