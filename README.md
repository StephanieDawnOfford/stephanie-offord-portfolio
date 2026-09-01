# Stephanie Offord — Portfolio Site (Node.js / Express)

A small Express app that serves the portfolio site.

## Project structure

```
.
├── server.js          # Express server
├── package.json
└── public/
    ├── index.html      # the site
    └── resume.pdf       # downloadable résumé
```

## Run it locally

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

For auto-restart while editing, use:

```bash
npm run dev
```

## Deploying

This is a standard Express app, so it runs anywhere Node.js does — Render,
Railway, Fly.io, a VPS, etc. Just make sure the `public/` folder (with
`index.html` and `resume.pdf`) ships alongside `server.js`, and set the
`PORT` environment variable if your host requires a specific port.
