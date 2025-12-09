# gh-contri-api

Cloudflare Worker that merges the functionality of the original `githubchart-api`, `githubchart`, and `deno-github-contributions-api` projects into a single JavaScript service. It renders a GitHub-style contribution chart as an SVG without relying on CORS proxies.
*http://127.0.0.1:8787/978934/393937/jacktan-jk
## Usage

Deploy the worker and access it with the following URL format:

```
https://ghchart.<worker>.dev/<BASE-COLOR>/<BG-COLOR>/<USER>
```

- `BASE-COLOR` and `BG-COLOR` are optional hexadecimal color strings (3 or 6 characters). If omitted, the default GitHub palette is used.
- Preset names `default`, `halloween`, and `teal` match the legacy API behavior.
- Example: `https://ghchart.example.dev/409ba5/222222/octocat`

## Development

1. Install dependencies

```bash
cd gh-contri-api
npm install
```

2. Validate the worker syntax

```bash
npm run check
```

3. Deploy with Wrangler (requires a Cloudflare account and authentication)

```bash
wrangler publish
```

The worker code lives in `gh-contri-api/src/worker.js` and renders the SVG by scraping public GitHub contribution data. Color schemes mirror the original Ruby API, including custom base/background combinations and preset palettes.
