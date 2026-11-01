<?php
/**
 * Theme setup, assets and small behaviours.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$GLOBALS['content_width'] = 760;

add_action(
	'after_setup_theme',
	function () {
		load_theme_textdomain( 'raavanaapost', RP_DIR . '/languages' );

		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'automatic-feed-links' );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'align-wide' );
		add_theme_support( 'wp-block-styles' );
		add_theme_support(
			'html5',
			array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
		);
		add_theme_support(
			'custom-logo',
			array(
				'height'      => 466,
				'width'       => 1400,
				'flex-height' => true,
				'flex-width'  => true,
			)
		);
		add_theme_support( 'editor-styles' );
		add_editor_style( array( 'assets/css/editor.css' ) );
		add_theme_support(
			'editor-color-palette',
			array(
				array(
					'name'  => __( 'Raavanaa green', 'raavanaapost' ),
					'slug'  => 'rp-green',
					'color' => '#0B3D22',
				),
				array(
					'name'  => __( 'Crown gold', 'raavanaapost' ),
					'slug'  => 'rp-gold',
					'color' => '#C98A1E',
				),
				array(
					'name'  => __( 'Post orange', 'raavanaapost' ),
					'slug'  => 'rp-orange',
					'color' => '#B8440A',
				),
				array(
					'name'  => __( 'Ink', 'raavanaapost' ),
					'slug'  => 'rp-ink',
					'color' => '#13251B',
				),
				array(
					'name'  => __( 'Leaf', 'raavanaapost' ),
					'slug'  => 'rp-leaf',
					'color' => '#EEF4EF',
				),
				array(
					'name'  => __( 'White', 'raavanaapost' ),
					'slug'  => 'rp-white',
					'color' => '#FFFFFF',
				),
			)
		);

		register_nav_menus(
			array(
				'primary' => __( 'Sections (top of every page)', 'raavanaapost' ),
				'footer'  => __( 'About links (footer)', 'raavanaapost' ),
			)
		);

		add_image_size( 'rp-wide', 1280, 720, true );
		add_image_size( 'rp-card', 640, 480, true );
		add_image_size( 'rp-thumb', 240, 240, true );

		add_post_type_support( 'page', 'excerpt' );
	}
);

add_action(
	'wp_enqueue_scripts',
	function () {
		wp_enqueue_style( 'raavanaapost', RP_URI . '/assets/css/main.css', array(), RP_VERSION );
		wp_enqueue_script(
			'raavanaapost',
			RP_URI . '/assets/js/main.js',
			array(),
			RP_VERSION,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
		if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
			wp_enqueue_script( 'comment-reply' );
		}
	}
);

/* Load the two brand fonts early so headlines don't jump. */
add_action(
	'wp_head',
	function () {
		foreach ( array( 'rozha-one-latin.woff2', 'catamaran-latin.woff2' ) as $font ) {
			printf(
				'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
				esc_url( RP_URI . '/assets/fonts/' . $font )
			);
		}
		printf( '<meta name="theme-color" content="#0B3D22">' . "\n" );
	},
	1
);

/* Title, summary and picture for search engines and for links shared on WhatsApp or Facebook. */
add_action(
	'wp_head',
	function () {
		if ( defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || class_exists( 'All_in_One_SEO_Pack' ) ) {
			return;
		}
		$type  = 'website';
		$image = rp_img( 'raavanaapost-logo.png' );
		$title = get_bloginfo( 'name' );
		$desc  = get_bloginfo( 'description' );
		$url   = home_url( '/' );
		if ( is_singular() ) {
			$p     = get_queried_object();
			$type  = 'post' === $p->post_type ? 'article' : 'website';
			$title = get_the_title( $p );
			$desc  = has_excerpt( $p ) ? get_the_excerpt( $p ) : wp_trim_words( wp_strip_all_tags( strip_shortcodes( $p->post_content ) ), 30, '…' );
			$url   = get_permalink( $p );
			if ( has_post_thumbnail( $p ) ) {
				$image = get_the_post_thumbnail_url( $p, 'rp-wide' );
			}
		} elseif ( is_category() || is_tag() ) {
			$term  = get_queried_object();
			$title = $term->name;
			$desc  = $term->description ? $term->description : $desc;
			$url   = get_term_link( $term );
		}
		$desc = trim( wp_strip_all_tags( $desc ) );
		if ( $desc ) {
			printf( '<meta name="description" content="%s">' . "\n", esc_attr( $desc ) );
		}
		$tags = array(
			'og:site_name'   => get_bloginfo( 'name' ),
			'og:type'        => $type,
			'og:title'       => $title,
			'og:description' => $desc,
			'og:url'         => $url,
			'og:image'       => $image,
		);
		foreach ( $tags as $key => $value ) {
			if ( $value ) {
				printf( '<meta property="%s" content="%s">' . "\n", esc_attr( $key ), esc_attr( $value ) );
			}
		}
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	},
	3
);

/* Use the crown as the browser tab icon when no Site Icon has been chosen. */
add_action(
	'wp_head',
	function () {
		if ( ! has_site_icon() ) {
			printf( '<link rel="icon" href="%s">' . "\n", esc_url( RP_URI . '/assets/img/crown.png' ) );
		}
	},
	2
);

/* Phones never need a photo wider than 1024 pixels; bigger ones only slow the page. */
add_filter(
	'max_srcset_image_width',
	function () {
		return 1024;
	}
);

add_filter(
	'excerpt_length',
	function () {
		return 32;
	}
);

add_filter(
	'excerpt_more',
	function () {
		return '&hellip;';
	}
);

/* Menus are printed twice (header and footer), so drop the duplicate item ids. */
add_filter( 'nav_menu_item_id', '__return_empty_string' );

/* Count story views for the "Most read" list. Editors and bots are not counted. */
add_action(
	'template_redirect',
	function () {
		if ( ! is_singular( 'post' ) || is_preview() || current_user_can( 'edit_posts' ) ) {
			return;
		}
		$agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
		if ( '' === $agent || preg_match( '/bot|crawl|spider|slurp|preview/i', $agent ) ) {
			return;
		}
		$id = get_queried_object_id();
		update_post_meta( $id, 'rp_views', (int) get_post_meta( $id, 'rp_views', true ) + 1 );
	}
);

/* Each section in the top menu gets its small icon above the name. */
add_filter(
	'nav_menu_item_title',
	function ( $title, $item, $args ) {
		if ( ! isset( $args->theme_location ) || 'primary' !== $args->theme_location ) {
			return $title;
		}
		$key = untrailingslashit( $item->url ) === untrailingslashit( home_url( '/' ) ) ? 'home' : '';
		if ( ! $key && 'category' === $item->object ) {
			$term = get_term( (int) $item->object_id, 'category' );
			$key  = ( $term && ! is_wp_error( $term ) ) ? $term->slug : '';
		}
		$icon = rp_menu_icon( $key );
		return $icon ? $icon . '<span class="rp-nav__label">' . $title . '</span>' : $title;
	},
	10,
	3
);
