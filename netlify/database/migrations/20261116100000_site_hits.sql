-- Traffic record (SURESH, 16 Nov 2026): "keep the record for a while so it shows how Raavanaa grew, and which
-- campaigns and groups worked". Netlify forgets after 7 days, so the site counts its own visits here.
-- Nothing personal is kept: no IP address, no cookie, no name, no exact location. A "visit" is one browser tab's
-- session (a random id kept in that tab only, gone when it closes). Query strings are never stored, so names typed
-- into a give link (?tn=...) never land here. The team sees the totals in the portal (#/traffic), and a nightly
-- GitHub job keeps a daily summary in the repository (branch traffic-record).
CREATE TABLE IF NOT EXISTS site_hits (
  id        BIGSERIAL PRIMARY KEY,
  at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind      TEXT NOT NULL DEFAULT 'view',   -- view (a page opened), share, give (I'd like to give sent), memory (a page in their memory made),
                                            -- request (a project request sent), vouch, install (the app installed)
  path      TEXT NOT NULL DEFAULT '',       -- the page, without the query string (/projects/pussellawa-kandy-trip)
  detail    TEXT NOT NULL DEFAULT '',       -- for a share: wa, fb, x, ig, link, phone; otherwise empty
  visit     TEXT NOT NULL DEFAULT '',       -- random id of the browser tab's session
  landing   BOOLEAN NOT NULL DEFAULT FALSE, -- the first page of that visit
  source    TEXT NOT NULL DEFAULT '',       -- where the visit came from: whatsapp, facebook, instagram, google, search, x, youtube,
                                            -- tiktok, raavanaapost, email, other, direct (typed in, a saved link, or an app that hides itself)
  ref_host  TEXT NOT NULL DEFAULT '',       -- the other website's name only (l.facebook.com), never the full address
  campaign  TEXT NOT NULL DEFAULT '',       -- from a campaign link: raavanaa.org/?from=kandy-whatsapp
  country   TEXT NOT NULL DEFAULT '',       -- two letters (CA, LK), from Netlify; no city
  device    TEXT NOT NULL DEFAULT '',       -- phone, tablet, computer
  app       BOOLEAN NOT NULL DEFAULT FALSE, -- opened from the installed Raavanaa app
  lang      TEXT NOT NULL DEFAULT 'en'
);
CREATE INDEX IF NOT EXISTS site_hits_at_idx ON site_hits (at);
CREATE INDEX IF NOT EXISTS site_hits_kind_at_idx ON site_hits (kind, at);
