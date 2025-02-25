const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    // Proxy para o serviço WhatsApp
    app.use(
        '/whatsapp',
        createProxyMiddleware({
            target: 'http://localhost:5167',
            changeOrigin: true,
            secure: false,
            logLevel: 'debug'
        })
    );

    // Proxy para o backend principal
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:5251',
            changeOrigin: true,
            secure: false,
            logLevel: 'debug'
        })
    );
};
