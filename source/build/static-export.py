"""Turn the local RaavanaaPost WordPress into the static site in ../../site.

Run while the local WordPress is being served at http://localhost:8899
(see setup-wp.sh). Every page gets its own folder and index.html, photos
and theme files are copied, and search works in the browser.
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import deque

BASE = "http://localhost:8899"
SITE = "https://raavanaapost.raavanaa.org"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "site"))
WP = os.environ.get("RP_WP_DIR", "/tmp/rp-wp/wp")
WPCLI = os.environ.get("RP_WPCLI", "wp")
STAGE_PATHS = {"reported": "initiated", "help": "activated", "solved": "impact"}
ENC_BASE = urllib.parse.quote(BASE, safe="")
ENC_SITE = urllib.parse.quote(SITE, safe="")

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def fetch(url):
    try:
        with opener.open(url) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return e.read().decode("utf-8")
        raise


def norm(url):
    """Internal page URL -> 'path' or 'path?stage=x', else None."""
    url = html.unescape(url)
    if url.startswith("/") and not url.startswith("//"):
        url = BASE + url
    if not url.startswith(BASE):
        return None
    p = urllib.parse.urlsplit(url)
    path = p.path or "/"
    bad = ("/wp-admin", "/wp-login", "/wp-json", "/xmlrpc", "/feed", "/comments/", "/wp-content", "/wp-includes", "/wp-comments-post")
    if path.startswith(bad) or path.endswith("/feed/"):
        return None
    q = urllib.parse.parse_qs(p.query)
    if "stage" in q:
        return path + "?stage=" + q["stage"][0]
    if p.query:
        return None
    if not path.endswith("/") and "." not in path.rsplit("/", 1)[-1]:
        path += "/"
    return path


def public_path(key):
    path, _, query = key.partition("?")
    if query.startswith("stage="):
        stage = query.split("=", 1)[1]
        path = path + STAGE_PATHS.get(stage, stage) + "/"
    return path


# 1. Crawl every page reachable from the front page.
pages = {}
queue = deque(["/"])
while queue:
    key = queue.popleft()
    if key in pages:
        continue
    pages[key] = fetch(BASE + key)
    for href in re.findall(r'href=["\']([^"\']+)["\']', pages[key]):
        k = norm(href)
        if k and k not in pages:
            queue.append(k)
print("pages:", len(pages))

JUNK = [
    r'<link rel="alternate" type="application/rss\+xml"[^>]*>\s*',
    r'<link rel="alternate" title="oEmbed[^>]*>\s*',
    r'<link rel="alternate" title="JSON"[^>]*>\s*',
    r'<link rel="alternate" type="application/json"[^>]*>\s*',
    r'<link rel="https://api\.w\.org/"[^>]*>\s*',
    r'<link rel="EditURI"[^>]*>\s*',
    r"<link rel='shortlink'[^>]*>\s*",
    r'<meta name="generator"[^>]*>\s*',
    r'<style id="wp-emoji-styles-inline-css">.*?</style>\s*',
    r'<script id="wp-emoji-settings"[^>]*>.*?</script>\s*',
    r'<script type="speculationrules">.*?</script>\s*',
]


def clean(doc):
    for pat in JUNK:
        doc = re.sub(pat, "", doc, flags=re.S)
    # The emoji loader is an inline module script.
    doc = re.sub(r'<script type="module">(?:(?!</script>).)*wp-emoji(?:(?!</script>).)*</script>\s*', "", doc, flags=re.S)
    # Addresses that must stay absolute: canonical, share previews, share links, copy link.
    doc = re.sub(r'(<link rel="canonical" href=")' + re.escape(BASE), r"\1" + SITE, doc)
    doc = re.sub(r'(<meta property="og:[a-z:_]+" content=")' + re.escape(BASE), r"\1" + SITE, doc)
    doc = doc.replace(ENC_BASE, ENC_SITE)
    doc = doc.replace('data-rp-copy="' + BASE, 'data-rp-copy="' + SITE)

    # Needs page tabs: ?stage=x -> /needs-we-are-following/initiated/ etc.
    def stage_link(m):
        k = norm(m.group(2))
        return m.group(1) + (public_path(k) if k else m.group(2)) + m.group(3)

    doc = re.sub(r'(href=")([^"]*\?stage=[a-z]+)(")', stage_link, doc)
    # Search goes to the static search page.
    doc = re.sub(r'(<form role="search" method="get" class="rp-searchform" action=")' + re.escape(BASE) + r'/(")', r"\1/search/\2", doc)
    doc = doc.replace(BASE, "")
    return doc


def write(path, doc):
    dest = os.path.join(OUT, path.lstrip("/"))
    if dest.endswith("/") or not os.path.splitext(dest)[1]:
        dest = os.path.join(dest, "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w") as f:
        f.write(doc)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)

docs = {}
for key, doc in pages.items():
    docs[public_path(key)] = clean(doc)

# 2. Not-found page.
docs["/404.html"] = clean(fetch(BASE + "/this-page-is-not-here-404/"))

# 3. Search page: the theme's search layout, filled in by the browser.
index = json.loads(
    subprocess.check_output(
        [WPCLI, "eval", r"""
        $out = array();
        foreach ( get_posts( array( 'post_type' => array( 'post', 'page' ), 'numberposts' => -1 ) ) as $p ) {
            $out[] = array(
                'title' => html_entity_decode( get_the_title( $p ), ENT_QUOTES ),
                'url'   => wp_make_link_relative( get_permalink( $p ) ),
                'text'  => html_entity_decode( has_excerpt( $p ) ? get_the_excerpt( $p ) : wp_trim_words( wp_strip_all_tags( $p->post_content ), 28, '…' ), ENT_QUOTES ),
                'place' => 'post' === $p->post_type ? rp_place( $p ) : '',
                'date'  => 'post' === $p->post_type ? get_the_date( '', $p ) : '',
                'iso'   => get_post_time( 'c', true, $p ),
                'all'   => html_entity_decode( wp_strip_all_tags( get_the_title( $p ) . ' ' . $p->post_excerpt . ' ' . $p->post_content . ' ' . rp_place( $p ) ), ENT_QUOTES ),
            );
        }
        echo wp_json_encode( $out );
        """],
        text=True,
    )
)
search = clean(fetch(BASE + "/?s=zzqxjv"))
search = search.replace("Search: zzqxjv", "Search")
search = search.replace('value="zzqxjv"', 'value=""')
search = re.sub(r'<p class="rp-nothing">.*?</p>', '<div id="rp-results" aria-live="polite"></div>', search, flags=re.S)
search_js = """
<script>
(function () {
  var items = %s;
  var params = new URLSearchParams(location.search);
  var q = (params.get('s') || '').trim();
  var box = document.getElementById('rp-results');
  var input = document.querySelector('.rp-searchpage input[type="search"]');
  if (input) { input.value = q; }
  var title = document.querySelector('.rp-hero__title');
  if (q && title) { title.textContent = 'Search: ' + q; document.title = 'Search: ' + q + ' – RaavanaaPost'; }
  if (!box || !q) { return; }
  var words = q.toLowerCase().split(/\\s+/).filter(Boolean);
  var found = items.filter(function (it) {
    var hay = it.all.toLowerCase();
    return words.every(function (w) { return hay.indexOf(w) !== -1; });
  });
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  if (!found.length) {
    box.innerHTML = '<p class="rp-nothing">Nothing matched. Try fewer words, or the name of a town.</p>';
    return;
  }
  var html = '<p class="rp-meta rp-searchpage__count">' + found.length + (found.length === 1 ? ' story found' : ' stories found') + '</p><ul class="rp-results">';
  found.forEach(function (it) {
    html += '<li>' + (it.place ? '<p class="rp-kicker">' + esc(it.place) + '</p>' : '') +
      '<h2 class="rp-card__title"><a href="' + esc(it.url) + '">' + esc(it.title) + '</a></h2>' +
      '<p class="rp-card__text">' + esc(it.text) + '</p>' +
      (it.date ? '<p class="rp-meta"><time datetime="' + esc(it.iso) + '">' + esc(it.date) + '</time></p>' : '') + '</li>';
  });
  box.innerHTML = html + '</ul>';
})();
</script>
""" % json.dumps(index, ensure_ascii=False)
search = search.replace("</body>", search_js + "</body>")
search = re.sub(r"<title>.*?</title>", "<title>Search – RaavanaaPost</title>", search, flags=re.S)
docs["/search/"] = search

for path, doc in docs.items():
    if "localhost" in doc:
        sys.exit("A test-site address is left in " + path)
    write(path, doc)

# 4. Copy every theme, WordPress and photo file the pages use.
refs = set()
for doc in docs.values():
    for attr in re.findall(r'(?:src|href|content)=["\'](/wp-(?:content|includes)/[^"\']+)["\']', doc):
        refs.add(attr)
    for srcset in re.findall(r'srcset=["\']([^"\']+)["\']', doc):
        for part in srcset.split(","):
            u = part.strip().split(" ")[0]
            if u.startswith("/wp-"):
                refs.add(u)
copied = 0
for ref in sorted(refs):
    rel = urllib.parse.unquote(ref.split("?")[0]).lstrip("/")
    src = os.path.join(WP, rel)
    if not os.path.isfile(src):
        sys.exit("Missing file " + rel)
    dst = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy(src, dst)
    copied += 1
theme_assets = os.path.join(WP, "wp-content/themes/raavanaapost/assets")
shutil.copytree(theme_assets, os.path.join(OUT, "wp-content/themes/raavanaapost/assets"), dirs_exist_ok=True)
print("files copied:", copied)

# 5. Sitemap and robots.
urls = sorted(p for p in docs if p.endswith("/") and p != "/search/")
with open(os.path.join(OUT, "sitemap.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in urls:
        f.write("  <url><loc>%s%s</loc></url>\n" % (SITE, u))
    f.write("</urlset>\n")
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write("User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % SITE)
print("pages written:", len(docs))
