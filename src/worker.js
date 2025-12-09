const DAY_MS = 24 * 60 * 60 * 1000;
const CELL_SIZE = 10;
const CELL_GAP = 2;
const LEFT_PADDING = 16;
const TOP_PADDING = 32;
const COLOR_SCHEMES = {
  default: ['#eeeeee', '#d6e685', '#8cc665', '#44a340', '#1e6823'],
  halloween: ['#eeeeee', '#ffee4a', '#ffc501', '#fe9600', '#03001c'],
  teal: ['#eeeeee', '#7fffd4', '#76eec6', '#66cdaa', '#458b74'],
};

const HEX = /^[0-9a-fA-F]{6}$/;

const formatHex = (input, label) => {
  const normalized = (input || '').replace(/[^0-9a-fA-F]/g, '');
  if (normalized.length === 3) {
    return normalized
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
      .toLowerCase();
  }
  if (!HEX.test(normalized)) {
    throw new Error(`Invalid ${label} color: expected 3 or 6 hex characters.`);
  }
  return normalized.toLowerCase();
};

const darkenColor = (hexColor, amount = 0.8) => {
  const [r, g, b] = hexToRgb(hexColor);
  return rgbToHex([
    Math.round(r * amount),
    Math.round(g * amount),
    Math.round(b * amount),
  ]);
};

const lightenColor = (hexColor, amount = 0.3) => {
  const [r, g, b] = hexToRgb(hexColor);
  return rgbToHex([
    Math.min(Math.round(r + 255 * amount), 255),
    Math.min(Math.round(g + 255 * amount), 255),
    Math.min(Math.round(b + 255 * amount), 255),
  ]);
};

const hexToRgb = (hexColor) => {
  const hex = hexColor.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
};

const rgbToHex = ([r, g, b]) =>
  `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;

const buildScheme = (baseColor, backgroundColor) => {
  if (!baseColor) return COLOR_SCHEMES.default;
  const preset = COLOR_SCHEMES[baseColor];
  if (preset) return preset;

  const base = `#${formatHex(baseColor, 'base')}`;
  const background = backgroundColor
    ? `#${formatHex(backgroundColor, 'background')}`
    : '#eeeeee';

  return [
    background,
    lightenColor(base, 0.3),
    lightenColor(base, 0.2),
    base,
    darkenColor(base, 0.8),
  ];
};

const startOfWeek = (date) => {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  const diff = day * DAY_MS;
  return new Date(copy.getTime() - diff);
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

const fetchContributionData = async (username) => {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'gh-contri-api-worker',
      Accept: 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub responded with ${response.status}`);
  }

  const html = await response.text();
  const cells = [...html.matchAll(/data-date="([0-9]{4}-[0-9]{2}-[0-9]{2})"[^>]*data-level="([0-4])"/g)];
  const contributions = cells.map(([_, date, level]) => ({
    date,
    level: Number(level),
  }));

  contributions.sort((a, b) => a.date.localeCompare(b.date));

  const totalMatch = html.match(/(\d+)\s+contributions?\s+in\s+the\s+last\s+year/i);
  const totalContributions = totalMatch ? Number(totalMatch[1]) : contributions.filter((day) => day.level > 0).length;

  return { contributions, totalContributions };
};

const buildWeeks = (contributions) => {
  if (!contributions.length) return [];

  const byDate = new Map(contributions.map((entry) => [entry.date, entry]));
  const firstDate = new Date(contributions[0].date);
  const lastDate = new Date(contributions[contributions.length - 1].date);
  const start = startOfWeek(firstDate);

  const weeks = [];
  let cursor = start;

  while (cursor <= lastDate) {
    const week = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const current = addDays(cursor, offset);
      const dateKey = current.toISOString().slice(0, 10);
      week.push(byDate.get(dateKey) ?? { date: dateKey, level: 0 });
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  return weeks;
};

const renderLegend = (scheme, x, y) => {
  const labels = ['Less', 'More'];
  const blocks = scheme
    .map((color, index) =>
      `<rect x="${x + index * (CELL_SIZE + 2)}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" fill="${color}" rx="2" />`,
    )
    .join('');

  return `
    <g aria-hidden="true">
      <text x="${x - 36}" y="${y + 9}" font-size="9" font-family="'Segoe UI', Tahoma, sans-serif" fill="#FFFFFF">${labels[0]}</text>
      ${blocks}
      <text x="${x + scheme.length * (CELL_SIZE + 2) + 4}" y="${y + 9}" font-size="9" font-family="'Segoe UI', Tahoma, sans-serif" fill="#FFFFFF">${labels[1]}</text>
    </g>`;
};

const renderSvg = ({ weeks, scheme, username, totalContributions }) => {
  const graphWidth = weeks.length * (CELL_SIZE + CELL_GAP);
  const graphHeight = 7 * (CELL_SIZE + CELL_GAP);
  const width = LEFT_PADDING + graphWidth + 16;
  const height = TOP_PADDING + graphHeight + 28;

  const cells = weeks
    .map((week, weekIndex) =>
      week
        .map((day, dayIndex) => {
          const x = LEFT_PADDING + weekIndex * (CELL_SIZE + CELL_GAP);
          const y = TOP_PADDING + dayIndex * (CELL_SIZE + CELL_GAP);
          const color = scheme[day.level] ?? scheme[0];
          return `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" fill="${color}" rx="2" data-date="${day.date}" />`;
        })
        .join(''),
    )
    .join('');

  const legendX = LEFT_PADDING + graphWidth - scheme.length * (CELL_SIZE + 2) - 56;
  const legendY = TOP_PADDING + graphHeight + 12;

  const label = `${totalContributions} contributions in the last year by ${username}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
  <title>${label}</title>
  <rect width="100%" height="100%" fill="transparent" />
  <text x="${LEFT_PADDING}" y="30" font-size="18" font-family="'Segoe UI', Tahoma, sans-serif" fill="#FFFFFF">${totalContributions} contributions in the last year</text>
  ${cells}
  ${renderLegend(scheme, legendX, legendY)}
</svg>`;
};

const sendError = (message, status = 500) =>
  new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });

export default {
  async fetch(request) {
    try {
      const { pathname } = new URL(request.url);
      let parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

      if (!parts.length) {
        const usage = 'Use /<user> or /<base>/<bg>/<user> to render a chart.';
        return new Response(`${usage}\nExample: /409ba5/222222/octocat`, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      let baseColor;
      let backgroundColor;
      let username;

      if (parts.length === 1) {
        [username] = parts;
      } else if (parts.length === 2) {
        [baseColor, username] = parts;
      } else {
        [baseColor, backgroundColor, ...parts] = parts;
        username = parts.join('/');
      }

      const scheme = buildScheme(baseColor, backgroundColor);
      const { contributions, totalContributions } = await fetchContributionData(username);
      const weeks = buildWeeks(contributions);

      if (!weeks.length) {
        return sendError('No contribution data found for that user.', 404);
      }

      const svg = renderSvg({ weeks, scheme, username, totalContributions });
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (error) {
      return sendError(error.message, /Invalid .*color/.test(error.message) ? 400 : 500);
    }
  },
};
