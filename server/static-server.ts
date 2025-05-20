import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES modules: get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Express
const app = express();
const PORT = process.env.PORT || 5000;

// Tell it where your built frontend lives
const distPath = path.resolve(__dirname, "..", "dist", "public");

// Make sure the folder exists
if (!fs.existsSync(distPath)) {
  throw new Error(`Missing build folder at: ${distPath}`);
}

// Serve files (JS, CSS, etc.)
app.use(express.static(distPath));

// Serve index.html for everything else
app.get("*", (_, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
