<?php
/**
 * A story about a Raavanaa project, laid out like the project's page on raavanaa.org
 * (renderProject() in raavanaa.org's site.js): crumbs, title, standfirst, byline, the picture,
 * the Story / Impact / Budget / Media tabs, and the side column with the boxes.
 * RaavanaaPost changes, asked for by SURESH on 6 Nov 2026:
 *  - "Project at a glance" opens from an icon on the picture instead of a side box.
 *  - The story is folded after its opening paragraph, with "Read the full story".
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
$tabs = array(
	'story'   => array( 'Story', $ic( '<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.500V5c-3-.5-6 0-8 1.500z"/><path d="M12 6.500V19.5"/>' ) ),
	'updates' => array( 'Impact', $ic( '<path d="M12 20s-7-4.4-7-9.600A4.2 4.2 0 0 1 12 7.700a4.2 4.2 0 0 1 7 2.700C19 15.6 12 20 12 20z"/>' ) ),
	'budget'  => array( 'Budget', $ic( '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17"/><path d="M7 14.500h4"/>' ) ),
	'media'   => array( 'Media' . ( ! empty( $p['pictures'] ) ? ' (' . (int) $p['pictures'] . ')' : '' ), $ic( '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M10.2 9.300v5.400l4.6-2.700z" fill="currentColor"/>' ) ),
);

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
	'story'   => '<div class="story">' . ( ! empty( $p['quote'] ) ? '<p class="pull">“' . esc_html( $p['quote'] ) . '”</p>' : '' ) . $open
		. ( $rest ? '<details class="fold"><summary><span>Read the full story</span></summary>' . $rest . '</details>' : '' ) . '</div>',
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
echo rp_rorg_activating( $p ); // phpcs:ignore
echo 3 === $st ? '' : rp_rorg_budget_box( $p ); // phpcs:ignore
$top = ob_get_clean();
?>
<article <?php post_class( 'rp-article rorg' ); ?>>
	<div class="wrap">
		<nav class="crumbs"><?php if ( $cat ) : ?><a href="<?php echo esc_url( get_category_link( $cat ) ); ?>"><?php echo esc_html( $cat->name ); ?></a><?php endif; ?><?php echo ! empty( $p['theme'] ) ? ' / ' . esc_html( $p['theme'] ) : ''; ?></nav>
		<header class="phead">
			<?php if ( ! empty( $p['theme'] ) ) : ?><span class="tag"><?php echo esc_html( $p['theme'] ); ?></span><?php endif; ?>
			<h1 class="rp-article__title"><?php the_title(); ?></h1>
			<?php if ( has_excerpt() ) : ?><p class="lede"><?php echo esc_html( get_the_excerpt() ); ?></p><?php endif; ?>
			<div class="byline"><span class="avatar">RP</span><span>by <strong><?php echo esc_html( rp_byline() ); ?></strong> · <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time><?php echo $place ? ' · ' . esc_html( $place ) : ''; ?></span><?php if ( ! empty( $p['verified'] ) ) : ?><span class="verified"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> Visited and verified</span><?php endif; ?></div>
		</header>
		<div class="layout">
			<div style="min-width:0">
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
				<div class="only-narrow"><?php echo $top; // phpcs:ignore ?></div>
				<div class="tabs" role="tablist">
					<?php foreach ( $tabs as $k => $t ) : ?>
						<button class="tab t-<?php echo esc_attr( $k ); ?>" role="tab" aria-selected="<?php echo 'story' === $k ? 'true' : 'false'; ?>" data-t="<?php echo esc_attr( $k ); ?>"><?php echo $t[1]; // phpcs:ignore ?><span><?php echo esc_html( $t[0] ); ?></span></button>
					<?php endforeach; ?>
				</div>
				<?php foreach ( $panes as $k => $html ) : ?>
					<section class="folder t-<?php echo esc_attr( $k ); ?>" role="tabpanel" data-pane="<?php echo esc_attr( $k ); ?>"<?php echo 'story' === $k ? '' : ' hidden'; ?>><?php echo $html; // phpcs:ignore ?></section>
				<?php endforeach; ?>
				<?php rp_share_links(); ?>
			</div>
			<aside class="side">
				<div class="only-wide"><?php echo $top; // phpcs:ignore ?></div>
				<?php echo rp_rorg_journey( $p ); // phpcs:ignore ?>
				<?php if ( $cat ) : ?><a class="btn ghost" href="<?php echo esc_url( get_category_link( $cat ) ); ?>">Back to <?php echo esc_html( $cat->name ); ?></a><?php endif; ?>
			</aside>
		</div>
	</div>
	<script>
	(function () {
		var a = document.currentScript.closest('.rorg');
		a.querySelectorAll('.tab').forEach(function (b) {
			b.addEventListener('click', function () {
				a.querySelectorAll('.tab').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
				a.querySelectorAll('[data-pane]').forEach(function (s) { s.hidden = s.dataset.pane !== b.dataset.t; });
			});
		});
	})();
	</script>
</article>
