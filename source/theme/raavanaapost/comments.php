<?php
/**
 * Comments.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
if ( post_password_required() ) {
	return;
}
?>
<section class="rp-comments" id="comments">
	<?php if ( have_comments() ) : ?>
		<h2 class="rp-comments__title">
			<?php
			/* translators: %s: number of comments */
			printf( esc_html( _n( '%s comment', '%s comments', get_comments_number(), 'raavanaapost' ) ), esc_html( number_format_i18n( get_comments_number() ) ) );
			?>
		</h2>
		<ol class="rp-comments__list">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'short_ping'  => true,
					'avatar_size' => 40,
				)
			);
			?>
		</ol>
		<?php the_comments_navigation(); ?>
	<?php endif; ?>
	<?php
	comment_form(
		array(
			'class_submit' => 'rp-btn rp-btn--green',
			'title_reply'  => __( 'Share your thoughts', 'raavanaapost' ),
		)
	);
	?>
</section>
