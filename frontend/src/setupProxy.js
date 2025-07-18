const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy auth API calls to auth-service (port 8080)
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: {
        '^/api/auth': '', // Remove /api/auth prefix
      },
    })
  );

  // Proxy game API calls to game-service (port 8081)
  app.use(
    '/api/game',
    createProxyMiddleware({
      target: 'http://localhost:8081',
      changeOrigin: true,
      pathRewrite: {
        '^/api/game': '', // Remove /api/game prefix
      },
    })
  );
};