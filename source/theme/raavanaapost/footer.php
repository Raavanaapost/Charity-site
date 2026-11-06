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

<?php /* No footer on RaavanaaPost (SURESH, 6 Nov 2026). */ ?>

<?php wp_footer(); ?>
</body>
</html>
