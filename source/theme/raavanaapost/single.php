<?php
/**
 * A single story.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

while ( have_posts() ) :
	the_post();
	$rp_cats  = get_the_category();
	$rp_cat   = $rp_cats ? $rp_cats[0] : null;
	$rp_place = trim( (string) get_post_meta( get_the_ID(), 'rp_place', true ) );
	?>
	<article <?php post_class( 'rp-article' ); ?>>
		<header class="rp-wrap rp-wrap--narrow rp-article__head">
			<p class="rp-article__trail">
				<?php if ( $rp_cat ) : ?>
					<a href="<?php echo esc_url( get_category_link( $rp_cat ) ); ?>"><?php echo esc_html( $rp_cat->name ); ?></a>
				<?php endif; ?>
				<?php if ( $rp_place ) : ?>
					<span class="rp-kicker"><?php echo esc_html( $rp_place ); ?></span>
				<?php endif; ?>
			</p>
			<h1 class="rp-article__title"><?php the_title(); ?></h1>
			<?php if ( has_excerpt() ) : ?>
				<p class="rp-article__standfirst"><?php echo esc_html( get_the_excerpt() ); ?></p>
			<?php endif; ?>
			<div class="rp-article__byline">
				<p class="rp-byline"><?php esc_html_e( 'By', 'raavanaapost' ); ?> <span class="rp-byline__name"><?php echo esc_html( rp_byline() ); ?></span></p>
				<p class="rp-byline">
					<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
					<?php if ( get_the_modified_time( 'U' ) - get_the_time( 'U' ) > HOUR_IN_SECONDS ) : ?>
						<span class="rp-article__updated">
							<?php
							/* translators: %s: date */
							printf( esc_html__( 'Updated %s', 'raavanaapost' ), esc_html( get_the_modified_date() ) );
							?>
						</span>
					<?php endif; ?>
				</p>
			</div>
		</header>

		<?php if ( has_post_thumbnail() ) : ?>
			<figure class="rp-wrap rp-article__figure">
				<?php the_post_thumbnail( 'rp-wide', array( 'fetchpriority' => 'high' ) ); ?>
				<?php if ( get_the_post_thumbnail_caption() ) : ?>
					<figcaption><?php the_post_thumbnail_caption(); ?></figcaption>
				<?php endif; ?>
			</figure>
		<?php elseif ( rp_art( get_post() ) ) : ?>
			<figure class="rp-wrap rp-article__figure rp-article__figure--art">
				<img src="<?php echo esc_url( rp_img( 'art/' . rp_art( get_post() ) . '.svg' ) ); ?>" alt="" width="800" height="600" fetchpriority="high">
			</figure>
		<?php endif; ?>

		<div class="rp-wrap rp-wrap--narrow rp-article__body">
			<?php if ( rp_stage() ) : ?>
				<aside class="rp-article__need" aria-labelledby="rp-need-h">
					<h2 id="rp-need-h"><?php esc_html_e( 'Where this need stands', 'raavanaapost' ); ?></h2>
					<?php rp_tracker( null, 'light' ); ?>
					<?php rp_need_update(); ?>
				</aside>
			<?php endif; ?>

			<div class="rp-prose">
				<?php
				the_content();
				wp_link_pages(
					array(
						'before' => '<nav class="rp-pagelinks">' . esc_html__( 'Pages:', 'raavanaapost' ),
						'after'  => '</nav>',
					)
				);
				?>
			</div>

			<p class="rp-article__end" aria-hidden="true"><img src="<?php echo esc_url( rp_img( 'crown.png' ) ); ?>" alt="" width="330" height="207" loading="lazy"></p>

			<?php rp_share_links(); ?>

			<?php
			$rp_tags = get_the_tag_list( '<ul class="rp-tags"><li>', '</li><li>', '</li></ul>' );
			if ( $rp_tags && ! is_wp_error( $rp_tags ) ) {
				echo $rp_tags; // phpcs:ignore WordPress.Security.EscapeOutput
			}
			?>
		</div>
	</article>

	<?php
	if ( $rp_cat ) {
		$rp_related = get_posts(
			array(
				'numberposts'         => 4,
				'cat'                 => $rp_cat->term_id,
				'post__not_in'        => array( get_the_ID() ),
				'ignore_sticky_posts' => true,
			)
		);
		if ( $rp_related ) {
			echo '<section class="rp-wrap rp-section rp-related" aria-labelledby="rp-related-h">';
			rp_section_head(
				/* translators: %s: section name */
				sprintf( __( 'More from %s', 'raavanaapost' ), $rp_cat->name ),
				array(
					'id'         => 'rp-related-h',
					'more_url'   => get_category_link( $rp_cat ),
					'more_label' => __( 'See all', 'raavanaapost' ),
				)
			);
			echo '<div class="rp-grid">';
			foreach ( $rp_related as $rp_p ) {
				rp_card( $rp_p, 'grid', 'h3' );
			}
			echo '</div></section>';
		}
	}

	if ( comments_open() || get_comments_number() ) {
		echo '<div class="rp-wrap rp-wrap--narrow rp-comments-wrap">';
		comments_template();
		echo '</div>';
	}
endwhile;

get_footer();
