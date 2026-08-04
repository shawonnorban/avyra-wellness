/**
 * Entry point for cPanel / Passenger ("Setup Node.js App").
 *
 * Passenger boots a file, not an npm script, so `next start` cannot be used
 * there — this is the equivalent written as a plain HTTP server. It also has to
 * listen on the port Passenger hands over, not a fixed one.
 *
 * Requires Node >= 20.9 (Next 16) and a `.next` build present: run
 * `npm run build` before restarting the app.
 */
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Avyra frontend listening on ${port}`);
  });
});
