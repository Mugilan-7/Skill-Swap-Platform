export function notFound(req, res, next) {
  const error = new Error(`Not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function statusFromError(error, currentStatus) {
  if (currentStatus && currentStatus !== 200) return currentStatus;
  if (error.status || error.statusCode) return Number(error.status || error.statusCode);
  if (error.name === "ValidationError" || error.name === "CastError") return 422;
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return 401;
  if (error.code === 11000) return 409;
  if (error.type === "entity.parse.failed") return 400;
  return 500;
}

function messageFromError(error, status) {
  if (error.code === 11000) return "A record with that unique value already exists.";
  if (error.name === "ValidationError") {
    return Object.values(error.errors || {}).map((item) => item.message).filter(Boolean).join(", ") || "Validation failed.";
  }
  if (error.name === "CastError") return "Invalid resource identifier.";
  if (error.name === "TokenExpiredError") return "Session expired. Please log in again.";
  if (error.name === "JsonWebTokenError") return "Invalid authentication token.";
  if (status >= 500) return "Server error. Please try again.";
  return error.message || "Request failed.";
}

export function errorHandler(error, _req, res, _next) {
  const status = statusFromError(error, res.statusCode);
  res.status(status).json({
    success: false,
    message: messageFromError(error, status),
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
}
