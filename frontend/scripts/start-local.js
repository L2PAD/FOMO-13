const net = require("net");

const host = "localhost";
const port = 3001;

process.env.HOST = host;
process.env.PORT = String(port);

const probe = net.createServer();

probe.once("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`Admin dev server requires http://${host}:${port}, but port ${port} is already in use.`);
    process.exit(1);
  }

  throw error;
});

probe.once("listening", () => {
  probe.close(() => {
    require("react-scripts/scripts/start");
  });
});

probe.listen(port, host);
