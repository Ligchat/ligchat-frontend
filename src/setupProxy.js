const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    // Proxy para o serviço WhatsApp
    app.use(
        '/whatsapp',
        createProxyMiddleware({
            target: 'https://whatsapp.ligchat.com',
            changeOrigin: true,
            secure: false,
            logLevel: 'debug'
        })
    );

    // Proxy para o backend principal
    app.use( 
        '/api',
        createProxyMiddleware({
            target: 'https://api.ligchat.com',
            changeOrigin: true,
            secure: false,
            logLevel: 'debug'
        })
    );
};
