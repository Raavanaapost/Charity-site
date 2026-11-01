<?php
/**
 * Section pages (categories), tags, authors and dates.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

if ( is_category() || is_tag() || is_tax() ) {
	$rp_title = single_term_title( '', false );
} elseif ( is_author() ) {
	$rp_title = get_the_author_meta( 'display_name', (int) get_query_var( 'author' ) );
} else {
	$rp_title = wp_strip_all_tags( get_the_archive_title() );
}
rp_hero( $rp_title, get_the_archive_description() );

get_template_part( 'template-parts/story-list' );

get_footer();
