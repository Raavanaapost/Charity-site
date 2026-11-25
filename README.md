# RaavanaaPost

The news site of Raavanaa, at **https://raavanaapost.raavanaa.org**.
Community needs. Real impact.

Netlify project: `raavanaapost` (production branch: `raavanaapost`). Every push to this
branch is published automatically.

This branch (`raavanaapost`) holds only the news site. It is separate from
raavanaa.org: the `draft` and `main` branches are not touched by it.

- `site/` – the website exactly as Netlify publishes it.
- `source/theme/raavanaapost/` – the RaavanaaPost WordPress theme the pages are made with.
- `source/content/` – the stories (`load-news.php`), live settings (`live-settings.php`) and the photos.
- `source/build/` – `setup-wp.sh` builds a throw-away local WordPress, loads the stories and
  exports the static site into `site/` (`static-export.py`).

## Adding or changing a story

1. Edit the story list in `source/content/load-news.php`; put new photos in `source/content/photos/`.
2. Run `source/build/setup-wp.sh`. It rebuilds `site/`.
3. Check the pages, then commit and push this branch. Netlify publishes it.

## Rules for every story and photo

- First names only. No full names or addresses.
- Schools may be named again (SURESH, 20 Nov 2026); children's names never.
- Places are towns, never a home or school.
- Real photos of the days are allowed again (SURESH, 25 Nov 2026: permission given). Photos of children only with that permission; otherwise a drawing (`'art'`, SVGs in `source/theme/raavanaapost/assets/img/art/`). A story's photo (`'thumb'`) wins over its drawing.
- Evidence files are private and never go here.
- "Report a need" sends people to the Request a smile form on raavanaa.org, so there is one inbox.

## 15 Nov 2026: raavanaa.org is open

The "Coming soon" tags are off (`rp_coming_soon` false in `source/content/live-settings.php`), so Report a need and Needs we follow open the real pages. The charity logo beside the RaavanaaPost logo is now just Raavanaa (`raavanaa-480.webp`); "Beyond the Lanes" is no longer used.

## 17 Nov 2026: five stories at a glance

The front page (`source/theme/raavanaapost/front-page.php`) shows one big picture that turns
every 7 seconds between three stories (the story in `source/content/front-lead.txt` first, else
the newest), with bars to jump and a pause button (`assets/js/main.js`, `.rp-turn` in `main.css`).
Below it: two pictures, then two more. Sports (league) stories are kept out of these five.
This post also takes live the photo and school-name removal (branches rp-no-school-names,
rp-no-child-photos).

## 17 Nov 2026 (later): raavanaa.org picture style and Submit a need

The five front pictures now look like raavanaa.org's Home pictures (`rp_tile()` in
`inc/template-tags.php`, `.rp-mosaic` in `main.css`): words on the picture, stage pill, place, and a
turning green call on the big one ("Make this happen", "Own it"...). Phone: one big, two, two.
Computer: big on the left, four on the right. A green "Submit a need" pill sits in the top bar and a
band in the footer, both to https://raavanaa.org/spark (`rp_report_url`).

## 17 Nov 2026: News by place

A row of city chips ("News by place", `rp_city_strip()` in `inc/template-tags.php`) replaces the
rolling news ticker on every page (`rp_latest_strip()` is kept, not called). Cities come from the
stories' places, newest story first. The chips are shown only and do not filter yet; switch that
on when there are more projects (each chip has `data-rp-city`).
