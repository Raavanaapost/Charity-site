# Abhyasa – setup

Abhyasa lives on its own branch (`abhyasa`) and its own Netlify site (`abhyasa-portal`).
It shares nothing with raavanaa.org.

## 1. Database (done)

The Supabase project **riyaz** (Canada Central) has the tables and privacy rules, and `config.js` points to it.
Still to do by hand:

1. Open **Authentication → URL Configuration**:
   - Site URL: `https://abhyasa-portal.netlify.app` (later, your own domain)
   - Redirect URLs: add `https://abhyasa-portal.netlify.app/**`

## 2. Connect Netlify

1. Netlify → **abhyasa-portal** → **Site configuration → Build & deploy → Link repository**.
2. Choose GitHub → `Raavanaapost/Charity-site`, and set **Branch to deploy: `abhyasa`**.
3. Leave the build command empty and set the publish directory to `.`.

## 3. Approve a teacher

New group pages stay private until approved.
Supabase → **Table Editor → groups** → tick **approved** for that row → Save.

## 4. Own domain (later)

1. Netlify → abhyasa-portal → **Domain management → Add a domain** (e.g. `abhyasa.ca`), using Netlify DNS.
2. Ask Netlify support to turn on **wildcard subdomains** (`*.abhyasa.ca`) for the site.
3. Put the domain in `config.js` as `rootDomain`, and update the Supabase Site URL and Redirect URLs.

## Privacy rules (built into the database)

- Children: first name only; parent consent required to join.
- Zoom/Meet links are only visible to the teacher and families in that class.
- Practice ticks are only visible to the family and their teacher.
- Teachers cannot approve their own page.
