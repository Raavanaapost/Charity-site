<?php
/**
 * A list of stories: the first one large, the rest in a grid.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="rp-wrap rp-archive">
	<?php if ( have_posts() ) : ?>
		<?php
		$rp_i     = 0;
		$rp_first = ! is_paged();
		while ( have_posts() ) :
			the_post();
			if ( 0 === $rp_i && $rp_first ) {
				echo '<div class="rp-archive__lead">';
				rp_card( get_post(), 'feature', 'h2' );
				echo '</div><div class="rp-grid">';
			} elseif ( 0 === $rp_i ) {
				echo '<div class="rp-grid">';
				rp_card( get_post(), 'grid', 'h2' );
			} else {
				rp_card( get_post(), 'grid', 'h2' );
			}
			$rp_i++;
		endwhile;
		echo '</div>';
		rp_pagination();
		?>
	<?php else : ?>
		<div class="rp-nothing">
			<p><?php esc_html_e( 'No stories here yet.', 'raavanaapost' ); ?></p>
			<?php get_search_form(); ?>
		</div>
	<?php endif; ?>
</div>
