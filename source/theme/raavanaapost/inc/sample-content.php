<?php
/**
 * One-click setup: sections, menus, pages and sample stories.
 * Sample stories are marked so they can be removed in one click later.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'admin_post_rp_samples',
	function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Only the site owner can do this.', 'raavanaapost' ) );
		}
		check_admin_referer( 'rp_samples' );
		$do = isset( $_POST['rp_do'] ) ? sanitize_key( wp_unslash( $_POST['rp_do'] ) ) : '';
		if ( 'remove' === $do ) {
			rp_remove_samples();
			$done = 'removed';
		} else {
			rp_install_samples();
			$done = 'added';
		}
		wp_safe_redirect( admin_url( 'admin.php?page=raavanaapost&rp_done=' . $done ) );
		exit;
	}
);

/** The sections. */
function rp_sample_sections() {
	return array(
		'community-needs' => array( __( 'Community needs', 'raavanaapost' ), __( 'Needs our readers have told us about, and where each one stands.', 'raavanaapost' ) ),
		'real-impact'     => array( __( 'Real impact', 'raavanaapost' ), __( 'Needs that were met, and what changed for the people involved.', 'raavanaapost' ) ),
		'sri-lanka'       => array( __( 'Sri Lanka', 'raavanaapost' ), __( 'News from the North, the East and across the island.', 'raavanaapost' ) ),
		'canada'          => array( __( 'Canada', 'raavanaapost' ), __( 'Tamil community news from Toronto, Scarborough, Markham, Montreal and beyond.', 'raavanaapost' ) ),
		'diaspora'        => array( __( 'Diaspora', 'raavanaapost' ), __( 'Tamil families around the world, and the ties that bring them home.', 'raavanaapost' ) ),
		'culture'         => array( __( 'Culture', 'raavanaapost' ), __( 'Arts, books, food, faith and the traditions we keep alive.', 'raavanaapost' ) ),
		'sports'          => array( __( 'Sports', 'raavanaapost' ), __( 'Community leagues, clubs and the games we love.', 'raavanaapost' ) ),
		'opinion'         => array( __( 'Voices', 'raavanaapost' ), __( 'In their own words: the people behind each day of joy.', 'raavanaapost' ) ),
	);
}

/**
 * Sample stories: title, sections, place, summary, hours ago, stage, update, byline, views, lead.
 */
function rp_sample_stories() {
	return array(
		array( 'Fishing families in Jaffna ask for safer boats before the monsoon', array( 'community-needs', 'sri-lanka' ), 'Jaffna', 'Crews say their old boats keep them on shore whenever the sea turns rough. We spent a week at the harbour asking families what would change that, and we will keep following it.', 2, 'reported', 'We have asked the harbour committee what it would take.', 'Sample reporter', 410, true ),
		array( 'Volunteers pack school kits for children back home', array( 'diaspora', 'canada' ), 'Scarborough', 'Weekend volunteers filled bags with notebooks, pens and geometry sets, ready to travel with families going home this winter.', 3, '', '', 'Sample reporter', 150, false ),
		array( 'A lagoon clean-up brings a whole village out on Saturday', array( 'sri-lanka' ), 'Batticaloa', 'Fishermen, teachers and grandparents spent the morning clearing plastic from the water\'s edge.', 4, '', '', 'Sample reporter', 120, false ),
		array( 'The village library is open again, and the queue started early', array( 'real-impact', 'sri-lanka' ), 'Kilinochchi', 'After a season of leaks, the repaired library opened its doors this week. Readers were waiting before the key turned.', 5, '', '', 'Sample reporter', 350, false ),
		array( 'Fishermen try a shared market to get fairer prices', array( 'sri-lanka' ), 'Trincomalee', 'A group of harbour families now sell their catch together, and say the early signs are good.', 7, '', '', 'Sample reporter', 60, false ),
		array( 'How families are getting ready for Tamil Heritage Month in January', array( 'canada' ), 'Toronto', 'Food, music and stories from home. Community groups across the city are planning a month of events, and they want more young people involved.', 8, '', '', 'Sample reporter', 380, false ),
		array( 'Village well needs a new pump', array( 'community-needs', 'sri-lanka' ), 'Mullaitivu', 'Families walk to a neighbour\'s well each morning since the old pump stopped working.', 9, 'help', 'A local group is raising the cost of the pump.', 'Sample reporter', 220, false ),
		array( 'Farmers swap seeds at the first market of the season', array( 'sri-lanka' ), 'Vavuniya', 'Old varieties changed hands alongside advice on what grew best last year.', 10, '', '', 'Sample reporter', 45, false ),
		array( 'Families ask for a safe crossing on the market road', array( 'community-needs', 'sri-lanka' ), 'Batticaloa', 'Traffic has grown on the main market road, and parents say crossing it has become a worry.', 12, 'reported', 'We have asked the local council when it can respond.', 'Sample reporter', 90, false ),
		array( 'Youth league opens sign-ups for the winter season', array( 'sports' ), 'Scarborough', 'Indoor football and volleyball nights return in December.', 14, '', '', 'Sample reporter', 70, false ),
		array( 'Newcomer seniors need warm coats before winter', array( 'community-needs', 'canada' ), 'Scarborough', 'Many seniors who arrived this year have never faced a Canadian winter, and some have no warm coat.', 15, 'help', 'Two community groups are collecting coats this month.', 'Sample reporter', 260, false ),
		array( 'Help works best when the village decides what it needs', array( 'opinion' ), '', 'The most useful help I have seen started with a question, not a plan.', 18, '', '', 'Guest writer', 140, false ),
		array( 'Free tax help for newcomers runs on Saturday mornings', array( 'canada' ), 'Markham', 'Volunteers help families file their first Canadian tax return.', 22, '', '', 'Sample reporter', 110, false ),
		array( 'Community bowling league crowns its autumn champions', array( 'sports' ), 'Toronto', 'A tense final night, a new team on top, and plenty of friendly rivalry.', 24, '', '', 'Sample reporter', 95, false ),
		array( 'Library roof leaked all through the rains', array( 'community-needs', 'real-impact' ), 'Kilinochchi', 'Books were moved into boxes every time it rained. Readers asked for help to fix the roof.', 26, 'solved', 'The roof is fixed and the library opened its doors again this week.', 'Sample reporter', 300, false ),
		array( 'A Tamil reading class for grown-ups who never got the chance', array( 'canada' ), 'Montreal', 'Adults learning to read and write Tamil meet every Thursday evening.', 28, '', '', 'Sample reporter', 85, false ),
		array( 'Evening music classes return to the town hall', array( 'sri-lanka', 'culture' ), 'Jaffna', 'Veena and mridangam lessons are back, with teachers giving their evenings for free.', 30, '', '', 'Sample reporter', 75, false ),
		array( 'A Tamil seniors\' walking club marks its first year', array( 'canada' ), 'Mississauga', 'Every morning, rain or shine, a group of grandparents walks the same loop and swaps news from home.', 32, '', '', 'Sample reporter', 70, false ),
		array( 'Palmyrah craft makers look for new buyers abroad', array( 'sri-lanka' ), 'Mannar', 'Baskets, mats and boxes made by hand are finding customers overseas.', 34, '', '', 'Sample reporter', 55, false ),
		array( 'Karlakattai, the old club-swinging art, finds new students in Toronto', array( 'culture' ), 'Toronto', 'A traditional Tamil exercise with wooden clubs is drawing all ages to weekend classes.', 36, '', '', 'Sample reporter', 290, false ),
		array( 'Diaspora groups meet to pool support for projects back home', array( 'diaspora' ), 'London', 'Village associations from several countries compared notes on what has worked.', 40, '', '', 'Sample reporter', 65, false ),
		array( 'Northern cricket clubs get ready for the new season', array( 'sports', 'sri-lanka' ), 'Jaffna', 'Nets are up and young players are lining up for trials.', 44, '', '', 'Sample reporter', 80, false ),
		array( 'Our children abroad still need to hear Tamil at home', array( 'opinion' ), '', 'Language lives in kitchens and car rides, not only in classrooms.', 46, '', '', 'Guest writer', 170, false ),
		array( 'A new Tamil novel about two sisters, one in Jaffna and one in Toronto', array( 'culture' ), 'Toronto', 'A first-time writer on distance, letters and the things families leave unsaid.', 50, '', '', 'Sample reporter', 60, false ),
		array( 'Volleyball nights in Scarborough are drawing a bigger crowd', array( 'sports' ), 'Scarborough', 'What began with ten friends now fills the gym every Friday.', 54, '', '', 'Sample reporter', 50, false ),
		array( 'Kolam at the doorstep: the morning ritual young people are learning again', array( 'culture' ), 'Jaffna', 'Rice-flour patterns, drawn before sunrise, are finding a new generation.', 60, '', '', 'Sample reporter', 130, false ),
		array( 'Good news is a story someone followed to the end', array( 'opinion' ), '', 'Why we keep going back to every need we report.', 70, '', '', 'RaavanaaPost editor', 120, false ),
	);
}

/** Wrap text as a paragraph block. */
function rp_p( $text ) {
	return "<!-- wp:paragraph -->\n<p>" . esc_html( $text ) . "</p>\n<!-- /wp:paragraph -->\n\n";
}

/** Create everything. Safe to run twice: nothing is doubled. */
function rp_install_samples() {
	// Sections.
	$cat_ids = array();
	foreach ( rp_sample_sections() as $slug => $info ) {
		$term = get_term_by( 'slug', $slug, 'category' );
		if ( ! $term ) {
			$made = wp_insert_term( $info[0], 'category', array( 'slug' => $slug, 'description' => $info[1] ) );
			$cat_ids[ $slug ] = is_wp_error( $made ) ? 0 : (int) $made['term_id'];
		} else {
			$cat_ids[ $slug ] = (int) $term->term_id;
		}
	}

	// Pages.
	$pages = array(
		'about'   => array(
			__( 'Who we are', 'raavanaapost' ),
			'',
			rp_p( __( 'RaavanaaPost is community news for Tamil families in Sri Lanka, Canada and around the world.', 'raavanaapost' ) )
			. rp_p( __( 'Our promise is in our name: community needs, real impact. We report what communities need, and we keep following each story until something changes.', 'raavanaapost' ) )
			. "<!-- wp:heading -->\n<h2>" . esc_html__( 'Our team', 'raavanaapost' ) . "</h2>\n<!-- /wp:heading -->\n\n"
			. rp_p( __( '[Add a few lines about your team here.]', 'raavanaapost' ) ),
			__( 'Community news that stays with a story until something changes.', 'raavanaapost' ),
		),
		'promise' => array(
			__( 'Our promise to readers', 'raavanaapost' ),
			'',
			rp_p( __( 'We check before we publish. Every need is confirmed by a call or a visit.', 'raavanaapost' ) )
			. rp_p( __( 'We follow up. Each need we report shows its stage: Initiated, Activated or Impact.', 'raavanaapost' ) )
			. rp_p( __( 'We protect children. We use first names only, never home addresses or school names, and we show children\'s faces only with a parent\'s or guardian\'s permission.', 'raavanaapost' ) )
			. rp_p( __( 'We fix our mistakes. If we get something wrong, we correct it and say so at the end of the story.', 'raavanaapost' ) ),
			__( 'How we report, and what you can expect from us.', 'raavanaapost' ),
		),
		'contact' => array(
			__( 'Contact us', 'raavanaapost' ),
			'',
			rp_p( __( 'Email: [your email address]', 'raavanaapost' ) )
			. rp_p( __( 'Phone or WhatsApp: [your number]', 'raavanaapost' ) )
			. rp_p( __( 'Know a need in your community? Use the Report a need page and our team will call you.', 'raavanaapost' ) ),
			__( 'We read every message.', 'raavanaapost' ),
		),
		'report'  => array(
			__( 'Report a need', 'raavanaapost' ),
			'page-templates/report-a-need.php',
			rp_p( __( 'Tell us what your community needs. A reporter will call you, check the facts and keep following it until something changes.', 'raavanaapost' ) ),
			'',
		),
		'brief'   => array(
			__( 'The morning brief', 'raavanaapost' ),
			'page-templates/morning-brief.php',
			rp_p( __( 'The day\'s community stories in your inbox, every morning at 7. In English or Tamil.', 'raavanaapost' ) ),
			'',
		),
		'needs'   => array(
			__( 'Needs we are following', 'raavanaapost' ),
			'page-templates/needs.php',
			rp_p( __( 'Every need we report stays here until it is solved. See where each one stands.', 'raavanaapost' ) ),
			'',
		),
	);
	$page_ids = array();
	foreach ( $pages as $key => $page ) {
		$found = get_posts(
			array(
				'post_type'   => 'page',
				'numberposts' => 1,
				'meta_key'    => 'rp_page', // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value'  => $key, // phpcs:ignore WordPress.DB.SlowDBQuery
				'post_status' => 'any',
				'fields'      => 'ids',
			)
		);
		if ( $found ) {
			$page_ids[ $key ] = $found[0];
			continue;
		}
		$id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => $page[0],
				'post_content' => $page[2],
				'post_excerpt' => $page[3],
			)
		);
		if ( $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, 'rp_page', $key );
			if ( $page[1] ) {
				update_post_meta( $id, '_wp_page_template', $page[1] );
			}
			$page_ids[ $key ] = $id;
		}
	}

	// Stories.
	$have = get_posts(
		array(
			'meta_key'    => 'rp_sample', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'  => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts' => 1,
			'fields'      => 'ids',
			'post_status' => 'any',
		)
	);
	if ( ! $have ) {
		$now    = time();
		$sticky = array();
		foreach ( rp_sample_stories() as $s ) {
			list( $title, $sections, $place, $summary, $hours, $stage, $update, $byline, $views, $lead ) = $s;
			$content  = rp_p( $summary );
			$content .= rp_p( __( 'This is a sample story. It shows how a full article looks on RaavanaaPost: the place, the headline, the short summary, the writer and the date at the top, then the story itself.', 'raavanaapost' ) );
			if ( $stage ) {
				$content .= "<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><!-- wp:paragraph -->\n<p>" . esc_html__( 'We will keep coming back to this story until something changes.', 'raavanaapost' ) . "</p>\n<!-- /wp:paragraph --></blockquote>\n<!-- /wp:quote -->\n\n";
				$content .= rp_p( __( 'Every need story shows where it stands: Initiated, Activated or Impact. When something moves, change the stage in the Story details box and add a one-line update.', 'raavanaapost' ) );
			}
			$content .= "<!-- wp:heading -->\n<h2>" . esc_html__( 'Make it yours', 'raavanaapost' ) . "</h2>\n<!-- /wp:heading -->\n\n";
			$content .= rp_p( __( 'Edit this story or write a new one under Posts. To clear all samples at once, open RaavanaaPost, then Start here, and choose Remove sample stories.', 'raavanaapost' ) );

			$cats = array();
			foreach ( $sections as $slug ) {
				if ( ! empty( $cat_ids[ $slug ] ) ) {
					$cats[] = $cat_ids[ $slug ];
				}
			}
			$id = wp_insert_post(
				array(
					'post_type'     => 'post',
					'post_status'   => 'publish',
					'post_title'    => $title,
					'post_excerpt'  => $summary,
					'post_content'  => $content,
					'post_category' => $cats,
					'post_date'     => wp_date( 'Y-m-d H:i:s', $now - $hours * HOUR_IN_SECONDS ),
				)
			);
			if ( ! $id || is_wp_error( $id ) ) {
				continue;
			}
			update_post_meta( $id, 'rp_sample', '1' );
			update_post_meta( $id, 'rp_views', $views );
			update_post_meta( $id, 'rp_byline', $byline );
			if ( $place ) {
				update_post_meta( $id, 'rp_place', $place );
			}
			if ( $stage ) {
				update_post_meta( $id, 'rp_stage', $stage );
				update_post_meta( $id, 'rp_update', $update );
			}
			if ( $lead ) {
				$sticky[] = $id;
			}
		}
		if ( $sticky ) {
			update_option( 'sticky_posts', array_values( array_unique( array_merge( (array) get_option( 'sticky_posts', array() ), $sticky ) ) ) );
		}
	}

	// Menus.
	$locations = get_theme_mod( 'nav_menu_locations', array() );
	if ( empty( $locations['primary'] ) ) {
		$menu_id = wp_create_nav_menu( __( 'Sections', 'raavanaapost' ) );
		if ( ! is_wp_error( $menu_id ) ) {
			wp_update_nav_menu_item(
				$menu_id,
				0,
				array(
					'menu-item-title'  => __( 'Home', 'raavanaapost' ),
					'menu-item-url'    => home_url( '/' ),
					'menu-item-type'   => 'custom',
					'menu-item-status' => 'publish',
				)
			);
			foreach ( array_keys( rp_sample_sections() ) as $slug ) {
				if ( empty( $cat_ids[ $slug ] ) ) {
					continue;
				}
				wp_update_nav_menu_item(
					$menu_id,
					0,
					array(
						'menu-item-object-id' => $cat_ids[ $slug ],
						'menu-item-object'    => 'category',
						'menu-item-type'      => 'taxonomy',
						'menu-item-status'    => 'publish',
					)
				);
			}
			$locations['primary'] = $menu_id;
		}
	}
	if ( empty( $locations['footer'] ) ) {
		$menu_id = wp_create_nav_menu( __( 'About links', 'raavanaapost' ) );
		if ( ! is_wp_error( $menu_id ) ) {
			foreach ( array( 'about', 'promise', 'contact' ) as $key ) {
				if ( empty( $page_ids[ $key ] ) ) {
					continue;
				}
				wp_update_nav_menu_item(
					$menu_id,
					0,
					array(
						'menu-item-object-id' => $page_ids[ $key ],
						'menu-item-object'    => 'page',
						'menu-item-type'      => 'post_type',
						'menu-item-status'    => 'publish',
					)
				);
			}
			$locations['footer'] = $menu_id;
		}
	}
	set_theme_mod( 'nav_menu_locations', $locations );

	// Move WordPress's own untouched "Hello world!" post and "Sample Page" to the bin.
	foreach ( array( 'hello-world' => 'post', 'sample-page' => 'page' ) as $slug => $type ) {
		$default = get_page_by_path( $slug, OBJECT, $type );
		if ( $default && 'publish' === $default->post_status && $default->post_modified === $default->post_date ) {
			wp_trash_post( $default->ID );
		}
	}

	// Tagline and a tidy front page.
	$tagline = get_option( 'blogdescription' );
	if ( '' === $tagline || 'Just another WordPress site' === $tagline ) {
		update_option( 'blogdescription', __( 'Community needs. Real impact.', 'raavanaapost' ) );
	}
	update_option( 'show_on_front', 'posts' );
	if ( '' === get_option( 'permalink_structure' ) ) {
		update_option( 'permalink_structure', '/%postname%/' );
	}
	flush_rewrite_rules();
}

/** Remove only the sample stories. Pages, sections and menus stay. */
function rp_remove_samples() {
	$ids = get_posts(
		array(
			'meta_key'    => 'rp_sample', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'  => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts' => -1,
			'fields'      => 'ids',
			'post_status' => 'any',
		)
	);
	foreach ( $ids as $id ) {
		wp_delete_post( $id, true );
	}
	update_option( 'sticky_posts', array_values( array_diff( (array) get_option( 'sticky_posts', array() ), $ids ) ) );
}
