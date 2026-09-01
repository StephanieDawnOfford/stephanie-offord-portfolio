// Stephanie Offord — portfolio site server
// A tiny Express app that serves the static site out of /public.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything in /public (index.html, resume.pdf, etc.) as static assets.
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route -> home page.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple health check — handy if you ever deploy this behind a load balancer.
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// 404 fallback for anything else.
app.use((req, res) => {
  res.status(404).send('404 — page not found');
});

app.listen(PORT, () => {
  console.log(`Stephanie's site is running at http://localhost:${PORT}`);
});
