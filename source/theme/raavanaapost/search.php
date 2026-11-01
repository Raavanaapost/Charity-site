<?php
/**
 * Search results.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

/* translators: %s: what the reader searched for */
rp_hero( get_search_query() ? sprintf( __( 'Search: %s', 'raavanaapost' ), get_search_query() ) : __( 'Search', 'raavanaapost' ) );
?>
<div class="rp-wrap rp-wrap--narrow rp-searchpage">
	<?php get_search_form(); ?>
	<?php if ( have_posts() ) : ?>
		<p class="rp-meta rp-searchpage__count">
			<?php
			global $wp_query;
			/* translators: %s: number of stories found */
			printf( esc_html( _n( '%s story found', '%s stories found', (int) $wp_query->found_posts, 'raavanaapost' ) ), esc_html( number_format_i18n( (int) $wp_query->found_posts ) ) );
			?>
		</p>
		<ul class="rp-results">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<li>
					<?php if ( 'post' === get_post_type() && rp_place() ) : ?>
						<p class="rp-kicker"><?php echo esc_html( rp_place() ); ?></p>
					<?php endif; ?>
					<h2 class="rp-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<p class="rp-card__text"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 28 ) ); ?></p>
					<?php if ( 'post' === get_post_type() ) : ?>
						<p class="rp-meta"><?php echo rp_time_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></p>
					<?php endif; ?>
				</li>
			<?php endwhile; ?>
		</ul>
		<?php rp_pagination(); ?>
	<?php else : ?>
		<p class="rp-nothing"><?php esc_html_e( 'Nothing matched. Try fewer words, or the name of a town.', 'raavanaapost' ); ?></p>
	<?php endif; ?>
</div>
<?php
get_footer();
