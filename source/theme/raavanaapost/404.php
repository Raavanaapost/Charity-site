<?php
/**
 * Page not found.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>
<div class="rp-wrap rp-lost">
	<img class="rp-lost__king" src="<?php echo esc_url( rp_img( 'king.png' ) ); ?>" alt="" width="417" height="463">
	<div>
		<h1><?php esc_html_e( 'This page has wandered off.', 'raavanaapost' ); ?></h1>
		<p><?php esc_html_e( 'The link may be old, or the story may have moved. Try a search, or start again from the front page.', 'raavanaapost' ); ?></p>
		<?php get_search_form(); ?>
		<p><a class="rp-btn rp-btn--orange" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Go to the front page', 'raavanaapost' ); ?></a></p>
	</div>
</div>
<?php
get_footer();
