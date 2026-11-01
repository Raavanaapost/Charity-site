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

<footer class="rp-footer">
	<div class="rp-footer__laurel">
		<?php rp_orn_line( 'l' ); ?>
		<img src="<?php echo esc_url( rp_img( 'laurel-shield.png' ) ); ?>" alt="" width="340" height="117" loading="lazy">
		<?php rp_orn_line( 'r' ); ?>
	</div>

	<div class="rp-wrap rp-footer__main">
		<div class="rp-footer__brand">
			<img class="rp-footer__king" src="<?php echo esc_url( rp_img( 'king.png' ) ); ?>" alt="" width="417" height="463" loading="lazy">
			<div>
				<p class="rp-wordmark"><?php echo rp_wordmark(); // phpcs:ignore WordPress.Security.EscapeOutput ?></p>
				<p class="rp-footer__tagline"><?php echo esc_html( get_bloginfo( 'description' ) ); ?></p>
				<p class="rp-footer__about"><?php echo esc_html( rp_mod( 'rp_footer_about' ) ); ?></p>
				<?php rp_social_links(); ?>
			</div>
		</div>

		<div class="rp-footer__menus">
			<nav aria-labelledby="rp-f-sections">
				<h2 id="rp-f-sections"><?php esc_html_e( 'Sections', 'raavanaapost' ); ?></h2>
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'container'      => false,
						'menu_class'     => 'rp-footer__list',
						'depth'          => 1,
						'fallback_cb'    => 'rp_nav_fallback',
					)
				);
				?>
			</nav>
			<nav aria-labelledby="rp-f-about">
				<h2 id="rp-f-about"><?php esc_html_e( 'About us', 'raavanaapost' ); ?></h2>
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'footer',
						'container'      => false,
						'menu_class'     => 'rp-footer__list',
						'depth'          => 1,
						'fallback_cb'    => 'rp_footer_fallback',
					)
				);
				?>
			</nav>
			<?php if ( $rp_report || $rp_needs || $rp_brief ) : ?>
				<nav aria-labelledby="rp-f-involved">
					<h2 id="rp-f-involved"><?php esc_html_e( 'Get involved', 'raavanaapost' ); ?></h2>
					<ul class="rp-footer__list">
						<?php if ( $rp_report ) : ?>
							<li><a href="<?php echo esc_url( $rp_report ); ?>"><?php esc_html_e( 'Report a need', 'raavanaapost' ); ?></a></li>
						<?php endif; ?>
						<?php if ( $rp_needs ) : ?>
							<li><a href="<?php echo esc_url( $rp_needs ); ?>"><?php esc_html_e( 'Needs we are following', 'raavanaapost' ); ?></a></li>
						<?php endif; ?>
						<?php if ( $rp_brief ) : ?>
							<li><a href="<?php echo esc_url( $rp_brief ); ?>"><?php esc_html_e( 'The morning brief', 'raavanaapost' ); ?></a></li>
						<?php endif; ?>
					</ul>
				</nav>
			<?php endif; ?>
		</div>
	</div>

	<div class="rp-footer__bottom">
		<div class="rp-wrap rp-footer__bottom-inner">
			<p>&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php echo esc_html( get_bloginfo( 'name' ) ); ?></p>
			<?php if ( function_exists( 'get_the_privacy_policy_link' ) ) : ?>
				<p><?php the_privacy_policy_link(); ?></p>
			<?php endif; ?>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
