<?php
/**
 * A story about a Raavanaa project, laid out like the project's page in raavanaa.org's new design
 * (renderProject() in site.js on raavanaa.org's draft): crumbs, title, byline, the picture, the story
 * folded under it, the Budget / Impact / Media tabs, and the side column with the boxes.
 * RaavanaaPost changes, asked for by SURESH on 6 Nov 2026:
 *  - The RaavanaaPost standfirst stays under the title.
 *  - "Project at a glance" opens from an icon on the picture instead of a side box.
 *  - The story shows its opening paragraph in full, then folds.
 *  - "Where this need stands" (the stage badges) leads the side column.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$p      = rp_project();
$st     = rp_rorg_stage( $p );
$cats   = get_the_category();
$cat    = $cats ? $cats[0] : null;
$place  = trim( (string) get_post_meta( get_the_ID(), 'rp_place', true ) );
$b      = rp_rorg_budget( $p );

// The story, folded after its first paragraph.
$body = apply_filters( 'the_content', get_the_content() );
$cut  = strpos( $body, '</p>' );
$rest = false !== $cut ? trim( substr( $body, $cut + 4 ) ) : '';
$open = false !== $cut ? substr( $body, 0, $cut + 4 ) : $body;

$ic = function ( $d ) {
	return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $d . '</svg>';
};
$tab_names = array(
	'updates' => array( 'Impact', $ic( '<path d="M12 20s-7-4.4-7-9.600A4.2 4.2 0 0 1 12 7.700a4.2 4.2 0 0 1 7 2.700C19 15.6 12 20 12 20z"/>' ) ),
	'budget'  => array( 'Budget', $ic( '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17"/><path d="M7 14.500h4"/>' ) ),
	'media'   => array( 'Media' . ( ! empty( $p['pictures'] ) ? ' (' . (int) $p['pictures'] . ')' : '' ), $ic( '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M10.2 9.300v5.400l4.6-2.700z" fill="currentColor"/>' ) ),
);
$order = 3 === $st ? array( 'updates', 'budget', 'media' ) : array( 'budget', 'updates', 'media' );
$tabs  = array();
foreach ( $order as $k ) {
	$tabs[ $k ] = $tab_names[ $k ];
}
$tale_more = array( '', 'See how this smile begins', 'See how this moment comes together', 'Relive the whole day' );

$updates = array_values( array_filter( (array) ( $p['updates'] ?? array() ), 'is_array' ) );
usort( $updates, function ( $x, $y ) { return strcmp( (string) $y['date'], (string) $x['date'] ); } );
$impact = rp_rorg_expect( $p );
foreach ( $updates as $u ) {
	$impact .= '<article class="update"><div class="meta">' . rp_rorg_date( $u['date'] ) . '</div><h3>' . esc_html( $u['title'] ) . '</h3><div>' . rp_rorg_md( $u['body'] ) . '</div></article>';
}
if ( ! $updates ) {
	$impact .= '<p class="empty">No impact updates yet.</p>';
}
$budget_note = 1 === $st && $b['lines'] ? 'These are estimates. Once the day has happened, the real costs are shown here.' : ( 2 === $st ? 'Once the day has happened, a breakdown of where the money went is shown here.' : '' );
$panes = array(
	'updates' => $impact,
	'budget'  => '<div class="budget-tab">' . rp_rorg_budget_detail( $p, true ) . ( $budget_note ? '<p class="note">' . $budget_note . '</p>' : '' ) . '</div>',
	'media'   => ! empty( $p['pictures'] ) ? '<p class="empty">The pictures and videos from this day are on the project page on raavanaa.org.</p>' : '<p class="empty">No videos or pictures yet.</p>',
);

$art = rp_art( get_post() );

// "Where this need stands", Activating and Budget: under the picture on a phone, at the top of the side column otherwise (as on raavanaa.org).
ob_start();
if ( rp_stage() ) {
	echo '<div class="panel need"><h2>' . esc_html__( 'Where this need stands', 'raavanaapost' ) . '</h2>';
	rp_tracker( null, 'light' );
	rp_need_update();
	echo '</div>';
}
$top = ob_get_clean();
$box = function ( $cls ) use ( $p, $st ) {
	return rp_rorg_ring_panel( $p, $cls ) . ( 3 === $st ? '' : '<div class="' . $cls . '">' . rp_rorg_budget_box( $p ) . '</div>' );
};
?>
<article <?php post_class( 'rp-article rorg' ); ?>>
	<div class="wrap">
		<nav class="crumbs"><?php if ( $cat ) : ?><a href="<?php echo esc_url( get_category_link( $cat ) ); ?>"><?php echo esc_html( $cat->name ); ?></a><?php endif; ?><?php echo ! empty( $p['theme'] ) ? ' / ' . esc_html( $p['theme'] ) : ''; ?></nav>
		<div class="layout">
			<div style="min-width:0">
				<header class="phead">
					<?php if ( ! empty( $p['theme'] ) ) : ?><span class="tag"><?php echo esc_html( $p['theme'] ); ?></span><?php endif; ?>
					<h1 class="rp-article__title"><?php the_title(); ?></h1>
					<?php if ( has_excerpt() ) : ?><p class="lede"><?php echo esc_html( get_the_excerpt() ); ?></p><?php endif; ?>
					<div class="byline"><span class="avatar">RP</span><span>by <strong><?php echo esc_html( rp_byline() ); ?></strong> · <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time><?php echo $place ? ' · ' . esc_html( $place ) : ''; ?></span><?php if ( ! empty( $p['verified'] ) ) : ?><span class="verified"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> Visited and verified</span><?php endif; ?></div>
				</header>
				<div class="hero-wrap">
					<div class="hero cover">
						<?php
						if ( has_post_thumbnail() ) {
							the_post_thumbnail( 'rp-wide', array( 'fetchpriority' => 'high' ) );
						} elseif ( $art ) {
							echo '<img src="' . esc_url( rp_img( 'art/' . $art . '.svg' ) ) . '" alt="" fetchpriority="high">';
						}
						?>
					</div>
					<?php echo rp_rorg_glance( $p ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				</div>
				<section class="ptale s<?php echo (int) $st; ?><?php echo $rest ? '' : ' short'; ?>">
					<?php if ( ! empty( $p['quote'] ) ) : ?><p class="pull">“<?php echo esc_html( $p['quote'] ); ?>”</p><?php endif; ?>
					<div class="ptale-text story" id="ptale-text"><?php echo $open; // phpcs:ignore ?><?php if ( $rest ) : ?><div class="ptale-rest"><?php echo $rest; // phpcs:ignore ?></div><?php endif; ?></div>
					<?php if ( $rest ) : ?><button class="ptale-more" type="button" aria-expanded="false" aria-controls="ptale-text"><span><?php echo esc_html( $tale_more[ $st ] ); ?></span><i aria-hidden="true">⌄</i></button><?php endif; ?>
				</section>
				<div class="only-narrow"><?php echo $top; // phpcs:ignore ?></div>
				<?php echo $box( 'only-narrow' ); // phpcs:ignore ?>
				<div class="tabs" role="tablist">
					<?php $first = true; foreach ( $tabs as $k => $t ) : ?>
						<button class="tab t-<?php echo esc_attr( $k ); ?>" role="tab" aria-selected="<?php echo $first ? 'true' : 'false'; ?>" data-t="<?php echo esc_attr( $k ); ?>"><?php echo $t[1]; // phpcs:ignore ?><span><?php echo esc_html( $t[0] ); ?></span></button>
					<?php $first = false; endforeach; ?>
				</div>
				<?php $first = true; foreach ( $order as $k ) : ?>
					<section class="folder t-<?php echo esc_attr( $k ); ?>" role="tabpanel" data-pane="<?php echo esc_attr( $k ); ?>"<?php echo $first ? '' : ' hidden'; ?>><?php echo $panes[ $k ]; // phpcs:ignore ?></section>
				<?php $first = false; endforeach; ?>
				<?php rp_share_links(); ?>
			</div>
			<aside class="side">
				<div class="only-wide"><?php echo $top; // phpcs:ignore ?></div>
				<?php echo $box( 'only-wide' ); // phpcs:ignore ?>
				<?php echo rp_rorg_journey( $p ); // phpcs:ignore ?>
				<?php if ( $cat ) : ?><a class="btn ghost" href="<?php echo esc_url( get_category_link( $cat ) ); ?>">Back to <?php echo esc_html( $cat->name ); ?></a><?php endif; ?>
			</aside>
		</div>
	</div>
	<script>
	/* Tabs, the folded story and the "go to 100%" box, as in raavanaa.org's site.js (wireTale, wireGo). */
	(function () {
		var a = document.currentScript.closest('.rorg');
		a.querySelectorAll('.tab').forEach(function (b) {
			b.addEventListener('click', function () {
				a.querySelectorAll('.tab').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
				a.querySelectorAll('[data-pane]').forEach(function (s) { s.hidden = s.dataset.pane !== b.dataset.t; });
			});
		});
		var box = a.querySelector('.ptale'), more = box && box.querySelector('.ptale-more');
		if (more) {
			var label = more.querySelector('span').textContent;
			more.addEventListener('click', function () {
				var v = !box.classList.contains('open');
				box.classList.toggle('open', v); more.setAttribute('aria-expanded', v);
				more.querySelector('span').textContent = v ? 'Show less' : label;
				if (!v) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			});
		}
		a.querySelectorAll('.go100').forEach(function (g) {
			var pct = +g.dataset.pct, n = g.querySelector('.ring-n'), l = g.querySelector('.ring-l'), lab = l ? l.textContent : '';
			var setN = function (v, preview) { if (n) n.textContent = Math.round(v) + '%'; if (l) l.textContent = preview ? 'IF DONE' : lab; g.classList.toggle('previewing', !!preview); };
			var countUp = function () { var t0 = performance.now(), dur = 1100; var step = function (now) { var t = Math.min(1, (now - t0) / dur); setN(pct * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
			if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window) || g.offsetParent === null) setN(pct);
			else { setN(0); var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); countUp(); } }, { threshold: .4 }); io.observe(g); }
			var btn = g.querySelector('.go-open'), fold = g.querySelector('.go-fold');
			if (btn && fold) btn.addEventListener('click', function () {
				var open = btn.getAttribute('aria-expanded') !== 'true';
				btn.setAttribute('aria-expanded', open); fold.hidden = !open; g.classList.toggle('open', open);
				btn.querySelector('span').textContent = open ? 'Fold it away' : "See what's left to reach 100%";
			});
			g.querySelectorAll('.go-list li.todo').forEach(function (li) {
				var on = function () { setN(Math.min(100, +g.dataset.raw + +li.dataset.add), true); }, off = function () { setN(pct); };
				li.addEventListener('mouseenter', on); li.addEventListener('mouseleave', off);
				li.addEventListener('focus', on); li.addEventListener('blur', off);
			});
		});
	})();
	</script>
</article>
