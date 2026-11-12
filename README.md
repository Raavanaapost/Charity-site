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

- First names only. No full names or addresses.
- Schools, pre-schools and homes are not named (SURESH, 9 Nov 2026).
- Places are towns, never a home or school.
- No real photos of children (SURESH, 12 Nov 2026). A story shows a drawing (`'art'`, the SVG files in `source/theme/raavanaapost/assets/img/art/`) or an AI illustration, never a photo of a child.
- Evidence files are private and never go here.
- "Report a need" sends people to the Request a smile form on raavanaa.org, so there is one inbox.
