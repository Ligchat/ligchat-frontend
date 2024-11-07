const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/contact',
        createProxyMiddleware({
            target: 'https://whatsapp.ligchat.com',
            changeOrigin: true,
        })
    );

    app.use(
        '/whatsapp', 
        createProxyMiddleware({
            target: 'https://whatsapp.ligchat.com',
            changeOrigin: true,
        })
    );

    app.use(
        '/server', 
        createProxyMiddleware({
            target: 'https://api.ligchat.com',
            changeOrigin: true,
        })
    );
};
