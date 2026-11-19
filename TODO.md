# Gurushishya – to do

## Front page
- [x] Front page in the logo colours: logo, tagline, teacher and student buttons, Learn / Practise Daily / Progress, About, with a faded picture behind the page
- [ ] Earlier layouts kept for reference at `/v1` and `/v2`
- [x] Gurushishya logo on the site (header, front page, footer) and as the app icon
- [x] Ivory, maroon and gold look carried through the dashboard and the student practice pages
- [ ] Swap in the new background picture when it arrives (now using the temple-hall picture, faded)

## Name and domain
- [x] Renamed from Riyaz (name used by an existing singing app) to GuruShiya, then to Gurushishya with the new logo (Nov 2026)
- [ ] Find and buy a Gurushishya domain

## Switch on (needs your accounts)
- [ ] Google sign-in: create the Google client and send the Client ID (see SETUP.md)
- [ ] Facebook sign-in: Meta app and App Review (optional)
- [ ] Email service with your own domain, so every teacher and parent can sign in by email
- [ ] Ask Netlify for wildcard subdomains once the domain is bought
- [ ] Privacy policy and terms pages (Google and Facebook ask for them); privacy lawyer review before launch

## Dashboard
- [x] Overview: who practised today, who hasn't, who needs a reminder; Note and Remind buttons; remind everyone not yet at once

## Registration
- [x] One registration link: parent fills in the student's first name, email and mobile, gives consent, signs in, and the student is joined
- [ ] Parents need Google sign-in or the email service switched on (see Switch on) before they can finish registering

## Next features
- [x] Kid mode: parent PIN locks the app to one child's practice and notes (plugin: kidmode.js, notes in KIDMODE.md, branch kid-mode)
- [x] Practice timer only runs while the practice screen is open (pauses when the student leaves)
- [ ] Gurushishya sends consent and join requests itself (email first, then text/WhatsApp), instead of from the teacher's phone
- [ ] Photos or PDFs on class notes and homework
- [ ] Students send a short practice video or voice clip; teacher replies
- [ ] Tanpura drone and tala counter on the practice screen
- [ ] Tamil language option
- [ ] Badges and a class group streak
- [x] Approvals tab on the admin's Dashboard to approve teachers
- [ ] Email the admin when a new teacher signs up
- [x] Online classes: each class can hold a Zoom / Meet / Teams link (paste the invitation); Start button for the teacher, Join button for students 10 minutes before
- [ ] Connect a teacher's Zoom account so Gurushishya creates the meetings itself (needs a Zoom Marketplace app)
- [ ] Events calendar, fees and receipts
