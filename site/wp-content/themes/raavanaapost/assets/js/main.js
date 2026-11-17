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
		var todayShort = document.querySelector('[data-rp-today-short]');
		if (todayShort) {
			todayShort.textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
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

	/* Front page: the big top picture turns to the next story every 7 seconds and the
	   green call on it changes every 2.8 seconds, like raavanaa.org's Home. Dots jump to
	   a story; hover, keyboard focus or the pause button hold it. */
	var turn = document.querySelector('[data-rp-turn]');
	var slides = turn ? turn.querySelectorAll('.rp-turn__slide') : [];
	var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (turn) {
		var SAYS = { make: ['Make this happen', 'Own it', 'Create the moment', 'Be the smile', 'Start it today'], read: ['Read the story'] };
		var w = 0;
		var say = function () {
			var on = turn.querySelector('.rp-turn__slide.is-on .rp-tile__call');
			if (!on) { return; }
			var list = SAYS[on.getAttribute('data-rp-call')] || SAYS.read;
			on.querySelector('b').textContent = list[w % list.length];
			on.classList.remove('in'); void on.offsetWidth; on.classList.add('in');
		};
		if (!calm) { setInterval(function () { if (!document.hidden) { w++; say(); } }, 2800); }
	}
	if (slides.length > 1) {
		var tControls = turn.querySelector('.rp-turn__controls');
		var dots = turn.querySelectorAll('.rp-turn__dot');
		var tPause = turn.querySelector('.rp-turn__pause');
		var tAt = 0, tHeld = false, tStopped = calm;
		var show = function (n) {
			tAt = (n + slides.length) % slides.length;
			for (var i = 0; i < slides.length; i++) {
				var on = i === tAt;
				slides[i].classList.toggle('is-on', on);
				if (on) { slides[i].removeAttribute('aria-hidden'); slides[i].removeAttribute('tabindex'); } else { slides[i].setAttribute('aria-hidden', 'true'); slides[i].setAttribute('tabindex', '-1'); }
				if (dots[i]) { dots[i].setAttribute('aria-pressed', on ? 'true' : 'false'); }
			}
			w = 0; say();
		};
		if (tControls) { tControls.hidden = false; }
		dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); }); });
		var setStopped = function (s) {
			tStopped = s;
			if (tPause) {
				tPause.setAttribute('aria-pressed', s ? 'true' : 'false');
				tPause.querySelector('.screen-reader-text').textContent = s ? 'Play the top stories' : 'Pause the top stories';
			}
		};
		setStopped(tStopped);
		if (tPause) { tPause.addEventListener('click', function () { setStopped(!tStopped); }); }
		turn.addEventListener('mouseenter', function () { tHeld = true; });
		turn.addEventListener('mouseleave', function () { tHeld = false; });
		turn.addEventListener('focusin', function () { tHeld = true; });
		turn.addEventListener('focusout', function () { tHeld = false; });
		setInterval(function () {
			if (!tHeld && !tStopped && !document.hidden) { show(tAt + 1); }
		}, 7000);
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
