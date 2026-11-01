# RaavanaaPost

The news site of Raavanaa – Beyond the Lanes, at **https://raavanaapost.raavanaa.org**.
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

- First names only. No full names, addresses or schools.
- Places are towns, never a home or school.
- Children's faces only with a parent's or guardian's permission (photos already approved for raavanaa.org).
- Evidence files are private and never go here.
- "Report a need" sends people to the Request a smile form on raavanaa.org, so there is one inbox.
