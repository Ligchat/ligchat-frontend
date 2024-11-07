const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/contact',  // Isso deve corresponder à rota que está funcionando no backend
        createProxyMiddleware({
            target: 'https://whatsapp.ligchat.com',  // Porta correta do backend
            changeOrigin: true,
        })
    );

    app.use(
        '/whatsapp',  // Isso deve corresponder à rota que está funcionando no backend
        createProxyMiddleware({
            target: 'https://whatsapp.ligchat.com',  // Porta correta do backend
            changeOrigin: true,
        })
    );

    app.use(
        '/api', 
        createProxyMiddleware({
            target: 'https://api.ligchat.com',  // Porta correta do backend
            changeOrigin: true,
        })
    );
};
