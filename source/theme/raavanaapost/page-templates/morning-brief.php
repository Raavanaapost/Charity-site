<?php
/**
 * Template Name: Morning brief sign-up
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
<div class="rp-wrap rp-brief-page">
	<div class="rp-involve__brief">
		<img class="rp-brief-page__crown" src="<?php echo esc_url( rp_img( 'crown.png' ) ); ?>" alt="" width="330" height="207">
		<h2><?php esc_html_e( 'Get it every morning', 'raavanaapost' ); ?></h2>
		<p><?php esc_html_e( 'One short email with the stories that matter to our community. You can stop it any time.', 'raavanaapost' ); ?></p>
		<?php rp_brief_form(); ?>
	</div>
</div>
<?php
get_footer();
