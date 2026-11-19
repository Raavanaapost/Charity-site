# Kid mode plugin

`kidmode.js` is one self-contained file (no dependencies, styles included). A parent hands the device to a child;
the app stays on the pages you allow until the parent's 4-digit PIN is entered.

It lives on the `kid-mode` branch of this project so it can be copied into other projects.

## What it does
- Start dialog with a short explanation, PIN set-up (typed twice), and steps to pin the phone to the app (Android App pinning, iPhone Guided Access).
- While on: adds `kid-mode` to `<body>`, shows a "Kid mode · Name" bar with a **Parent** button, tries to go full screen.
- Hides anything marked `data-kid-hide` and any selectors you list.
- Blocks links to pages you don't allow and links that leave the site (unless marked `data-kid-allow`).
- Survives reloads. The PIN is stored on the device as a salted hash. Five wrong tries → 30-second wait.
- "Forgot PIN?" asks for the account password through your `verifyParent` function.

It cannot stop a child pressing Home or switching apps; no web page can. That is what the phone's own app pinning is for.

## Use it in another project
1. Copy `kidmode.js` and add `<script src="/kidmode.js"></script>` before your own script.
2. Start it once:
```js
KidMode.init({
  appName: "My App",
  storageKey: "myapp.kid",              // keeps its data separate from other apps
  home: "/child",                       // where to send a child who lands elsewhere
  allow: path => path.startsWith("/child"),
  navigate: path => router.go(path),    // default: location.href = path
  onChange: active => router.refresh(), // redraw when Kid mode starts or ends
  verifyParent: async password => checkPassword(password),   // optional, for "Forgot PIN?"
  hide: ["#menu", ".footer-links"]      // extra things to hide
});
```
3. Add a button for parents: `button.onclick = () => KidMode.start({ name: "Anika", key: "anika" })`.
4. In your router, before drawing a page: `if (KidMode.active() && !KidMode.guard()) return;`
5. Mark parent-only parts `data-kid-hide`, and outside links a child may use `data-kid-allow`.

Other calls: `KidMode.active()`, `KidMode.who()` (`{name, key}`), `KidMode.allowed(path)`, `KidMode.requestExit()`, `KidMode.clear()`.

Colours follow these CSS variables if you set them: `--km-accent`, `--km-accent-fg`, `--km-bar-bg`, `--km-bar-fg`, `--km-bg`, `--km-fg`, `--km-line`, `--km-key`, `--km-muted`, `--km-warn`.

## In Gurushishya
Parents tap **Kid mode** on a child's practice page. The child gets Practice and Homework & notes for their own classes.
Hidden: the top menu, Switch person, Chat, adding time by hand and ticking days (only the timer counts), and the demo video link. The Join online class button still works.
