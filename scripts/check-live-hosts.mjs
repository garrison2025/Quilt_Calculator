/**
 * Read-only, release-blocking audit for the real Quilt Cut Planner production host.
 * Run only after the owner has approved a custom domain and deployed an
 * explicitly indexable build. No deploy, DNS change, or indexing is performed.
 *
 * node scripts/check-live-hosts.mjs --production=https://approved-domain.com
 * node scripts/check-live-hosts.mjs --self-test
 */
import assert from 'node:assert/strict';

const PREVIEW = 'https://quilt-calculator-566.pages.dev';
const approvedPaths = [
  '/', '/calculators/', '/quilt-backing-calculator/', '/quilt-binding-calculator/',
  '/quilt-border-calculator/', '/fabric-yardage-calculator/', '/quilt-fabric-calculator/',
  '/fabric-yards-to-inches/', '/quilt-batting-calculator/', '/quilt-sashing-calculator/'
];
const supportPaths = ['/about/', '/privacy/'];
const indexedPaths = [...approvedPaths, ...supportPaths];
const holdPaths = [
  '/lab/square-in-square/', '/lab/individual-bias-strips/',
  '/lab/continuous-bias-tube/', '/lab/continuous-bias-planner/',
  '/lab/continuous-bias-physical/', '/qa/print-calibration/',
  '/qa/fabric-cutting/', '/qa/2x2-measurement-sheet/'
];

export function parseProductionOrigin(input) {
  assert.equal(typeof input, 'string', 'Supply an explicitly approved production origin.');
  let url;
  try { url = new URL(input); } catch { throw Error('Invalid production origin.'); }
  assert.equal(url.protocol, 'https:', 'Production must use HTTPS.');
  assert.equal(url.username + url.password, '', 'Credentials are not permitted in host URLs.');
  assert.equal(url.port + url.pathname + url.search + url.hash, '/', 'Use a bare HTTPS host, without port, path, query or fragment.');
  assert.match(url.hostname, /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i, 'A real fully qualified hostname is required.');
  assert.doesNotMatch(url.hostname, /(?:^|\.)(?:pages\.dev|localhost|example|invalid|test)$/i, 'A preview or reserved hostname cannot be the production host.');
  assert.notEqual(url.origin, PREVIEW, 'A preview cannot be the production host.');
  return url.origin;
}
function tokens(value) { return (value || '').toLowerCase().split(/[\s,;]+/).filter(Boolean); }
function hasNoindex(response) { return tokens(response.headers.get('x-robots-tag')).includes('noindex'); }
function meta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find(t => new RegExp('\\bname=["\\\']' + name + '["\\\']', 'i').test(t));
  return tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || '';
}
function canonical(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  return tags.filter(t => /\brel=["']canonical["']/i.test(t))
    .map(t => t.match(/\bhref=["']([^"']*)["']/i)?.[1] || '');
}
function stamp(html) { return meta(html, 'quilt-build-commit'); }
function assertPublicDocument(response, html, origin, path, indexable, previewOf = null, requiresApp = true) {
  assert.equal(response.status, 200, origin + path + ' must return HTTP 200.');
  assert.equal(response.url, origin + path, origin + path + ' unexpectedly redirects.');
  assert.match(html, /<h1(?:\s|>)/i, 'Missing actual H1 at ' + path);
  const directive = tokens(meta(html, 'robots'));
  if (indexable) {
    assert.ok(directive.includes('index') && !directive.includes('noindex'), 'Production HTML cannot be noindex: ' + path);
    assert.equal(hasNoindex(response), false, 'Production X-Robots-Tag cannot be noindex: ' + path);
    assert.deepEqual(canonical(html), [origin + path], 'Canonical must be a unique absolute production URL: ' + path);
    const jsonld = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)]
      .map(match => JSON.parse(match[1]));
    if (requiresApp) {
      assert.ok(jsonld.some(item => item['@type'] === 'WebApplication'),
        'Calculator page must include WebApplication structured data: ' + path);
    } else {
      assert.ok(jsonld.some(item => item['@type'] === 'WebPage'),
        'About/Privacy should include truthful WebPage structured data: ' + path);
      assert.ok(!jsonld.some(item => item['@type'] === 'WebApplication'),
        'About/Privacy must not be misrepresented as calculator apps: ' + path);
    }
  } else if (previewOf) {
    // The custom domain and production pages.dev domain serve the SAME Astro
    // static HTML, including production index meta and its canonical tag.
    // Cloudflare's host-specific HTTP noindex response header protects the
    // pages.dev copy; requiring an HTML noindex here is an obsolete assertion.
    assert.ok(directive.includes('index') && !directive.includes('noindex'),
      'Mirrored preview should carry the same production HTML meta: ' + path);
    assert.equal(hasNoindex(response), true,
      'Production pages.dev mirror requires HTTP X-Robots-Tag noindex: ' + path);
    assert.deepEqual(canonical(html), [previewOf + path],
      'Mirrored preview must canonicalize to owned production URL: ' + path);
  } else {
    assert.ok(directive.includes('noindex'), 'Preview/QA HTML must contain noindex: ' + path);
    assert.equal(hasNoindex(response), true, 'Preview/QA requires HTTP X-Robots-Tag noindex: ' + path);
    assert.deepEqual(canonical(html), [], 'Preview/QA must have no canonical: ' + path);
  }
}
async function get(origin, path) {
  const response = await fetch(origin + path, {
    redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { 'Cache-Control': 'no-cache' }
  });
  return { response, html: await response.text() };
}
export async function checkLiveHosts(production) {
  const built = new Set();
  for (const path of indexedPaths) {
    const supportPage = supportPaths.includes(path);
    const live = await get(production, path);
    assertPublicDocument(live.response, live.html, production, path, true, null, !supportPage);
    const sourceSha = stamp(live.html);
    assert.match(sourceSha, /^[0-9a-f]{40}$/i, 'Production must identify its Git commit: ' + path);
    built.add(sourceSha.toLowerCase());
    const preview = await get(PREVIEW, path);
    assertPublicDocument(preview.response, preview.html, PREVIEW, path, false, production);
    assert.equal(stamp(preview.html).toLowerCase(), sourceSha.toLowerCase(), 'Production/preview versions differ at ' + path);
    console.log('PASS production index + preview noindex: ' + path);
  }
  assert.equal(built.size, 1, 'Production URL paths span inconsistent deployments.');
  for (const path of holdPaths) {
    for (const origin of [production, PREVIEW]) {
      const { response, html } = await get(origin, path);
      assertPublicDocument(response, html, origin, path, false);
      assert.doesNotMatch(html, /<script\s+type=["']application\/ld\+json["']>/i, 'Research pages cannot advertise a WebApplication: ' + path);
    }
  }
  console.log('PASS research/physical worksheets are nonindexed on both hosts.');
  const sitemap = await get(production, '/sitemap.xml');
  assert.equal(sitemap.response.status, 200, 'Production sitemap must exist.');
  const locs = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]);
  assert.deepEqual(locs, indexedPaths.map(path => production + path), 'Sitemap must contain the ten calculators/home plus About and Privacy, in order.');
  // Cloudflare Pages serves the SAME static build at custom and pages.dev hosts.
  // After production activation sitemap.xml may therefore be reachable on the
  // preview hostname. That is acceptable only when its URL list points solely
  // at the approved production hostname and its response is HTTP noindex.
  const previewMap = await get(PREVIEW, '/sitemap.xml');
  if (previewMap.response.status === 200) {
    assert.equal(hasNoindex(previewMap.response), true,
      'Preview sitemap must receive HTTP X-Robots-Tag noindex.');
    const previewLocs = [...previewMap.html.matchAll(new RegExp('<loc>([^<]+)</loc>', 'g'))].map(x => x[1]);
    assert.deepEqual(previewLocs, locs, 'Preview-host sitemap must refer only to production URLs.');
  } else {
    assert.equal(previewMap.response.status, 404, 'Unexpected preview sitemap status.');
  }
  const robots = await get(production, '/robots.txt');
  assert.equal(robots.response.status, 200);
  assert.ok(robots.html.includes('Sitemap: ' + production + '/sitemap.xml'), 'Production robots.txt must point to its sitemap.');
  for (const path of ['/diagonal-quilt-backing-calculator/', '/rag-quilt-calculator/', '/square-in-a-square-calculator/']) {
    const { response } = await get(production, path);
    assert.equal(response.status, 404, 'HOLD routes must not publish thin pages: ' + path);
  }
  console.log('PASS exact production sitemap, preview sitemap isolation, robots and HOLD exclusions.');
  console.log('PASS production release preflight at source ' + [...built][0]);
}
function selfTest() {
  const response = (origin, path, xRobots) => ({status:200,url:origin+path,headers:new Headers({'x-robots-tag':xRobots})});
  const html = (robots, canonicalTag='') => '<html><head><meta name="robots" content="'+robots+'">'+canonicalTag+'<script type="application/ld+json">{"@type":"WebApplication"}</script></head><body><h1>Test</h1></body></html>';
  const origin = 'https://quilt-example.com';
  assert.equal(parseProductionOrigin(origin), origin);
  for (const bad of ['http://quilt-example.com','https://quilt-example.com/path','https://quilt-example.com?x=1','https://quilt-example.com:8443','https://quilt-calculator-566.pages.dev','https://quilt.example','https://localhost','https://user:pass@quilt-example.com']) assert.throws(() => parseProductionOrigin(bad));
  assertPublicDocument(response(origin,'/', 'follow'), html('index,follow','<link rel="canonical" href="'+origin+'/">'), origin, '/', true);
  const trustHtml=html('index,follow','<link rel="canonical" href="'+origin+'/about/">').replace('<script type="application/ld+json">{"@type":"WebApplication"}</script>','<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>');
  assertPublicDocument(response(origin,'/about/', 'follow'), trustHtml, origin, '/about/', true, null, false);
  assert.throws(() => assertPublicDocument(response(origin,'/about/', 'follow'), trustHtml, origin, '/about/', true, null, true));
  assertPublicDocument(response(PREVIEW,'/', 'noindex, follow'), html('noindex,follow'), PREVIEW, '/', false);
  // A main-branch Cloudflare Pages build shares indexable HTML across both
  // names; pages.dev MUST still be HTTP noindex with production canonical.
  const mirrored = html('index,follow','<link rel="canonical" href="'+origin+'/">');
  assertPublicDocument(response(PREVIEW,'/', 'noindex, follow'), mirrored, PREVIEW, '/', false, origin);
  assert.throws(() => assertPublicDocument(response(PREVIEW,'/', 'follow'), mirrored, PREVIEW, '/', false, origin));
  assert.throws(() => assertPublicDocument(response(PREVIEW,'/', 'noindex'),
    html('index,follow','<link rel="canonical" href="https://wrong.example/">'), PREVIEW, '/', false, origin));
  assert.throws(() => assertPublicDocument(response(PREVIEW,'/', 'follow'), html('noindex,follow'), PREVIEW, '/', false));
  assert.throws(() => assertPublicDocument(response(origin,'/', 'follow'), html('index,follow'), origin, '/', true));
  assert.throws(() => assertPublicDocument(response(origin,'/', 'noindex,follow'), html('index,follow','<link rel="canonical" href="'+origin+'/">'), origin, '/', true));
  assert.throws(() => assertPublicDocument(response(origin,'/', 'follow'), html('index,follow','<link rel="canonical" href="https://wrong.com/">'), origin, '/', true));
  console.log('PASS independent production-host preflight self-tests (no network).');
}
const args = process.argv.slice(2);
if (args.includes('--self-test')) selfTest();
else {
  const arg = args.find(x => x.startsWith('--production='));
  if (!arg) throw Error('Run --self-test or --production=https://owner-approved-domain.com');
  await checkLiveHosts(parseProductionOrigin(arg.slice('--production='.length)));
}
