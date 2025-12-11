# gh-contri-api

Cloudflare Worker that merges the functionality of the original `githubchart-api`, `githubchart`, and `deno-github-contributions-api` projects into a single JavaScript service. It renders a GitHub-style contribution chart as an SVG without relying on CORS proxies.

## Usage

Deploy the worker and access it with the following URL format:

```text
https://gitchart.tanjunkiat.dev/<BASE-COLOR>/<BG-COLOR>/<USER>
```

* `BASE-COLOR` and `BG-COLOR` are optional hexadecimal color strings (3 or 6 characters).
* If both are omitted, the default GitHub-like palette is used.
* Preset names `default`, `halloween`, and `teal` mirror the legacy API behavior.

The worker code lives in `gh-contri-api/src/worker.js` and renders the SVG by scraping public GitHub contribution data. Color schemes mirror the original Ruby API, including custom base/background combinations and preset palettes.

## Example charts

Below are some sample charts rendered through the worker using the `jacktan-jk` account. You can use these as references for color configuration.

### Default palette on dark background

```text
https://gitchart.tanjunkiat.dev/jacktan-jk
```

![Default palette on dark background](https://gitchart.tanjunkiat.dev/default/393937/jacktan-jk)

### Teal palette on dark background

```text
https://gitchart.tanjunkiat.dev/teal/jacktan-jk
```

![Teal palette on dark background](https://gitchart.tanjunkiat.dev/teal/393937/jacktan-jk)

### Halloween palette on dark background

```text
https://gitchart.tanjunkiat.dev/halloween/jacktan-jk
```

![Halloween palette on dark background](https://gitchart.tanjunkiat.dev/halloween/393937/jacktan-jk)

### Custom base/background colors

```text
https://gitchart.tanjunkiat.dev/978934/393937/jacktan-jk
```

![Custom colors (base 978934, bg 393937)](https://gitchart.tanjunkiat.dev/978934/393937/jacktan-jk)

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

## Credits

This project combines ideas and behavior from:

* [`githubchart-api`](https://github.com/2016rshah/githubchart-api) – original Ruby API that returns GitHub-style contribution charts as SVG.
* `githubchart` (Ruby gem) – underlying chart-generation library used by the original API.
* [`deno-github-contributions-api`](https://github.com/kawarimidoll/deno-github-contributions-api) – Deno-based API for fetching GitHub contribution data.

All trademarks and GitHub logos or styles are the property of their respective owners. This project is not affiliated with or endorsed by GitHub.
