<?php
/**
 * Template Name: Needs we are following
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$rp_page_url = get_permalink();
while ( have_posts() ) :
	the_post();
	rp_hero( get_the_title(), apply_filters( 'the_content', get_the_content() ) ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals
endwhile;

$rp_stages = rp_stages();
// phpcs:ignore WordPress.Security.NonceVerification
$rp_stage = isset( $_GET['stage'] ) ? sanitize_key( wp_unslash( $_GET['stage'] ) ) : '';
if ( ! isset( $rp_stages[ $rp_stage ] ) ) {
	$rp_stage = '';
}
// phpcs:ignore WordPress.Security.NonceVerification
$rp_pg = isset( $_GET['pg'] ) ? max( 1, absint( $_GET['pg'] ) ) : 1;

$rp_count = function ( $keys ) {
	$q = new WP_Query(
		array(
			'post_type'      => 'post',
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery
				array(
					'key'     => 'rp_stage',
					'value'   => $keys,
					'compare' => 'IN',
				),
			),
		)
	);
	return (int) $q->found_posts;
};

$rp_q = new WP_Query(
	array(
		'post_type'           => 'post',
		'posts_per_page'      => 12,
		'paged'               => $rp_pg,
		'orderby'             => 'modified',
		'ignore_sticky_posts' => true,
		'meta_query'          => array( // phpcs:ignore WordPress.DB.SlowDBQuery
			array(
				'key'     => 'rp_stage',
				'value'   => $rp_stage ? array( $rp_stage ) : array_keys( $rp_stages ),
				'compare' => 'IN',
			),
		),
	)
);
?>
<section class="rp-needs rp-needs--page" aria-label="<?php esc_attr_e( 'Needs', 'raavanaapost' ); ?>">
	<div class="rp-wrap">
		<nav class="rp-tabs" aria-label="<?php esc_attr_e( 'Show needs by stage', 'raavanaapost' ); ?>">
			<a href="<?php echo esc_url( $rp_page_url ); ?>"<?php echo '' === $rp_stage ? ' aria-current="page"' : ''; ?>>
				<?php esc_html_e( 'All', 'raavanaapost' ); ?> <span><?php echo esc_html( number_format_i18n( $rp_count( array_keys( $rp_stages ) ) ) ); ?></span>
			</a>
			<?php foreach ( $rp_stages as $rp_key => $rp_label ) : ?>
				<a href="<?php echo esc_url( add_query_arg( 'stage', $rp_key, $rp_page_url ) ); ?>"<?php echo $rp_key === $rp_stage ? ' aria-current="page"' : ''; ?>>
					<?php echo esc_html( $rp_label ); ?> <span><?php echo esc_html( number_format_i18n( $rp_count( array( $rp_key ) ) ) ); ?></span>
				</a>
			<?php endforeach; ?>
		</nav>

		<?php if ( $rp_q->have_posts() ) : ?>
			<div class="rp-needs__grid">
				<?php
				foreach ( $rp_q->posts as $rp_p ) {
					rp_card( $rp_p, 'need', 'h2' );
				}
				?>
			</div>
			<?php rp_pagination( $rp_q, $rp_stage ? add_query_arg( 'stage', $rp_stage, $rp_page_url ) : $rp_page_url ); ?>
		<?php else : ?>
			<p class="rp-needs__none"><?php esc_html_e( 'No needs at this stage right now.', 'raavanaapost' ); ?></p>
		<?php endif; ?>

		<?php $rp_report = rp_page_url( 'report' ); ?>
		<?php if ( $rp_report ) : ?>
			<p class="rp-needs__cta"><a class="rp-btn rp-btn--gold" href="<?php echo esc_url( rp_soon_url( $rp_report ) ); ?>"><?php esc_html_e( 'Tell us about a need', 'raavanaapost' ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a></p>
		<?php endif; ?>
	</div>
</section>
<?php
get_footer();
