# Picture robot (RaavanaaPost)

Makes realistic AI pictures for RaavanaaPost stories with Google Gemini, so the site needs no real photos of children.

How it works:
1. `export_stories.php` reads every story from `source/content/load-news.php` (and its raavanaa.org project).
2. `make_pictures.py` asks Gemini to plan a cover and inside pictures in the RaavanaaPost style, makes each one, and asks Gemini to check it: no recognisable child's face and no text. A picture that fails is made again, up to 3 tries.
3. Pictures and a `manifest.json` land in `source/content/photos/ai/<STORY KEY>/`.
4. On the next site build, `load-news.php` uses them in place of that story's real photos. Every caption ends with "(AI illustration)".

Run it:
- From GitHub: Actions → **RaavanaaPost pictures** → Run workflow (story keys such as `KT`, or `all`). The pictures go to the `raavanaapost-pictures` branch to look at first.
- By hand: `GEMINI_API_KEY=... python3 tools/pictures/make_pictures.py --story KT`

Story keys: run `php tools/pictures/export_stories.php`.

Nothing goes live until the pictures are merged into `raavanaapost` and the owner says "post".
