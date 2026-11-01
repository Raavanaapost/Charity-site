
## To do
- [ ] Comments: paste the GitHub key into the `COMMENTS_GITHUB_TOKEN` setting in Netlify (it exists but is empty), then test a comment.
- [ ] Form emails: in Netlify, Project configuration → Notifications → Form submission notifications, add an email notification to the owner's address for "Any form". Until then messages are only saved under Forms in Netlify.
- [ ] Impact in numbers: Volunteers and Local visits are hidden until real figures are typed in (admin → Site settings).
- [ ] Decide on member login (Netlify Identity): what members can do, and open sign-up or invite-only.
- [ ] About page: add who is behind Raavanaa, where it is based and how it started.
- [ ] Contact details: email, Facebook, Instagram (admin → Site settings) so the footer shows "Follow us".
- [ ] Keep me posted: decide how sign-ups get their news (the addresses are stored under Forms in Netlify).
- [ ] Privacy & child safety page: the team should read it and confirm the promises match what they do.
- [ ] Publishing: work goes to the `draft` branch (free preview at draft--charity-projects-draft.netlify.app); merge to `main` only when the owner says "post" (15 Netlify credits per publish).
- [ ] Launch: `SITE_PASSWORD` is set again (10 Oct 2026, owner asked: not going live yet). It locks raavanaa.org and the draft; the portal sign-in and /api are not blocked. Delete it and publish when ready to launch.
- [ ] Optional: "Sign in with GitHub" button for admins.

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
