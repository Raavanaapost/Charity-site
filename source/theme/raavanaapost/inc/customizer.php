<?php
/**
 * Words and links you can change in Appearance > Customize > RaavanaaPost.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Default values. */
function rp_defaults() {
	return array(
		'rp_show_latest'  => true,
		'rp_needs_title'  => __( 'Community needs. Real impact.', 'raavanaapost' ),
		'rp_needs_text'   => __( 'Every need we report moves through three stages: Initiated, Activated and Impact. Here is where each one stands today.', 'raavanaapost' ),
		'rp_footer_about' => __( 'Community news for Tamil families in Sri Lanka, Canada and around the world.', 'raavanaapost' ),
		'rp_tamil_url'    => '',
		'rp_facebook'     => '',
		'rp_instagram'    => '',
		'rp_youtube'      => '',
		'rp_whatsapp'     => '',
		'rp_report_url'     => '',
		'rp_partner_url'    => '',
		'rp_partner_title'  => __( 'Be part of the next day of joy', 'raavanaapost' ),
		'rp_partner_text'   => __( 'Every story here began with a need. See the days that are waiting, and help make the next one happen.', 'raavanaapost' ),
		'rp_partner_button' => __( 'See the projects', 'raavanaapost' ),
		'rp_mostread_title' => __( 'Most read', 'raavanaapost' ),
	);
}

/** Read a setting, falling back to its default. */
function rp_mod( $key ) {
	$defaults = rp_defaults();
	return get_theme_mod( $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

add_action(
	'customize_register',
	function ( $wp ) {
		$d = rp_defaults();
		$wp->add_section(
			'rp_words',
			array(
				'title'       => __( 'RaavanaaPost words and links', 'raavanaapost' ),
				'priority'    => 25,
				'description' => __( 'Change the words in the green band, the footer, and your social links. Leave a link empty to hide it.', 'raavanaapost' ),
			)
		);

		$wp->add_setting(
			'rp_show_latest',
			array(
				'default'           => $d['rp_show_latest'],
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);
		$wp->add_control(
			'rp_show_latest',
			array(
				'label'   => __( 'Show the "Latest" line under the menu', 'raavanaapost' ),
				'section' => 'rp_words',
				'type'    => 'checkbox',
			)
		);

		$text = array(
			'rp_needs_title'    => array( __( 'Needs band title', 'raavanaapost' ), 'text' ),
			'rp_needs_text'     => array( __( 'Needs band words', 'raavanaapost' ), 'textarea' ),
			'rp_mostread_title' => array( __( 'Title of the list beside the top story', 'raavanaapost' ), 'text' ),
			'rp_partner_title'  => array( __( 'Front page box: title (shown when there is no Morning brief page)', 'raavanaapost' ), 'text' ),
			'rp_partner_text'   => array( __( 'Front page box: words', 'raavanaapost' ), 'textarea' ),
			'rp_partner_button' => array( __( 'Front page box: button', 'raavanaapost' ), 'text' ),
			'rp_footer_about'   => array( __( 'Footer: a line about RaavanaaPost', 'raavanaapost' ), 'textarea' ),
		);
		foreach ( $text as $key => $info ) {
			$wp->add_setting(
				$key,
				array(
					'default'           => $d[ $key ],
					'sanitize_callback' => 'sanitize_textarea_field',
				)
			);
			$wp->add_control(
				$key,
				array(
					'label'   => $info[0],
					'section' => 'rp_words',
					'type'    => $info[1],
				)
			);
		}

		$links = array(
			'rp_report_url'  => __( 'Send "Report a need" to this form instead (for example your charity site\'s form)', 'raavanaapost' ),
			'rp_partner_url' => __( 'Front page box: button link', 'raavanaapost' ),
			'rp_tamil_url'   => __( 'Tamil edition link (shows "தமிழ்" at the top)', 'raavanaapost' ),
			'rp_facebook'  => __( 'Facebook link', 'raavanaapost' ),
			'rp_instagram' => __( 'Instagram link', 'raavanaapost' ),
			'rp_youtube'   => __( 'YouTube link', 'raavanaapost' ),
			'rp_whatsapp'  => __( 'WhatsApp channel link', 'raavanaapost' ),
		);
		foreach ( $links as $key => $label ) {
			$wp->add_setting(
				$key,
				array(
					'default'           => '',
					'sanitize_callback' => 'esc_url_raw',
				)
			);
			$wp->add_control(
				$key,
				array(
					'label'   => $label,
					'section' => 'rp_words',
					'type'    => 'url',
				)
			);
		}
	}
);
