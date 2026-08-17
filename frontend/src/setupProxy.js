/**
 * CRA dev-server proxy.
 *
 * Goal (single exposed port 3000):
 *   /            -> public FOMO website  (Next.js, http://localhost:3001)
 *   /admin, /admin/*  -> this admin panel (served under PUBLIC_URL=/admin)
 *
 * The admin CRA is served under /admin (see "homepage": "/admin" in package.json),
 * so all its assets live under /admin/*. Everything else is reverse-proxied to the
 * public website. /api/* never reaches here (ingress routes it straight to backend).
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

const WEBSITE_TARGET = process.env.WEBSITE_PROXY_TARGET || 'http://localhost:3001';

// Requests that must stay on the admin CRA dev server (not proxied to the website).
const isAdminOwned = (pathname) =>
  pathname === '/admin' ||
  pathname.startsWith('/admin/') ||
  pathname.startsWith('/ws') || // webpack-dev-server HMR websocket
  pathname.startsWith('/sockjs-node');

module.exports = function (app) {
  app.use(
    createProxyMiddleware((pathname) => !isAdminOwned(pathname), {
      target: WEBSITE_TARGET,
      changeOrigin: true,
      ws: true,
      logLevel: 'warn',
      // Graceful fallback: if the public website (Next.js on 3001) is not running
      // yet (e.g. its source has not been cloned in this environment), don't return
      // a raw 502/504 at the preview root — send visitors to the admin panel instead.
      onError: (err, req, res) => {
        try {
          if (res && res.writeHead && !res.headersSent) {
            res.writeHead(302, { Location: '/admin' });
            res.end();
          }
        } catch (_) {
          /* noop */
        }
      },
    })
  );
};
