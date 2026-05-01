const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.type === 'entity.parse.failed') {
    return error(res, 'Invalid JSON payload passed', 400);
  }

  return error(res, 'Internal Server Error', 500, process.env.NODE_ENV === 'development' ? err.message : undefined);
};

module.exports = errorHandler;
