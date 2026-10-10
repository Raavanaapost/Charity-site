
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
- [x] Launch: `SITE_PASSWORD` removed (10 Oct 2026, owner asked). raavanaa.org opens to everyone from the next published deploy.
- [ ] Optional: "Sign in with GitHub" button for admins.

### Portal and community (agreed 9 Oct 2026)
- [x] Portal screens designed (preview at /portal): Dashboard, Suggestions, Projects + editor, Reports & feedback, Sponsors & pledges, Day preparation, Close the day, People, Team & logins.
- [x] Backend step 1 (Suggestions live): Initiate form → `/api/suggest` → Netlify Database; portal sign-in (Netlify Identity) and live Suggestions inbox via `/api/portal/*`. Admins: `PORTAL_ADMINS` env var (comma-separated emails) or Identity role `admin`; team members: Identity role `team`.
- [ ] Owner: in Netlify switch on Identity (Registration: Invite only) and invite yourself; then test on the draft.
- [ ] Backend next steps: Projects editor → Sponsors & pledges → Day preparation / Close the day → Reports & feedback → People → Team & logins.
- [ ] Exact address of the event (the home, school or organization): collect it at the visit stage in the portal, not on the public form.
- [ ] Village list: build from the city + village recorded on every suggestion (and later projects and people).
- [ ] Name the Safeguarding lead and the Independent reviewer (shown publicly on the Report a concern page).
- [ ] Tamil version of the Report a concern and How did we do? pages (then the rest of the site).
- [ ] Raavanaa Post: a monthly newsletter with the month's impact stories, numbers and pictures; written in the portal, published as a page on the site and emailed to Keep me posted subscribers.
- [ ] Community database (the People screen): everyone who joins, volunteers, sponsors, visits or signs up, with how they connected and what they took part in. Consent first; only the team can see it.

## Saved header versions (to go back to)
- Full-colour logo, original height: commit b66481e
- Softer (faded) logo, original height: commit 60c2460
- Current: softer logo, squeezed to about 78% height for a shorter header
- Original stage pages (Initiated / Activated / Impact) with the taller 2:1 banner: commit 43c4d88.
  The original banner pictures are kept as img/hero-initiated-original.svg, hero-activated-original.svg, hero-impact-original.svg.
