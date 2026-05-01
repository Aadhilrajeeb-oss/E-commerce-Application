/**
 * Standardize API responses
 */
const apiResponse = {
  success: (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      error: null
    });
  },

  error: (res, message = 'Internal Server Error', statusCode = 500, errorDetails = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error: errorDetails
    });
  }
};

module.exports = apiResponse;
