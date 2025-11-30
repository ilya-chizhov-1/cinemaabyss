const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const PORT = process.env.PORT;
const MONOLITH_URL = process.env.MONOLITH_URL;
const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL;
const GRADUAL_MIGRATION = process.env.GRADUAL_MIGRATION === "true";
const MOVIES_MIGRATION_PERCENT = parseInt(
  process.env.MOVIES_MIGRATION_PERCENT || "0",
  10
);

console.log(`- Gradual Migration: ${GRADUAL_MIGRATION}`);
console.log(`- Movies Migration Percent: ${MOVIES_MIGRATION_PERCENT}%`);

function shouldRouteToMicroservice() {
  if (!GRADUAL_MIGRATION) {
    return true;
  }

  const randomPercent = Math.random() * 100;

  return randomPercent < MOVIES_MIGRATION_PERCENT;
}

app.get("/health", (req, res) => {
  res.status(200).send("Proxy is healthy");
});

app.use("/api/movies", (req, res, next) => {
  const targetUrl = shouldRouteToMicroservice()
    ? MOVIES_SERVICE_URL
    : MONOLITH_URL;

  console.log(`Routing /api/movies to ${targetUrl}`);

  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path) => path,
    onError: (err, req, res) => {
      console.error("Proxy error:", err.message);
      res.status(502).json({ error: "Bad Gateway" });
    },
  })(req, res, next);
});

app.use(
  "/api",
  createProxyMiddleware({
    target: MONOLITH_URL,
    changeOrigin: true,
    pathRewrite: (path) => path,
    onError: (err, req, res) => {
      console.error("Proxy error:", err.message);
      res.status(502).json({ error: "Bad Gateway" });
    },
  })
);

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Proxy service listening on port ${PORT}`);
});
