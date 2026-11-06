<?php
/**
 * Bottom of every page: laurels, the king, links.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
$rp_report = rp_page_url( 'report' );
$rp_needs  = rp_page_url( 'needs' );
$rp_brief  = rp_page_url( 'brief' );
?>
</main>

<?php /* No big footer on RaavanaaPost (SURESH, 6 Nov 2026); only one thin line with the privacy note. */ ?>
<footer class="rp-footer__bottom">
	<div class="rp-wrap rp-footer__bottom-inner">
		<p>&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php echo esc_html( get_bloginfo( 'name' ) ); ?></p>
		<p class="rp-footer__notes">
			<?php $rp_promise = get_page_by_path( 'our-promise-to-readers' ); ?>
			<?php if ( $rp_promise ) : ?><a href="<?php echo esc_url( get_permalink( $rp_promise ) ); ?>"><?php echo esc_html( get_the_title( $rp_promise ) ); ?></a> · <?php endif; ?>
			<a href="<?php echo esc_url( rp_soon_url( 'https://raavanaa.org/privacy' ) ); ?>"><?php esc_html_e( 'Privacy and child safety', 'raavanaapost' ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</p>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
