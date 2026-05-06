export function errorHandler(err, req, res, next) {
  // 生产环境不泄露内部错误详情
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (statusCode >= 500) {
    console.error('[ERROR]', err.message || err);
    if (!isProduction) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    error: statusCode >= 500
      ? '服务器内部错误，请稍后重试'
      : (err.message || 'Unknown error'),
    code: statusCode
  });
}
