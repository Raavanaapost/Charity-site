<?php
/**
 * Search box.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$rp_id = wp_unique_id( 'rp-s-' );
?>
<form role="search" method="get" class="rp-searchform" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="screen-reader-text" for="<?php echo esc_attr( $rp_id ); ?>"><?php esc_html_e( 'Search the news', 'raavanaapost' ); ?></label>
	<input class="rp-input" type="search" id="<?php echo esc_attr( $rp_id ); ?>" name="s" value="<?php echo esc_attr( get_search_query() ); ?>" placeholder="<?php esc_attr_e( 'Search stories, towns, people', 'raavanaapost' ); ?>">
	<button class="rp-btn rp-btn--green" type="submit"><?php esc_html_e( 'Search', 'raavanaapost' ); ?></button>
</form>
