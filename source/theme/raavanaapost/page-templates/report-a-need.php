<?php
/**
 * Template Name: Report a need
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

while ( have_posts() ) :
	the_post();
	rp_hero( get_the_title(), apply_filters( 'the_content', get_the_content() ) ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals
endwhile;
?>
<div class="rp-wrap rp-report">
	<div class="rp-report__form">
		<?php rp_report_form(); ?>
	</div>
	<aside class="rp-report__next" aria-labelledby="rp-next-h">
		<h2 id="rp-next-h"><?php esc_html_e( 'What happens next', 'raavanaapost' ); ?></h2>
		<ol class="rp-steps">
			<li><b><?php esc_html_e( 'We call you.', 'raavanaapost' ); ?></b> <?php esc_html_e( 'Someone from our team gets in touch to hear more.', 'raavanaapost' ); ?></li>
			<li><b><?php esc_html_e( 'We check it.', 'raavanaapost' ); ?></b> <?php esc_html_e( 'We visit, or speak to people nearby, to make sure we have it right.', 'raavanaapost' ); ?></li>
			<li><b><?php esc_html_e( 'We follow it.', 'raavanaapost' ); ?></b> <?php esc_html_e( 'The need goes on our tracker, and we update it until it is solved.', 'raavanaapost' ); ?></li>
		</ol>
		<?php $rp_needs = rp_page_url( 'needs' ); ?>
		<?php if ( $rp_needs ) : ?>
			<p><a class="rp-link" href="<?php echo esc_url( $rp_needs ); ?>"><?php esc_html_e( 'See the needs we are following now', 'raavanaapost' ); ?></a></p>
		<?php endif; ?>
	</aside>
</div>
<?php
get_footer();
