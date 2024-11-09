const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/job',  
        createProxyMiddleware({
            target: 'http://localhost:5167',
            changeOrigin: true,
            pathRewrite: { '^/job': '' } 
        })
    );

    app.use(
        '/server',
        createProxyMiddleware({
            target: 'http://localhost:5251',
            changeOrigin: true,
            pathRewrite: { '^/server': '' }
        })
    );
};
