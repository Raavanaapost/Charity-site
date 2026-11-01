<?php
/**
 * Fallback list of stories.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
rp_hero( is_home() && get_option( 'page_for_posts' ) ? get_the_title( (int) get_option( 'page_for_posts' ) ) : __( 'Latest news', 'raavanaapost' ) );
get_template_part( 'template-parts/story-list' );
get_footer();
