
## To do
- [ ] Comments: paste the GitHub key into the `COMMENTS_GITHUB_TOKEN` setting in Netlify (it exists but is empty), then test a comment.
- [ ] Form emails: in Netlify, Project configuration → Notifications → Form submission notifications, add an email notification to the owner's address for "Any form". Until then messages are only saved under Forms in Netlify.
- [ ] Impact in numbers: Volunteers and Local visits are hidden until real figures are typed in (admin → Site settings).
- [x] Member login page (/members, 6 Nov 2026, draft): Sign in, Join, password reset, My account (name, "My donations" placeholder until card payments open). Same Netlify Identity as the team portal; portal access still needs the admin/team role. A "Sign in" / "My account" link sits at the end of the menu. RaavanaaPost has no login.
- [x] Card payments with PayHere (6 Nov 2026, draft): /give takes Sri Lankan rupees through PayHere (one-time gifts, project sponsorship, monthly Smile members). Rupee projects only; the Stripe code (CAD) stays as a fallback, and PayHere wins when both are set up. Gifts are recorded only from PayHere's signed notification (/api/give/payhere) and show on the project's budget bar.
- [ ] Owner: register with PayHere (payhere.lk) as RAAVANAA: registration document, LKR bank account in that name, ID copies. PayHere checks the website, so raavanaa.org must be open (no password, no "coming soon") when you apply.
- [ ] Owner, after PayHere approves: in PayHere → Settings → Domains & Credentials add raavanaa.org (and the draft address for testing) and copy the Merchant ID and Merchant Secret. In Netlify → Environment variables set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET. The draft then uses PayHere's sandbox (test cards, no real money). Set PAYHERE_LIVE=yes only when ready for real gifts on raavanaa.org.
- [ ] Owner: confirm the PayHere fee on your plan (the site estimates 3.3% for "cover the card fee") and whether monthly (recurring) payments are switched on for the account.
- [ ] Owner: to let the public join, in Netlify → Identity → Registration set it to Open (now Invite only, so only "Sign in" shows). Optional: Identity → External providers → add Google for "Continue with Google".
- [ ] About page: add who is behind Raavanaa, where it is based and how it started.
- [ ] Contact details: email, Facebook, Instagram (admin → Site settings) so the footer shows "Follow us".
- [ ] Keep me posted: decide how sign-ups get their news (the addresses are stored under Forms in Netlify).
- [ ] Privacy & child safety page: the team should read it and confirm the promises match what they do.
- [ ] Publishing: work goes to the `draft` branch (free preview at draft--charity-projects-draft.netlify.app); merge to `main` only when the owner says "post" (15 Netlify credits per publish).
- [ ] Launch: `SITE_PASSWORD` is set again (10 Oct 2026, owner asked: not going live yet). It locks raavanaa.org and the draft; the portal sign-in and /api are not blocked. Delete it and publish when ready to launch.
- [ ] Optional: "Sign in with GitHub" button for admins.
- [ ] Second front page (/front-2) "Being checked" list: reads /api/pipeline, a safe summary of requests in the team portal (kind of day, district, children band, month, step; no names, villages, contacts or typed text). On the draft it adds rows marked "Example" while there are fewer than 2 real ones; the live site never shows examples.

### Portal and community (agreed 9 Oct 2026)
- [x] Portal screens designed (preview at /portal): Dashboard, Suggestions, Projects + editor, Reports & feedback, Sponsors & pledges, Day preparation, Close the day, People, Team & logins.
- [x] Backend step 1 (Suggestions live): Initiate form → `/api/suggest` → Netlify Database; portal sign-in (Netlify Identity) and live Suggestions inbox via `/api/portal/*`. Admins: `PORTAL_ADMINS` env var (comma-separated emails) or Identity role `admin`; team members: Identity role `team`.
- [ ] Owner: in Netlify switch on Identity (Registration: Invite only) and invite yourself; then test on the draft.
- [ ] Backend next steps: Projects editor → Sponsors & pledges → Day preparation / Close the day → Reports & feedback → People → Team & logins.
- [x] Evidence on the Initiate form (10 Oct 2026): required (or "I'll show it at the visit"), up to 3 photos / PDFs / short videos, photos shrunk on the phone, stored privately in Netlify Blobs ("evidence"), seen only in the portal.
- [ ] Exact address of the event (the home, school or organization): collect it at the visit stage in the portal, not on the public form.
- [x] Smile Map (/smile-map, 10 Oct 2026, draft): hand-drawn style map; places in places.json. Still to do: the team sets a village's position in the portal at the visit.
- [ ] (old note) "Where we've been" map: a hand-drawn style map of Sri Lanka with a dot per village we work in (village level only, never a home or school), shown once a project is Activated; tap a dot for its projects. Village position set by the team in the portal at the visit.
- [ ] Village list: build from the city + village recorded on every suggestion (and later projects and people).
- [ ] Name the Safeguarding lead and the Independent reviewer (shown publicly on the Report a concern page).
- [ ] Tamil version of the Report a concern and How did we do? pages (then the rest of the site).
- [ ] Raavanaa Post: a monthly newsletter with the month's impact stories, numbers and pictures; written in the portal, published as a page on the site and emailed to Keep me posted subscribers.
- [ ] Community database (the People screen): everyone who joins, volunteers, sponsors, visits or signs up, with how they connected and what they took part in. Consent first; only the team can see it.

## Slogans (kept in site.json → "slogans", rotate to keep the site feeling alive)
- Create (for people suggesting a project; rotates on the Initiate page, /initiate): Create a Moment · Start a Smile · Spark a Smile · Bring a Day of Joy · Dream a Day for the Children · Initiate an Opportunity
- Sponsor (for sponsors; not shown yet, for a future "Sponsor" button): Sponsor a Moment · Fund a Smile · Give a Day of Joy · Be the Reason for a Smile
- Left out on purpose: "Request help" (sounds like applying for aid, invites money requests) and "Help us" (sounds like asking for donations).

## Saved header versions (to go back to)
- Full-colour logo, original height: commit b66481e
- Softer (faded) logo, original height: commit 60c2460
- Current: softer logo, squeezed to about 78% height for a shorter header
- Original stage pages (Initiated / Activated / Impact) with the taller 2:1 banner: commit 43c4d88.
  The original banner pictures are kept as img/hero-initiated-original.svg, hero-activated-original.svg, hero-impact-original.svg.
- [x] "A moment in their name" (/moment): Gemini paintings for each reason (img/moment/<reason>.jpg, made 10 Nov 2026 by .github/workflows/moment-pictures.yml; push the moment-pictures branch with reason keys in tools/pictures/moment-run.txt to make them again). The hand-drawn .svg versions are kept.
- [x] Moments at the heart of the site (SURESH, 10 Nov 2026, on the draft): /moment starts with the reasons (12, with "On behalf of"), then the name, then where the joy goes (a project, the Raavanaa Fund, or "a wish of my own"). Under "Continue to give": "Make it a moment every year?" (a yearly reminder) and "Make a family page" (/m/<code>, page together.html, API netlify/functions/moments.mts) so family and friends give to the same moment. Below: every project at a glance, in category tabs (drawings only, never a photo of a child; titles from share.json). /fund is the Raavanaa Fund page. Every Give form now asks first "Who is this gift for?" (from me, in someone's name, on behalf of a family or group).
- [x] Home is the moment page on the draft (SURESH chose it, 10 Nov 2026): the logo and every "Home" link (header and footer, English and Tamil) open /moment. The earlier home page is still at /overview. To go back, change those links from /moment to /overview again.
- [ ] Yearly reminders are saved (table moment_reminders) but not sent yet: sending needs an email or WhatsApp service (ask SURESH before choosing one).
- [ ] The Raavanaa Fund page (/fund) is small for now; SURESH wants to grow it in a later phase (show what came in and where it went).
