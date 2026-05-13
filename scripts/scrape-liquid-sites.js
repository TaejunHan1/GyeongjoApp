#!/usr/bin/env node

const https = require('node:https');
const { URL } = require('node:url');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const TIMEOUT_MS = 30000;

const SOURCES = [
  {
    site: 'ciga123',
    base: 'https://ciga123.co.kr',
    category: '액상',
    urls: [
      'https://ciga123.co.kr/product/list.html?cate_no=1609',
      'https://ciga123.co.kr/product/list.html?cate_no=809',
      'https://ciga123.co.kr/product/list.html?cate_no=809&page=2',
      'https://ciga123.co.kr/product/list.html?cate_no=809&page=3',
      'https://ciga123.co.kr/product/list.html?cate_no=809&page=4',
      'https://ciga123.co.kr/product/list.html?cate_no=815',
      'https://ciga123.co.kr/product/list.html?cate_no=815&page=2',
      'https://ciga123.co.kr/product/list.html?cate_no=815&page=3',
      'https://ciga123.co.kr/product/list.html?cate_no=815&page=4',
    ],
  },
  {
    site: 'medusamall',
    base: 'https://medusamall.com',
    category: '액상',
    urls: Array.from({ length: 33 }, (_, idx) =>
      `https://medusamall.com/product/list.html?cate_no=793${idx === 0 ? '' : `&page=${idx + 1}`}`,
    ),
  },
];

const cleanText = (value) =>
  value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeName = (name) =>
  cleanText(name)
    .toLowerCase()
    .replace(/[\s\-_.]+/g, ' ')
    .trim();

const dedupeByName = (items) => {
  const map = new Map();
  const ordered = [];

  for (const item of items) {
    const key = normalizeName(item.name);
    if (!key || map.has(key)) continue;
    map.set(key, true);
    ordered.push(item);
  }

  return ordered;
};

const parseMedusamall = (html, base) => {
  const products = [];
  const chunkRegex = /<li\s+id="anchorBoxId_(\d+)"[\s\S]*?<\/li>/g;

  let m;
  while ((m = chunkRegex.exec(html)) !== null) {
    const block = m[0];
    const productNo = m[1];

    const nameMatch = block.match(/<p class="name">[\s\S]*?<a[^>]*><span class="title displaynone">[\s\S]*?<\/span>\s*<span[^>]*>([\s\S]*?)<\/span><\/a>/i);
    const hrefMatch = block.match(/<a\s+href="([^"]*product_detail\.html|[^"]*product\/detail\.html[^"]*)"/i);
    const imageMatch = block.match(/<img[^>]+class=\"off\"\s+alt="([^"]+)"/i);

    const name = nameMatch ? cleanText(nameMatch[1]) : (imageMatch ? cleanText(imageMatch[1]) : '');

    if (!name) continue;

    const rawUrl = hrefMatch?.[1] || `/product/detail.html?product_no=${productNo}`;
    const url = rawUrl.startsWith('http') ? rawUrl : `${base}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

    products.push({
      site: 'medusamall',
      name,
      productNo,
      url: url.includes('http') ? url : `${base}${url}`,
      price: null,
      source: 'medusamall',
      category: '액상',
      raw: null,
    });
  }

  return products;
};

const parseGenericCafe24 = (html, base, siteName) => {
  const products = [];

  const itemRegex = /<li\s+[^>]*class="[^"]*item[^\"]*"[\s\S]*?<\/li>/g;
  const nameRegex = /<p class="name">[\s\S]*?<a[^>]*>(?:[\s\S]*?<span[^>]*>[^<]*<\/span>\s*)?<span[^>]*>([\s\S]*?)<\/span>/i;

  let m;
  while ((m = itemRegex.exec(html)) !== null) {
    const block = m[0];
    const nameMatch = block.match(nameRegex);
    const hrefMatch = block.match(/href="([^"]*product_detail\.html|[^"]*product\/detail\.html[^\"]*)"/i);
    const idMatch = block.match(/product_no=(\d+)/i);

    const name = nameMatch ? cleanText(nameMatch[1]) : '';
    if (!name) continue;

    const rawUrl = hrefMatch?.[1] || (idMatch?.[1] ? `/product/detail.html?product_no=${idMatch[1]}` : '');
    const url = rawUrl.startsWith('http') ? rawUrl : `${base}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;

    products.push({
      site: siteName,
      name,
      productNo: idMatch?.[1] || '',
      url,
      price: null,
      source: siteName,
      category: '액상',
      raw: null,
    });
  }

  return products;
};

const fetchPage = (url) => new Promise((resolve, reject) => {
  const req = https.get(
    url,
    {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': url,
      },
      timeout: TIMEOUT_MS,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => resolve(data));
    },
  );

  req.on('error', reject);
  req.on('timeout', () => req.destroy(new Error(`Timeout: ${url}`)));
});

const run = async () => {
  const results = {};
  const summary = [];

  for (const source of SOURCES) {
    const allProducts = [];

    for (const url of source.urls) {
      const html = await fetchPage(url);
      if (/회원만 접근권한이 있습니다/.test(html)) {
        summary.push({
          site: source.site,
          url,
          status: 'blocked',
          message: '회원 전용 페이지로 접근 불가',
          count: 0,
        });
        continue;
      }

      const products = source.site === 'medusamall'
        ? parseMedusamall(html, source.base)
        : parseGenericCafe24(html, source.base, source.site);

      summary.push({
        site: source.site,
        url,
        status: 'ok',
        count: products.length,
      });

      allProducts.push(...products);
    }

    const uniqueProducts = dedupeByName(allProducts);
    results[source.site] = {
      site: source.site,
      category: source.category,
      total: allProducts.length,
      unique: uniqueProducts.length,
      items: uniqueProducts,
    };

    summary.push({
      site: source.site,
      status: 'done',
      total: allProducts.length,
      unique: uniqueProducts.length,
      pages: source.urls.length,
    });
  }

  process.stdout.write(JSON.stringify({ generatedAt: new Date().toISOString(), summary, results }, null, 2));
};

run().catch((error) => {
  process.stderr.write(String(error && error.message ? error.message : error));
  process.exit(1);
});
