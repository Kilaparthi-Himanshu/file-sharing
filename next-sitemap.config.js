/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://blinkshare.vercel.app',
    generateRobotsTxt: true, // Will auto-generate robots.txt too, but you can skip if you already made one
    sitemapSize: 7000, // optional, only needed for huge sites
    changefreq: 'weekly',
    priority: 0.7,
    outDir: './public',
  };