import { getProjects } from '../lib/projects.js';

export async function GET() {
  const projects = await getProjects();
  const site = 'https://robinson-cursor.com';

  const items = projects.map(p => {
    const dayNum = String(p.day).padStart(3, '0');
    return `
    <item>
      <title>#${dayNum} ${p.title}</title>
      <link>${site}/projects/${p.slug}</link>
      <guid>${site}/projects/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${p.description}</description>
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>robinson-cursor.com</title>
    <link>${site}</link>
    <description>365 days of experiments — one browser experiment per day.</description>
    <language>en</language>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
