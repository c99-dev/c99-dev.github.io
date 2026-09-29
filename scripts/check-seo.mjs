import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const build = resolve('build');
const canonical = 'https://aram.c99-dev.com/';
const document = new JSDOM(readFileSync(resolve(build, 'index.html'), 'utf8')).window.document;
const head = document.head;

function content(selector) {
  const elements = head.querySelectorAll(selector);
  assert.equal(elements.length, 1, `메타데이터는 하나만 필요합니다: ${selector}`);
  const value = elements[0].getAttribute('content');
  assert.ok(value?.trim(), `비어 있는 메타데이터입니다: ${selector}`);
  return value;
}

function pngSize(url) {
  const asset = new URL(url, canonical);
  assert.equal(asset.origin, new URL(canonical).origin, '이미지는 운영 도메인에 있어야 합니다.');
  const file = readFileSync(resolve(build, `.${asset.pathname}`));
  assert.ok(file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), '실제 PNG 파일이 아닙니다.');
  return [file.readUInt32BE(16), file.readUInt32BE(20)];
}

assert.equal(document.documentElement.lang, 'ko-KR', '문서 언어가 올바르지 않습니다.');
assert.equal(head.querySelectorAll('title').length, 1, '페이지 제목이 중복되거나 없습니다.');
assert.ok(document.title.trim(), '페이지 제목이 비어 있습니다.');
assert.equal(head.querySelectorAll('link[rel="canonical"]').length, 1, '대표 주소가 중복되거나 없습니다.');
assert.equal(head.querySelector('link[rel="canonical"]').getAttribute('href'), canonical, '대표 주소가 다릅니다.');
content('meta[name="description"]');
assert.doesNotMatch(content('meta[name="robots"]'), /noindex|none/i, '운영 페이지의 색인이 차단됐습니다.');
assert.equal(content('meta[property="og:url"]'), canonical, '공유 주소가 대표 주소와 다릅니다.');
assert.equal(content('meta[property="og:title"]'), document.title, '검색 제목과 공유 제목이 다릅니다.');
assert.equal(content('meta[name="twitter:title"]'), document.title, '검색 제목과 카드 제목이 다릅니다.');
assert.equal(content('meta[property="og:description"]'), content('meta[name="twitter:description"]'), '공유 설명이 다릅니다.');
assert.equal(content('meta[property="og:locale"]'), 'ko_KR', '공유 언어가 다릅니다.');
assert.equal(content('meta[property="og:image:type"]'), 'image/png', '공유 이미지 형식이 다릅니다.');
assert.equal(content('meta[name="twitter:card"]'), 'summary_large_image', '공유 카드 형식이 다릅니다.');
const image = content('meta[property="og:image"]');
assert.ok(image.startsWith(canonical), '공유 이미지는 절대 URL이어야 합니다.');
assert.equal(content('meta[name="twitter:image"]'), image, '공유 카드 이미지가 다릅니다.');
content('meta[property="og:image:alt"]');
content('meta[name="twitter:image:alt"]');
assert.deepEqual(pngSize(image), [
  Number(content('meta[property="og:image:width"]')),
  Number(content('meta[property="og:image:height"]')),
], '공유 이미지의 실제 크기가 선언과 다릅니다.');

const data = JSON.parse(head.querySelector('script[type="application/ld+json"]').textContent);
assert.equal(data['@context'], 'https://schema.org', '구조화 데이터 형식이 다릅니다.');
const nodes = data['@graph'];
for (const type of ['WebSite', 'WebPage', 'WebApplication']) {
  const matches = nodes.filter(node => node['@type'] === type);
  assert.equal(matches.length, 1, `구조화 데이터가 중복되거나 없습니다: ${type}`);
  assert.equal(matches[0].url, canonical, `구조화 데이터 URL이 다릅니다: ${type}`);
  assert.equal(matches[0].inLanguage, 'ko-KR', `구조화 데이터 언어가 다릅니다: ${type}`);
}
const site = nodes.find(node => node['@type'] === 'WebSite');
const page = nodes.find(node => node['@type'] === 'WebPage');
const app = nodes.find(node => node['@type'] === 'WebApplication');
assert.equal(site.name, content('meta[property="og:site_name"]'), '사이트 이름이 일치하지 않습니다.');
assert.equal(app.name, site.name, '앱 이름이 사이트 이름과 다릅니다.');
assert.equal(page.name, document.title, '구조화 데이터의 제목이 다릅니다.');
assert.equal(page.isPartOf['@id'], site['@id'], '페이지와 사이트 연결이 잘못됐습니다.');
assert.equal(page.mainEntity['@id'], app['@id'], '페이지와 앱 연결이 잘못됐습니다.');
assert.equal(page.primaryImageOfPage.url, image, '구조화 데이터 이미지가 다릅니다.');

const icon = head.querySelector('link[rel="icon"]');
assert.equal(icon.type, 'image/png', '파비콘 형식이 다릅니다.');
assert.equal(icon.getAttribute('sizes'), pngSize(icon.getAttribute('href')).join('x'), '파비콘 크기가 잘못 선언됐습니다.');
const manifest = JSON.parse(readFileSync(resolve(build, 'manifest.json'), 'utf8'));
for (const entry of manifest.icons) {
  assert.equal(entry.type, 'image/png', '앱 아이콘 형식이 다릅니다.');
  assert.equal(entry.sizes, pngSize(entry.src).join('x'), '앱 아이콘 크기가 잘못 선언됐습니다.');
}
const robots = readFileSync(resolve(build, 'robots.txt'), 'utf8');
assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m, '사이트 전체 크롤링이 차단됐습니다.');
assert.ok(robots.includes(`Sitemap: ${canonical}sitemap.xml`), 'robots.txt의 사이트맵 주소가 다릅니다.');
const sitemap = new JSDOM(readFileSync(resolve(build, 'sitemap.xml'), 'utf8'), { contentType: 'application/xml' }).window.document;
const urls = [...sitemap.querySelectorAll('loc')].map(node => node.textContent.trim());
assert.ok(urls.includes(canonical), '사이트맵에 대표 주소가 없습니다.');
assert.ok(urls.every(url => url.startsWith(canonical)), '사이트맵에 다른 도메인이 포함됐습니다.');

console.log('SEO 검증 완료: 대표 주소, 검색·공유 메타데이터, 구조화 데이터, PNG 크기, 아이콘, 사이트맵');
