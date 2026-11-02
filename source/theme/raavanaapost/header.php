<?php
/**
 * Top of every page: date bar, logo, sections menu, search, latest line.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="rp-skip" href="#rp-main"><?php esc_html_e( 'Skip to the news', 'raavanaapost' ); ?></a>

<div class="rp-topbar">
	<div class="rp-wrap rp-topbar__inner">
		<p class="rp-topbar__date"><span class="rp-topbar__date-long" data-rp-today><?php echo esc_html( wp_date( 'l j F Y' ) ); ?></span><span class="rp-topbar__date-short" data-rp-today-short><?php echo esc_html( wp_date( 'D j M' ) ); ?></span></p>
		<nav class="rp-topbar__links" aria-label="<?php esc_attr_e( 'Quick links', 'raavanaapost' ); ?>">
			<?php rp_language_links(); ?>
			<?php $rp_needs = rp_page_url( 'needs' ); ?>
			<?php if ( $rp_needs ) : ?>
				<a href="<?php echo esc_url( rp_soon_url( $rp_needs ) ); ?>"><?php esc_html_e( 'Needs we follow', 'raavanaapost' ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<?php endif; ?>
			<?php $rp_report = rp_page_url( 'report' ); ?>
			<?php if ( $rp_report ) : ?>
				<a href="<?php echo esc_url( rp_soon_url( $rp_report ) ); ?>"><?php esc_html_e( 'Report a need', 'raavanaapost' ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
			<?php endif; ?>
			<?php $rp_brief = rp_page_url( 'brief' ); ?>
			<?php if ( $rp_brief ) : ?>
				<a class="rp-btn rp-btn--gold rp-btn--sm" href="<?php echo esc_url( $rp_brief ); ?>"><?php esc_html_e( 'Morning brief', 'raavanaapost' ); ?></a>
			<?php endif; ?>
		</nav>
	</div>
</div>

<header class="rp-masthead">
	<div class="rp-wrap rp-masthead__inner">
		<div class="rp-brand">
			<?php rp_logo(); ?>
			<?php rp_partner_logo(); ?>
		</div>
	<nav class="rp-nav" aria-label="<?php esc_attr_e( 'Sections', 'raavanaapost' ); ?>">
		<div class="rp-nav__scroll-area">
			<div class="rp-nav__row">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'container'      => false,
						'menu_class'     => 'rp-nav__list',
						'depth'          => 1,
						'fallback_cb'    => 'rp_nav_fallback',
					)
				);
				?>
				<button class="rp-nav__search" type="button" aria-expanded="false" aria-controls="rp-search">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
					<span class="screen-reader-text"><?php esc_html_e( 'Search', 'raavanaapost' ); ?></span>
				</button>
			</div>
		</div>
	</nav>
	</div>
	<div class="rp-search" id="rp-search" hidden>
		<div class="rp-wrap"><?php get_search_form(); ?></div>
	</div>
</header>

<?php rp_latest_strip(); ?>

<main id="rp-main" class="rp-main" tabindex="-1">
