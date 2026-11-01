<?php
/**
 * Small building blocks used by the templates.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** URL of an image that ships with the theme. */
function rp_img( $file ) {
	return RP_URI . '/assets/img/' . $file;
}

/** The three stages a community need moves through. */
function rp_stages() {
	return array(
		'reported' => __( 'Initiated', 'raavanaapost' ),
		'help'     => __( 'Activated', 'raavanaapost' ),
		'solved'   => __( 'Impact', 'raavanaapost' ),
	);
}

/** A story's need stage, or '' when it isn't a need story. */
function rp_stage( $post = null ) {
	$post  = get_post( $post );
	$stage = $post ? (string) get_post_meta( $post->ID, 'rp_stage', true ) : '';
	return array_key_exists( $stage, rp_stages() ) ? $stage : '';
}

/** Town or city shown above a headline. Falls back to the section name. */
function rp_place( $post = null ) {
	$post  = get_post( $post );
	$place = trim( (string) get_post_meta( $post->ID, 'rp_place', true ) );
	if ( '' === $place ) {
		$cats = get_the_category( $post->ID );
		if ( $cats ) {
			$place = $cats[0]->name;
		}
	}
	return $place;
}

/** Who wrote it. */
function rp_byline( $post = null ) {
	$post = get_post( $post );
	$by   = trim( (string) get_post_meta( $post->ID, 'rp_byline', true ) );
	if ( '' === $by ) {
		$by = get_the_author_meta( 'display_name', $post->post_author );
	}
	return $by;
}

/** "2 hours ago", "Yesterday" or a date. */
function rp_when( $post = null ) {
	$post = get_post( $post );
	$diff = max( 0, time() - (int) get_post_time( 'U', true, $post ) );
	if ( $diff < HOUR_IN_SECONDS ) {
		$m = max( 1, (int) round( $diff / MINUTE_IN_SECONDS ) );
		/* translators: %s: number of minutes */
		return sprintf( _n( '%s minute ago', '%s minutes ago', $m, 'raavanaapost' ), number_format_i18n( $m ) );
	}
	if ( $diff < DAY_IN_SECONDS ) {
		$h = (int) floor( $diff / HOUR_IN_SECONDS );
		/* translators: %s: number of hours */
		return sprintf( _n( '%s hour ago', '%s hours ago', $h, 'raavanaapost' ), number_format_i18n( $h ) );
	}
	if ( $diff < 2 * DAY_IN_SECONDS ) {
		return __( 'Yesterday', 'raavanaapost' );
	}
	return get_the_date( '', $post );
}

/** A <time> element with the friendly date. */
function rp_time_tag( $post = null ) {
	$post = get_post( $post );
	return sprintf(
		'<time datetime="%s" data-rp-when>%s</time>',
		esc_attr( get_post_time( 'c', true, $post ) ),
		esc_html( get_the_date( '', $post ) )
	);
}

/** Picture for a story, or the green-and-gold crown panel when it has none. */
function rp_media( $post = null, $size = 'rp-card', $ratio = '4-3', $eager = false ) {
	$post = get_post( $post );
	echo '<a class="rp-media rp-media--' . esc_attr( $ratio ) . '" href="' . esc_url( get_permalink( $post ) ) . '" tabindex="-1" aria-hidden="true">';
	if ( has_post_thumbnail( $post ) ) {
		$attrs = $eager ? array( 'loading' => 'eager', 'fetchpriority' => 'high' ) : array( 'loading' => 'lazy' );
		echo get_the_post_thumbnail( $post, $size, $attrs ); // phpcs:ignore WordPress.Security.EscapeOutput
	} else {
		echo '<span class="rp-ph"><img src="' . esc_url( rp_img( 'crown.png' ) ) . '" alt="" width="330" height="207" loading="lazy"></span>';
	}
	echo '</a>';
}

/** Tapered gold line, like the one under the wordmark in the logo. */
function rp_swoosh( $class = '' ) {
	static $n = 0;
	$n++;
	$id = 'rp-sw-' . $n;
	printf(
		'<svg class="rp-swoosh %1$s" viewBox="0 0 600 16" aria-hidden="true" focusable="false"><defs><linearGradient id="%2$s" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#C98A1E" stop-opacity="0"/><stop offset=".22" stop-color="#C98A1E"/><stop offset=".55" stop-color="#E9C25A"/><stop offset="1" stop-color="#C98A1E" stop-opacity=".15"/></linearGradient></defs><path d="M0 9 C 140 3, 330 1, 600 7 C 330 6, 140 11, 0 9 Z" fill="url(#%2$s)"/></svg>',
		esc_attr( $class ),
		esc_attr( $id )
	);
}

/** Ornamental line with a ruby diamond at its outer end, as on the logo. */
function rp_orn_line( $side = 'l' ) {
	if ( 'l' === $side ) {
		echo '<span class="rp-orn-line" aria-hidden="true"><i></i><b></b></span>';
	} else {
		echo '<span class="rp-orn-line rp-orn-line--r" aria-hidden="true"><b></b><i></i></span>';
	}
}

/** Section heading: small crown, title, gold rule, "More" link. */
function rp_section_head( $title, $args = array() ) {
	$a   = wp_parse_args(
		$args,
		array(
			'id'         => '',
			'more_url'   => '',
			'more_label' => '',
			'tag'        => 'h2',
		)
	);
	$tag = in_array( $a['tag'], array( 'h1', 'h2', 'h3' ), true ) ? $a['tag'] : 'h2';
	echo '<header class="rp-sec-head">';
	echo '<img class="rp-sec-head__crown" src="' . esc_url( rp_img( 'crown.png' ) ) . '" alt="" width="330" height="207">';
	printf(
		'<%1$s class="rp-sec-head__title"%2$s>%3$s</%1$s>',
		$tag, // phpcs:ignore WordPress.Security.EscapeOutput
		$a['id'] ? ' id="' . esc_attr( $a['id'] ) . '"' : '',
		esc_html( $title )
	);
	echo '<span class="rp-sec-head__rule" aria-hidden="true"><span></span><i></i></span>';
	if ( $a['more_url'] ) {
		printf( '<a class="rp-sec-head__more" href="%s">%s</a>', esc_url( $a['more_url'] ), esc_html( $a['more_label'] ) );
	}
	echo '</header>';
}

/** Big centred page heading with the crown and scrollwork from the logo. */
function rp_hero( $title, $html = '', $tag = 'h1' ) {
	echo '<header class="rp-hero">';
	echo '<img class="rp-hero__crown" src="' . esc_url( rp_img( 'crown-scroll.png' ) ) . '" alt="" width="795" height="225">';
	printf( '<%1$s class="rp-hero__title">%2$s</%1$s>', $tag === 'h2' ? 'h2' : 'h1', esc_html( $title ) );
	rp_swoosh( 'rp-hero__swoosh' );
	if ( $html ) {
		echo '<div class="rp-hero__text">' . wp_kses_post( $html ) . '</div>';
	}
	echo '</header>';
}

/** Where a need stands: three diamonds on a gold line. */
function rp_tracker( $post = null, $tone = 'dark' ) {
	$stage = rp_stage( $post );
	if ( ! $stage ) {
		return;
	}
	$steps = rp_stages();
	$keys  = array_keys( $steps );
	$at    = (int) array_search( $stage, $keys, true );
	printf( '<div class="rp-track rp-track--%s rp-track--at-%d">', esc_attr( $tone ), (int) $at );
	echo '<ol class="rp-track__steps" aria-label="' . esc_attr__( 'Where this need stands', 'raavanaapost' ) . '">';
	foreach ( $keys as $i => $key ) {
		$class = $i < $at ? 'is-done' : ( $i === $at ? 'is-current' : 'is-next' );
		printf(
			'<li class="%s"%s><i aria-hidden="true"></i><span>%s</span></li>',
			esc_attr( $class ),
			$i === $at ? ' aria-current="step"' : '',
			esc_html( $steps[ $key ] )
		);
	}
	echo '</ol></div>';
}

/** One line on the latest change, led by the stage name. */
function rp_need_update( $post = null ) {
	$post   = get_post( $post );
	$stage  = rp_stage( $post );
	$update = trim( (string) get_post_meta( $post->ID, 'rp_update', true ) );
	if ( ! $stage ) {
		return;
	}
	$steps = rp_stages();
	echo '<p class="rp-need__update"><strong>' . esc_html( $steps[ $stage ] ) . '.</strong>';
	if ( $update ) {
		echo ' ' . esc_html( $update );
	}
	echo '</p>';
}

/**
 * A story card.
 *
 * Variants: grid, side, feature, big, list, voice, need.
 */
function rp_card( $post, $variant = 'grid', $heading = 'h3' ) {
	$post    = get_post( $post );
	$heading = in_array( $heading, array( 'h1', 'h2', 'h3', 'h4' ), true ) ? $heading : 'h3';
	$link    = esc_url( get_permalink( $post ) );
	$title   = esc_html( get_the_title( $post ) );
	$place   = rp_place( $post );

	switch ( $variant ) {
		case 'side':
			echo '<article class="rp-card rp-card--side"><div class="rp-card__body">';
			if ( $place ) {
				echo '<p class="rp-kicker">' . esc_html( $place ) . '</p>';
			}
			printf( '<%1$s class="rp-card__title"><a href="%2$s">%3$s</a></%1$s>', $heading, $link, $title ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<p class="rp-meta">' . rp_time_tag( $post ) . '</p></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
			rp_media( $post, 'rp-thumb', '1-1' );
			echo '</article>';
			break;

		case 'feature':
			echo '<article class="rp-card rp-card--feature">';
			rp_media( $post, 'rp-card', '4-3' );
			echo '<div class="rp-card__body">';
			if ( $place ) {
				echo '<p class="rp-kicker">' . esc_html( $place ) . '</p>';
			}
			printf( '<%1$s class="rp-card__title"><a href="%2$s">%3$s</a></%1$s>', $heading, $link, $title ); // phpcs:ignore WordPress.Security.EscapeOutput
			if ( has_excerpt( $post ) ) {
				echo '<p class="rp-card__text">' . esc_html( get_the_excerpt( $post ) ) . '</p>';
			}
			echo '<p class="rp-byline"><span class="rp-byline__name">' . esc_html( rp_byline( $post ) ) . '</span>, ' . rp_time_tag( $post ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</div></article>';
			break;

		case 'list':
			echo '<article class="rp-card rp-card--list">';
			if ( $place ) {
				echo '<p class="rp-kicker">' . esc_html( $place ) . '</p>';
			}
			printf( '<%1$s class="rp-card__title"><a href="%2$s">%3$s</a></%1$s>', $heading, $link, $title ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</article>';
			break;

		case 'voice':
			$by = rp_byline( $post );
			echo '<article class="rp-voice">';
			printf( '<%1$s class="rp-voice__title"><a href="%2$s">%3$s</a></%1$s>', $heading, $link, $title ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<p class="rp-voice__by"><span class="rp-voice__initial" aria-hidden="true">' . esc_html( function_exists( 'mb_substr' ) ? mb_substr( $by, 0, 1 ) : substr( $by, 0, 1 ) ) . '</span>';
			echo '<span><b>' . esc_html( $by ) . '</b>' . rp_time_tag( $post ) . '</span></p>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</article>';
			break;

		case 'need':
			echo '<article class="rp-need">';
			if ( $place ) {
				echo '<p class="rp-need__place">' . esc_html( $place ) . '</p>';
			}
			printf( '<%1$s class="rp-need__title"><a href="%2$s">%3$s</a></%1$s>', $heading, $link, $title ); // phpcs:ignore WordPress.Security.EscapeOutput
			rp_tracker( $post, 'light' );
			rp_need_update( $post );
			echo '</article>';
			break;

		case 'big':
			echo '<article class="rp-card rp-card--big">';
			rp_media( $post, 'rp-wide', '16-9' );
			if ( $place ) {
				echo '<p class="rp-kicker">' . esc_html( $place ) . '</p>';
			}
			printf( '<%1$s class="rp-card__title"><a href="%2$s">%3$s</a></%1$s>', $heading, $link, $title ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<p class="rp-meta">' . rp_time_tag( $post ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</article>';
			break;

		default:
			echo '<article class="rp-card rp-card--grid">';
			rp_media( $post, 'rp-card', '4-3' );
			if ( $place ) {
				echo '<p class="rp-kicker">' . esc_html( $place ) . '</p>';
			}
			printf( '<%1$s class="rp-card__title"><a href="%2$s">%3$s</a></%1$s>', $heading, $link, $title ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<p class="rp-meta">' . rp_time_tag( $post ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</article>';
	}
}

/**
 * Fetch stories for the front page without repeating any already shown.
 */
function rp_take( $args ) {
	global $rp_shown;
	if ( ! is_array( $rp_shown ) ) {
		$rp_shown = array();
	}
	$args  = wp_parse_args(
		$args,
		array(
			'numberposts'         => 4,
			'post_type'           => 'post',
			'ignore_sticky_posts' => true,
			'post__not_in'        => $rp_shown,
		)
	);
	$posts = get_posts( $args );
	foreach ( $posts as $p ) {
		$rp_shown[] = $p->ID;
	}
	return $posts;
}

/** A category by slug, only if it exists. */
function rp_cat( $slug ) {
	$cat = get_category_by_slug( $slug );
	return ( $cat && ! is_wp_error( $cat ) ) ? $cat : null;
}

/** Link to one of the theme's special pages: report, brief or needs. */
function rp_page_url( $key ) {
	static $cache = array();
	if ( 'report' === $key && rp_mod( 'rp_report_url' ) ) {
		return rp_mod( 'rp_report_url' );
	}
	if ( isset( $cache[ $key ] ) ) {
		return $cache[ $key ];
	}
	$templates = array(
		'report' => 'page-templates/report-a-need.php',
		'brief'  => 'page-templates/morning-brief.php',
		'needs'  => 'page-templates/needs.php',
	);
	$url = '';
	if ( isset( $templates[ $key ] ) ) {
		$pages = get_posts(
			array(
				'post_type'   => 'page',
				'numberposts' => 1,
				'meta_key'    => '_wp_page_template', // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value'  => $templates[ $key ], // phpcs:ignore WordPress.DB.SlowDBQuery
				'post_status' => 'publish',
			)
		);
		if ( $pages ) {
			$url = get_permalink( $pages[0] );
		}
	}
	$cache[ $key ] = $url;
	return $url;
}

/** The logo: the one chosen in Customizer, or the RaavanaaPost logo. */
function rp_logo() {
	$name = get_bloginfo( 'name' );
	$desc = get_bloginfo( 'description' );
	if ( has_custom_logo() ) {
		$img = wp_get_attachment_image(
			(int) get_theme_mod( 'custom_logo' ),
			'full',
			false,
			array(
				'class' => 'rp-logo__img',
				'alt'   => $name,
			)
		);
	} else {
		/* A smaller copy of the logo for phones. */
		$img = sprintf(
			'<img class="rp-logo__img" src="%1$s" srcset="%2$s 720w, %1$s 1280w" sizes="(max-width: 720px) 128px, (max-width: 990px) 190px, 300px" width="1280" height="427" alt="%3$s">',
			esc_url( rp_img( 'raavanaapost-logo.png' ) ),
			esc_url( rp_img( 'raavanaapost-logo-720.png' ) ),
			esc_attr( trim( $name . '. ' . $desc, ' .' ) )
		);
	}
	printf( '<a class="rp-logo" href="%s" rel="home">%s</a>', esc_url( home_url( '/' ) ), $img ); // phpcs:ignore WordPress.Security.EscapeOutput
}

/** The site name set in the logo's two colours. */
function rp_wordmark() {
	$name = get_bloginfo( 'name' );
	if ( preg_match( '/^(.+?)(Post)$/u', $name, $m ) ) {
		return esc_html( $m[1] ) . '<span>' . esc_html( $m[2] ) . '</span>';
	}
	return esc_html( $name );
}

/** Sections menu used when no menu has been set yet. */
function rp_nav_fallback( $args = array() ) {
	$class = isset( $args['menu_class'] ) ? $args['menu_class'] : 'rp-nav__list';
	$order = array( 'community-needs', 'real-impact', 'sri-lanka', 'canada', 'diaspora', 'culture', 'sports', 'opinion' );
	$cats  = get_categories(
		array(
			'hide_empty' => true,
			'exclude'    => array( (int) get_option( 'default_category' ) ),
		)
	);
	usort(
		$cats,
		function ( $a, $b ) use ( $order ) {
			$ia = array_search( $a->slug, $order, true );
			$ib = array_search( $b->slug, $order, true );
			$ia = false === $ia ? 99 : $ia;
			$ib = false === $ib ? 99 : $ib;
			return $ia <=> $ib;
		}
	);
	echo '<ul class="' . esc_attr( $class ) . '">';
	printf(
		'<li class="%s"><a href="%s"%s>%s</a></li>',
		is_front_page() ? 'current-menu-item' : '',
		esc_url( home_url( '/' ) ),
		is_front_page() ? ' aria-current="page"' : '',
		esc_html__( 'Home', 'raavanaapost' )
	);
	foreach ( $cats as $cat ) {
		$current = is_category( $cat->term_id );
		printf(
			'<li class="%s"><a href="%s"%s>%s</a></li>',
			$current ? 'current-cat' : '',
			esc_url( get_category_link( $cat ) ),
			$current ? ' aria-current="page"' : '',
			esc_html( $cat->name )
		);
	}
	echo '</ul>';
}

/** Footer "About us" links used when no footer menu has been set. */
function rp_footer_fallback( $args = array() ) {
	$pages = get_pages( array( 'sort_column' => 'menu_order,post_title' ) );
	$shown = 0;
	echo '<ul class="rp-footer__list">';
	foreach ( $pages as $page ) {
		if ( 0 === strpos( (string) get_page_template_slug( $page ), 'page-templates/' ) || $shown >= 6 ) {
			continue;
		}
		$shown++;
		printf( '<li><a href="%s">%s</a></li>', esc_url( get_permalink( $page ) ), esc_html( get_the_title( $page ) ) );
	}
	echo '</ul>';
}

/** Language switcher: Polylang if installed, otherwise the Tamil link from Customizer. */
function rp_language_links() {
	if ( function_exists( 'pll_the_languages' ) ) {
		$langs = pll_the_languages(
			array(
				'raw'          => 1,
				'hide_current' => 1,
			)
		);
		if ( is_array( $langs ) ) {
			foreach ( $langs as $lang ) {
				printf(
					'<a class="rp-lang" href="%s" lang="%s" hreflang="%s">%s</a>',
					esc_url( $lang['url'] ),
					esc_attr( $lang['locale'] ),
					esc_attr( $lang['locale'] ),
					esc_html( $lang['name'] )
				);
			}
		}
		return;
	}
	$url = rp_mod( 'rp_tamil_url' );
	if ( $url ) {
		printf( '<a class="rp-lang" href="%s" lang="ta">%s</a>', esc_url( $url ), 'தமிழ்' );
	}
}

/** "Latest" line under the menu. */
function rp_latest_strip() {
	if ( ! rp_mod( 'rp_show_latest' ) ) {
		return;
	}
	$posts = get_posts(
		array(
			'numberposts'         => 3,
			'ignore_sticky_posts' => true,
		)
	);
	if ( ! $posts ) {
		return;
	}
	echo '<div class="rp-latest"><div class="rp-wrap rp-latest__inner">';
	echo '<p class="rp-latest__label">' . esc_html__( 'Latest', 'raavanaapost' ) . '</p><ul class="rp-latest__list">';
	foreach ( $posts as $p ) {
		$today = wp_date( 'Y-m-d' ) === get_post_time( 'Y-m-d', false, $p );
		$when  = $today ? get_post_time( get_option( 'time_format' ), false, $p, true ) : get_the_date( 'j M', $p );
		printf(
			'<li><a href="%s"><time datetime="%s" data-rp-clock>%s</time> %s</a></li>',
			esc_url( get_permalink( $p ) ),
			esc_attr( get_post_time( 'c', true, $p ) ),
			esc_html( $when ),
			esc_html( get_the_title( $p ) )
		);
	}
	echo '</ul></div></div>';
}

/** "Most read" box. */
function rp_most_read( $count = 5 ) {
	$posts = get_posts(
		array(
			'numberposts'         => $count,
			'meta_key'            => 'rp_views', // phpcs:ignore WordPress.DB.SlowDBQuery
			'orderby'             => 'meta_value_num',
			'order'               => 'DESC',
			'ignore_sticky_posts' => true,
		)
	);
	if ( count( $posts ) < 3 ) {
		$posts = get_posts(
			array(
				'numberposts' => $count,
				'orderby'     => 'comment_count',
			)
		);
	}
	if ( ! $posts ) {
		return;
	}
	echo '<section class="rp-mostread" aria-labelledby="rp-most-read">';
	echo '<h2 class="rp-mostread__title" id="rp-most-read"><img src="' . esc_url( rp_img( 'crown.png' ) ) . '" alt="" width="330" height="207">' . esc_html( rp_mod( 'rp_mostread_title' ) ) . '</h2><ol>';
	foreach ( $posts as $p ) {
		printf( '<li><a href="%s">%s</a></li>', esc_url( get_permalink( $p ) ), esc_html( get_the_title( $p ) ) );
	}
	echo '</ol></section>';
}

/** Social links from Customizer. */
function rp_social_links() {
	$links = array(
		'rp_facebook'  => 'Facebook',
		'rp_instagram' => 'Instagram',
		'rp_youtube'   => 'YouTube',
		'rp_whatsapp'  => 'WhatsApp',
	);
	$out   = '';
	foreach ( $links as $key => $label ) {
		$url = rp_mod( $key );
		if ( $url ) {
			$out .= sprintf( '<li><a href="%s" rel="noopener">%s</a></li>', esc_url( $url ), esc_html( $label ) );
		}
	}
	if ( $out ) {
		echo '<ul class="rp-social" aria-label="' . esc_attr__( 'Follow us', 'raavanaapost' ) . '">' . $out . '</ul>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}

/** Share buttons under a story. */
function rp_share_links() {
	$url   = get_permalink();
	$title = get_the_title();
	$enc_u = rawurlencode( $url );
	$enc_t = rawurlencode( $title );
	echo '<div class="rp-share"><p class="rp-share__label">' . esc_html__( 'Share this story', 'raavanaapost' ) . '</p>';
	printf( '<a href="%s" rel="noopener" target="_blank">WhatsApp</a>', esc_url( 'https://wa.me/?text=' . $enc_t . '%20' . $enc_u ) );
	printf( '<a href="%s" rel="noopener" target="_blank">Facebook</a>', esc_url( 'https://www.facebook.com/sharer/sharer.php?u=' . $enc_u ) );
	printf( '<a href="%s" rel="noopener" target="_blank">X</a>', esc_url( 'https://x.com/intent/post?url=' . $enc_u . '&text=' . $enc_t ) );
	printf( '<a href="%s">%s</a>', esc_url( 'mailto:?subject=' . $enc_t . '&body=' . $enc_u ), esc_html__( 'Email', 'raavanaapost' ) );
	printf(
		'<button type="button" data-rp-copy="%s" data-done="%s">%s</button>',
		esc_attr( $url ),
		esc_attr__( 'Link copied', 'raavanaapost' ),
		esc_html__( 'Copy link', 'raavanaapost' )
	);
	echo '</div>';
}

/** Page numbers. */
function rp_pagination( $query = null, $base_url = '' ) {
	global $wp_query;
	$query = $query ? $query : $wp_query;
	if ( $query->max_num_pages < 2 ) {
		return;
	}
	$args = array(
		'total'     => $query->max_num_pages,
		'current'   => max( 1, (int) get_query_var( 'paged' ), (int) get_query_var( 'page' ) ),
		'prev_text' => __( 'Newer', 'raavanaapost' ),
		'next_text' => __( 'Older', 'raavanaapost' ),
		'mid_size'  => 1,
	);
	if ( $base_url ) {
		$args['base']   = esc_url_raw( add_query_arg( 'pg', '%#%', $base_url ) );
		$args['format'] = '';
		$args['current'] = max( 1, isset( $_GET['pg'] ) ? absint( $_GET['pg'] ) : 1 ); // phpcs:ignore WordPress.Security.NonceVerification
	}
	echo '<nav class="rp-pagination" aria-label="' . esc_attr__( 'More pages', 'raavanaapost' ) . '"><div class="nav-links">';
	echo paginate_links( $args ); // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</div></nav>';
}

/**
 * A small line icon for a section in the top menu, chosen by the section's web address.
 *
 * @param string $key Section slug, or 'home'.
 */
function rp_menu_icon( $key ) {
	$icons = array(
		'home' => '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9v12h4.5v-6h4v6h4.5V9"/>',
		'community-needs' => '<path d="M12 8.2c-1-2-4.5-1.7-4.5.7 0 1.8 2.3 3.2 4.5 5 2.2-1.8 4.5-3.2 4.5-5 0-2.4-3.5-2.7-4.5-.7z"/><path d="M2.5 18.5h3l4 2h7l4.8-3.8c.8-.7.2-1.9-.9-1.6l-4.4 1.4h-4"/>',
		'real-impact' => '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
		'sri-lanka' => '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
		'diaspora' => '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
		'culture' => '<path d="M12 2.5c1.6 1.8 2 3.2 0 5-2-1.8-1.6-3.2 0-5z"/><path d="M5.5 9.5h13c-.5 2.3-3 3.6-6.5 3.6s-6-1.3-6.5-3.6z"/><path d="M12 13.1V18"/><path d="M7.5 21h9l-1.6-3H9.1z"/>',
		'sports' => '<path d="M8.5 3c1.4 0 2 1.4 1.4 3.2-.3.9-.3 1.6.4 2.6 1 1.6 1.5 3.6 1.2 6.2L11 21H6l-.5-6c-.3-2.6.2-4.6 1.2-6.2.7-1 .7-1.7.4-2.6C6.5 4.4 7.1 3 8.5 3z"/><circle cx="17.5" cy="16.5" r="4"/><path d="M16.6 14.8h.01M18.6 15.2h.01M17.6 17h.01"/>',
		'opinion' => '<path d="M4 4.5h16v11.5H10l-4.5 4v-4H4z"/><path d="M8 8.5h8M8 12h5"/>',
	);
	if ( ! isset( $icons[ $key ] ) ) {
		return '';
	}
	return '<svg class="rp-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $icons[ $key ] . '</svg>';
}
