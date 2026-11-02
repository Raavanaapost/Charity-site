/* RaavanaaPost: search panel, menu position, copy link. */
(function () {
	'use strict';

	var btn = document.querySelector('.rp-nav__search');
	var panel = document.getElementById('rp-search');
	if (btn && panel) {
		var close = function () {
			panel.hidden = true;
			btn.setAttribute('aria-expanded', 'false');
		};
		btn.addEventListener('click', function () {
			var open = btn.getAttribute('aria-expanded') === 'true';
			if (open) {
				close();
				return;
			}
			panel.hidden = false;
			btn.setAttribute('aria-expanded', 'true');
			var input = panel.querySelector('input[type="search"]');
			if (input) {
				input.focus();
			}
		});
		panel.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') {
				close();
				btn.focus();
			}
		});
	}

	/* On phones the menu scrolls sideways: bring the current section into view. */
	var area = document.querySelector('.rp-nav__scroll-area');
	var current = document.querySelector('.rp-nav .current-menu-item > a, .rp-nav .current-cat > a, .rp-nav .current-post-ancestor > a');
	if (area && current && area.scrollWidth > area.clientWidth) {
		area.scrollLeft = Math.max(0, current.offsetLeft - 24);
	}
	/* Hide the fade at the right once the reader has swiped to the last section. */
	if (area) {
		var edge = function () {
			area.classList.toggle('is-end', area.scrollLeft + area.clientWidth >= area.scrollWidth - 4);
		};
		area.addEventListener('scroll', edge, { passive: true });
		window.addEventListener('resize', edge);
		edge();
	}

	/* Dates: recent stories read "2 hours ago" or "Yesterday", in the reader's own time. */
	var now = new Date();
	var ago = function (d) {
		var s = Math.max(0, (now - d) / 1000);
		if (s < 3600) {
			var m = Math.max(1, Math.round(s / 60));
			return m + (m === 1 ? ' minute ago' : ' minutes ago');
		}
		if (s < 86400) {
			var h = Math.floor(s / 3600);
			return h + (h === 1 ? ' hour ago' : ' hours ago');
		}
		if (s < 172800) {
			return 'Yesterday';
		}
		return '';
	};
	if (document.documentElement.lang.indexOf('en') === 0) {
		var today = document.querySelector('[data-rp-today]');
		if (today) {
			today.textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
		}
		document.querySelectorAll('time[data-rp-when]').forEach(function (t) {
			var d = new Date(t.getAttribute('datetime'));
			var r = isNaN(d) ? '' : ago(d);
			if (r) {
				t.textContent = r;
			}
		});
		document.querySelectorAll('time[data-rp-clock]').forEach(function (t) {
			var d = new Date(t.getAttribute('datetime'));
			if (isNaN(d)) {
				return;
			}
			if (d.toDateString() === now.toDateString()) {
				t.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
			} else {
				var r = ago(d);
				if (r) {
					t.textContent = r;
				}
			}
		});
	}

	/* Latest news ticker: one headline at a time rolls up; a long headline first
	   slides sideways so it can be read to the end. Hover, keyboard focus or the
	   pause button stop it. */
	var ticker = document.querySelector('[data-rp-ticker]');
	var rows = ticker ? ticker.querySelectorAll('.rp-latest__list li') : [];
	if (rows.length > 1) {
		var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var pauseBtn = ticker.querySelector('.rp-latest__pause');
		var at = 0, timer = 0, held = false, stopped = false;
		ticker.classList.add('is-ticking');
		rows[0].classList.add('is-in');
		var later = function (fn, ms) { clearTimeout(timer); timer = setTimeout(fn, ms); };
		var slide = function () {
			var row = rows[at], run = row.querySelector('.rp-latest__run');
			var extra = run ? run.scrollWidth - row.clientWidth : 0;
			if (still || extra <= 4) {
				later(roll, still ? 6000 : 4500);
				return;
			}
			var secs = Math.max(2, extra / 45);
			later(function () {
				run.style.transition = 'transform ' + secs + 's linear';
				run.style.transform = 'translateX(' + (-extra - 8) + 'px)';
				later(roll, secs * 1000 + 1800);
			}, 1500);
		};
		var roll = function () {
			if (held || stopped) {
				later(roll, 800);
				return;
			}
			var old = rows[at];
			at = (at + 1) % rows.length;
			var next = rows[at], nextRun = next.querySelector('.rp-latest__run');
			if (nextRun) {
				nextRun.style.transition = 'none';
				nextRun.style.transform = 'none';
			}
			next.classList.remove('is-out');
			old.classList.remove('is-in');
			old.classList.add('is-out');
			next.classList.add('is-in');
			setTimeout(function () {
				old.classList.remove('is-out');
				var oldRun = old.querySelector('.rp-latest__run');
				if (oldRun) {
					oldRun.style.transition = 'none';
					oldRun.style.transform = 'none';
				}
			}, 700);
			later(slide, 700);
		};
		ticker.addEventListener('mouseenter', function () { held = true; });
		ticker.addEventListener('mouseleave', function () { held = false; });
		ticker.addEventListener('focusin', function (e) { held = e.target.tagName === 'A'; });
		ticker.addEventListener('focusout', function () { held = false; });
		if (pauseBtn) {
			pauseBtn.hidden = false;
			pauseBtn.addEventListener('click', function () {
				stopped = !stopped;
				pauseBtn.setAttribute('aria-pressed', stopped ? 'true' : 'false');
				pauseBtn.querySelector('.screen-reader-text').textContent = stopped ? 'Play the latest news' : 'Pause the latest news';
			});
		}
		slide();
	}

	var copy = document.querySelector('[data-rp-copy]');
	if (copy) {
		if (!navigator.clipboard) {
			copy.hidden = true;
		} else {
			copy.addEventListener('click', function () {
				navigator.clipboard.writeText(copy.getAttribute('data-rp-copy')).then(function () {
					copy.textContent = copy.getAttribute('data-done');
				});
			});
		}
	}
})();
