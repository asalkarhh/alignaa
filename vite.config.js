import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { getSeo, seoMeta, siteUrl, socialImage } from './src/seo.js';

const pages = JSON.parse(readFileSync(new URL('./src/pages.json', import.meta.url), 'utf8'));
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function pageHtml(html, path) {
  const seo = getSeo(path);
  const tags = seoMeta(seo).map(([attribute, key, content]) =>
    `    <meta ${attribute}="${key}" content="${escapeHtml(content)}" data-seo />`
  ).join('\n');
  const canonical = `${siteUrl}${path === '/' ? '/' : path}`;
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Alignaa',
        alternateName: ['Alignaa Aligner', 'Alignaa.in'],
        url: siteUrl,
        logo: `${siteUrl}/assets/Logo_color.png`,
        image: socialImage,
        founder: { '@id': `${siteUrl}/#praful-ozarkar` },
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#praful-ozarkar`,
        name: 'Praful Ozarkar',
        jobTitle: 'Founder',
        worksFor: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'Alignaa',
        alternateName: 'Alignaa Aligner',
        url: siteUrl,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ],
  });
  return html.replace(/\s*<meta\b[^>]*data-seo[^>]*>/g, '')
    .replace(/<html lang="[^"]*">/, `<html lang="${pages[path].lang}">`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
    .replace('</head>', `${tags}\n    <link rel="canonical" href="${canonical}" />\n    <script type="application/ld+json">${structuredData}</script>\n  </head>`);
}

function seoPages() {
  return {
    name: 'alignaa-seo-pages',
    enforce: 'post',
    transformIndexHtml(html) { return pageHtml(html, '/'); },
    generateBundle(_, bundle) {
      const index = bundle['index.html'];
      for (const path of Object.keys(pages)) {
        if (path === '/') continue;
        this.emitFile({ type: 'asset', fileName: `${path.slice(1)}index.html`, source: pageHtml(String(index.source), path) });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), seoPages()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});

