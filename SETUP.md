# Gurushishya – setup (formerly Riyaz)

Gurushishya lives on its own branch (`abhyasa`) and its own Netlify site (`abhyasa-portal`).
It shares nothing with raavanaa.org.

## 1. Database (done)

Supabase project **riyaz** (Canada Central). The design and every change are in `supabase/schema.sql` and `supabase/stage2.sql` to `supabase/stage7.sql`.
Authentication → URL Configuration is set to `https://abhyasa-portal.netlify.app` with redirect `https://abhyasa-portal.netlify.app/**`.

## 2. Netlify (done)

Site **abhyasa-portal** deploys the `abhyasa` branch. Every saved change goes live by itself.

## 3. Approve a teacher

New teachers can set up classes and students straight away, but their page and invitations only work once approved.
Open the private admin link **https://kalaikoodam.raavanaa.org/admin**, sign in with the admin email (sure.ganes@gmail.com), and tap **Approve**. The same list is also under **Dashboard → Approvals**. A red alert on the Dashboard shows when someone is waiting.
To add another admin, run in Supabase SQL: `insert into private.admins (user_id) select id from auth.users where email = 'their@email';`
The database setup for this is in `supabase/stage4.sql`.

## 4. Sign-in options

Everyone can sign in with **email and password**. New teachers tap "Create an account"; parents create theirs at registration (one confirmation email). "Forgot password?" emails a reset link. People who first came in by email link can set a password under **Account** (`/account`).

### Google (recommended, about 15 minutes)
1. Go to console.cloud.google.com and create a project called **Gurushishya**.
2. **Google Auth Platform → Branding**: app name *Gurushishya*, your support email, the square Gurushishya icon (`icon-512.png`) as the logo, and the home page link.
3. **Audience**: External. **Data access**: add the `openid` scope (email and profile are already there).
4. **Clients → Create client → Web application**:
   - Authorized JavaScript origins: `https://kalaikoodam.raavanaa.org` and `https://abhyasa-portal.netlify.app`
   - Authorized redirect URIs: `https://ppoxitvzimilqvywrwpf.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client secret**.
6. Supabase → **Authentication → Sign In / Providers → Google**: turn it on, paste both, save.
7. Put the Client ID in `config.js` as `googleClientId` (it is safe to show). The official Google button then appears on the sign-in and join pages.

### Facebook (optional)
1. developers.facebook.com → **Create App** → add **Facebook Login**.
2. Valid OAuth Redirect URI: `https://ppoxitvzimilqvywrwpf.supabase.co/auth/v1/callback`. Make sure the `email` permission is included.
3. Copy the App ID and App Secret into Supabase → **Authentication → Sign In / Providers → Facebook**, and turn it on.
4. Set `facebookLogin: true` in `config.js`.
5. Before the public can use it, Meta needs a privacy policy link, an app icon, and an App Review of the `email` permission. Until then only people added to the Meta app can sign in.

### Email for everyone (needed before real teachers and parents use email sign-in)
Supabase's built-in email only sends to members of your Supabase team, at most 2 emails an hour.
Set up an email service (for example Resend or Brevo) with your own domain, then add its details in
Supabase → **Authentication → Emails → SMTP Settings**.

## 5. Web address

For now Gurushishya lives at **https://kalaikoodam.raavanaa.org** (the old address, abhyasa-portal.netlify.app, still works).
1. Netlify → abhyasa-portal → **Domain management → Add a domain** → `kalaikoodam.raavanaa.org`. If Netlify asks for a DNS record: CNAME, host `kalaikoodam`, value `abhyasa-portal.netlify.app`.
2. Supabase → **Authentication → URL Configuration**: Site URL `https://kalaikoodam.raavanaa.org`, and add the redirect `https://kalaikoodam.raavanaa.org/**` (keep the Netlify one).
3. Google sign-in, when switched on: add `https://kalaikoodam.raavanaa.org` to the Authorized JavaScript origins.

Later, with its own domain: add the domain the same way, ask Netlify support to turn on **wildcard subdomains** (`*.yourdomain`),
put the domain in `config.js` as `rootDomain`, and update Supabase and Google the same way.

## How it works

1. **Teacher** signs in, sets up the group, adds classes, then adds students.
2. The teacher sends one **registration link** with one tap, on WhatsApp, text or email from their own phone.
3. The **parent** (or an adult student) opens it, fills in the student's first name, email and mobile, ticks consent, and signs in. The student is joined and the practice page opens. A parent can also say "No, thank you".
4. **Student** picks the class, presses **Start**, practises, and presses **Stop**. The minutes appear on the teacher's dashboard.
5. **Teacher** sets the weekly practice, posts homework, class notes and announcements to the class, chats with each student, and sees a report for every student.

## Privacy rules (built into the database)

- Children: first name only. A parent must say yes before a child can join, and students can't join by themselves.
- A join link works once. Links stop working if the teacher isn't approved.
- Families see only their own child, their class board and their own chat. Students can't message each other.
- Teachers see only their own students. Teacher notes are private to the teacher.
- Zoom/Meet links are visible only to the teacher and families in that class.
- Teachers cannot approve their own page.
