<?php
/**
 * Settings for the live RaavanaaPost at raavanaapost.raavanaa.org.
 * Run after load-news.php:  wp eval-file live-settings.php
 */

// Pages the live site doesn't use yet: requests go to raavanaa.org's own form,
// contact goes to raavanaa.org, and there is no morning email yet.
foreach ( array( 'brief', 'report', 'contact' ) as $key ) {
	foreach ( get_posts( array( 'post_type' => 'page', 'meta_key' => 'rp_page', 'meta_value' => $key, 'numberposts' => -1, 'post_status' => 'any' ) ) as $p ) {
		wp_delete_post( $p->ID, true );
	}
}

// Footer "About us" links.
$locations = get_theme_mod( 'nav_menu_locations', array() );
if ( ! empty( $locations['footer'] ) ) {
	wp_delete_nav_menu( $locations['footer'] );
}
$menu = wp_create_nav_menu( 'About links ' . wp_rand( 100, 999 ) );
foreach ( array( 'about', 'promise' ) as $key ) {
	$p = get_posts( array( 'post_type' => 'page', 'meta_key' => 'rp_page', 'meta_value' => $key, 'numberposts' => 1 ) );
	if ( $p ) {
		wp_update_nav_menu_item( $menu, 0, array( 'menu-item-object-id' => $p[0]->ID, 'menu-item-object' => 'page', 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
	}
}
wp_update_nav_menu_item( $menu, 0, array( 'menu-item-title' => 'Contact us', 'menu-item-url' => 'https://raavanaa.org/contact', 'menu-item-type' => 'custom', 'menu-item-status' => 'publish' ) );
wp_update_nav_menu_item( $menu, 0, array( 'menu-item-title' => 'Privacy and child safety', 'menu-item-url' => 'https://raavanaa.org/privacy', 'menu-item-type' => 'custom', 'menu-item-status' => 'publish' ) );
$locations['footer'] = $menu;
set_theme_mod( 'nav_menu_locations', $locations );

set_theme_mod( 'rp_report_url', 'https://raavanaa.org/initiate' );
set_theme_mod( 'rp_partner_url', 'https://raavanaa.org' );
set_theme_mod( 'rp_partner_title', 'Be part of the next day of joy' );
set_theme_mod( 'rp_partner_text', 'Every story here began with a need. See the days that are waiting on raavanaa.org, and help make the next one happen.' );
set_theme_mod( 'rp_partner_button', 'Visit raavanaa.org' );
set_theme_mod( 'rp_mostread_title', "Editor's picks" );

update_option( 'blogname', 'RaavanaaPost' );
update_option( 'blogdescription', 'Community needs. Real impact.' );
update_option( 'date_format', 'j F Y' );
update_option( 'time_format', 'g:i a' );
update_option( 'show_on_front', 'posts' );

WP_CLI::success( 'Live settings applied.' );
