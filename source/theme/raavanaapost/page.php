<?php
/**
 * A plain page, such as Who we are or Contact us.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

while ( have_posts() ) :
	the_post();
	rp_hero( get_the_title(), has_excerpt() ? '<p>' . esc_html( get_the_excerpt() ) . '</p>' : '' );
	?>
	<div class="rp-wrap rp-wrap--narrow rp-page">
		<div class="rp-prose">
			<?php the_content(); ?>
		</div>
		<p class="rp-article__end" aria-hidden="true"><img src="<?php echo esc_url( rp_img( 'crown.png' ) ); ?>" alt="" width="330" height="207" loading="lazy"></p>
	</div>
	<?php
	if ( comments_open() || get_comments_number() ) {
		echo '<div class="rp-wrap rp-wrap--narrow rp-comments-wrap">';
		comments_template();
		echo '</div>';
	}
endwhile;

get_footer();
