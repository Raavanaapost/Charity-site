// Three messages that take turns at the top (title and the line under it) and under the bridge picture, on the
// Members sign-in and Team sign-in pages (SURESH, 10 Nov 2026). Call raavRotate(root, sets): each set is
// { title, sub, cap }; elements marked data-rot="title|sub|cap" inside root are swapped with a soft fade.
(function () {
  "use strict";
  const timers = new WeakMap();
  window.raavRotate = function (root, sets) {
    if (!root || !sets || sets.length < 2 || document.documentElement.lang === "ta") return;
    clearInterval(timers.get(root));
    const parts = ["title", "sub", "cap"].map((k) => [k, root.querySelector(`[data-rot="${k}"]`)]).filter((x) => x[1]);
    let i = 0;
    const put = (k) => parts.forEach(([key, el]) => { if (sets[k][key] != null) el.innerHTML = sets[k][key]; });
    put(0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timers.set(root, setInterval(() => {
      if (document.hidden || !root.isConnected) return;
      parts.forEach(([, el]) => el.classList.add("rot-out"));
      setTimeout(() => { i = (i + 1) % sets.length; put(i); parts.forEach(([, el]) => el.classList.remove("rot-out")); }, 450);
    }, 6000));
  };
})();
