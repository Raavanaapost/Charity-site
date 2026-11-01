<?php
/**
 * "Report a need" and "Morning brief" forms. Everything sent is kept
 * privately in WordPress, under the RaavanaaPost menu.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'init',
	function () {
		register_post_type(
			'rp_report',
			array(
				'labels'          => array(
					'name'          => __( 'Need reports', 'raavanaapost' ),
					'singular_name' => __( 'Need report', 'raavanaapost' ),
					'all_items'     => __( 'Need reports', 'raavanaapost' ),
					'edit_item'     => __( 'Need report', 'raavanaapost' ),
					'search_items'  => __( 'Search reports', 'raavanaapost' ),
					'not_found'     => __( 'No need reports yet.', 'raavanaapost' ),
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => 'raavanaapost',
				'supports'        => array( 'title', 'editor' ),
				'capability_type' => 'post',
				'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
				'map_meta_cap'    => true,
			)
		);
		register_post_type(
			'rp_subscriber',
			array(
				'labels'          => array(
					'name'          => __( 'Brief sign-ups', 'raavanaapost' ),
					'singular_name' => __( 'Brief sign-up', 'raavanaapost' ),
					'all_items'     => __( 'Brief sign-ups', 'raavanaapost' ),
					'edit_item'     => __( 'Brief sign-up', 'raavanaapost' ),
					'search_items'  => __( 'Search sign-ups', 'raavanaapost' ),
					'not_found'     => __( 'No sign-ups yet.', 'raavanaapost' ),
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => 'raavanaapost',
				'supports'        => array( 'title' ),
				'capability_type' => 'post',
				'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
				'map_meta_cap'    => true,
			)
		);
	}
);

/** Where to send the visitor back to after a form. */
function rp_form_back( $anchor, $arg, $value ) {
	$back = wp_get_referer();
	if ( ! $back ) {
		$back = home_url( '/' );
	}
	$back = remove_query_arg( array( 'rp_sent', 'rp_error', 'rp_berror', 'rp_subscribed' ), $back );
	$back = preg_replace( '/#.*$/', '', $back );
	return add_query_arg( $arg, $value, $back ) . '#' . $anchor;
}

/* ---------- Report a need ---------- */

add_action( 'admin_post_nopriv_rp_report', 'rp_handle_report' );
add_action( 'admin_post_rp_report', 'rp_handle_report' );

/** Save a need report and email the site owner. */
function rp_handle_report() {
	$nonce = isset( $_POST['rp_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['rp_nonce'] ) ) : '';
	if ( ! wp_verify_nonce( $nonce, 'rp_report' ) ) {
		wp_safe_redirect( rp_form_back( 'rp-report', 'rp_error', 'expired' ) );
		exit;
	}
	if ( ! empty( $_POST['rp_website'] ) ) { // Hidden field only robots fill in.
		wp_safe_redirect( rp_form_back( 'rp-report', 'rp_sent', '1' ) );
		exit;
	}
	$name    = isset( $_POST['rp_name'] ) ? sanitize_text_field( wp_unslash( $_POST['rp_name'] ) ) : '';
	$contact = isset( $_POST['rp_contact'] ) ? sanitize_text_field( wp_unslash( $_POST['rp_contact'] ) ) : '';
	$place   = isset( $_POST['rp_place'] ) ? sanitize_text_field( wp_unslash( $_POST['rp_place'] ) ) : '';
	$need    = isset( $_POST['rp_need'] ) ? sanitize_textarea_field( wp_unslash( $_POST['rp_need'] ) ) : '';
	$ok_call = ! empty( $_POST['rp_ok_call'] );

	if ( '' === $contact || '' === $place || '' === $need ) {
		wp_safe_redirect( rp_form_back( 'rp-report', 'rp_error', 'missing' ) );
		exit;
	}

	$id = wp_insert_post(
		array(
			'post_type'    => 'rp_report',
			'post_status'  => 'private',
			'post_title'   => wp_trim_words( $place . ': ' . $need, 14, '&hellip;' ),
			'post_content' => $need,
		)
	);
	if ( $id && ! is_wp_error( $id ) ) {
		update_post_meta( $id, 'rp_name', $name );
		update_post_meta( $id, 'rp_contact', $contact );
		update_post_meta( $id, 'rp_place', $place );
		update_post_meta( $id, 'rp_ok_call', $ok_call ? 'yes' : 'no' );

		$body = sprintf(
			"%s\n\n%s: %s\n%s: %s\n%s: %s\n%s: %s\n\n%s\n%s",
			__( 'Someone has reported a need on RaavanaaPost.', 'raavanaapost' ),
			__( 'Name', 'raavanaapost' ),
			$name ? $name : '-',
			__( 'Phone or email', 'raavanaapost' ),
			$contact,
			__( 'Town or village', 'raavanaapost' ),
			$place,
			__( 'OK to call', 'raavanaapost' ),
			$ok_call ? __( 'Yes', 'raavanaapost' ) : __( 'No', 'raavanaapost' ),
			$need,
			admin_url( 'post.php?post=' . $id . '&action=edit' )
		);
		/* translators: %s: town or village */
		wp_mail( get_option( 'admin_email' ), sprintf( __( 'New need reported in %s', 'raavanaapost' ), $place ), $body );
	}
	wp_safe_redirect( rp_form_back( 'rp-report', 'rp_sent', '1' ) );
	exit;
}

/** The report form. */
function rp_report_form() {
	?>
	<form class="rp-form" id="rp-report" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<?php rp_form_notice( 'report' ); ?>
		<input type="hidden" name="action" value="rp_report">
		<?php wp_nonce_field( 'rp_report', 'rp_nonce', false ); ?>
		<p class="rp-hp" aria-hidden="true"><label for="rp_website">Website</label><input type="text" id="rp_website" name="rp_website" tabindex="-1" autocomplete="off"></p>
		<div class="rp-field">
			<label for="rp_name"><?php esc_html_e( 'Your first name', 'raavanaapost' ); ?> <span class="rp-optional"><?php esc_html_e( '(optional)', 'raavanaapost' ); ?></span></label>
			<input class="rp-input" type="text" id="rp_name" name="rp_name" autocomplete="given-name">
		</div>
		<div class="rp-field">
			<label for="rp_contact"><?php esc_html_e( 'Phone or email', 'raavanaapost' ); ?></label>
			<input class="rp-input" type="text" id="rp_contact" name="rp_contact" required autocomplete="tel">
		</div>
		<div class="rp-field">
			<label for="rp_place_f"><?php esc_html_e( 'Town or village', 'raavanaapost' ); ?></label>
			<input class="rp-input" type="text" id="rp_place_f" name="rp_place" required>
		</div>
		<div class="rp-field">
			<label for="rp_need"><?php esc_html_e( 'What is needed?', 'raavanaapost' ); ?></label>
			<textarea class="rp-textarea" id="rp_need" name="rp_need" rows="6" required aria-describedby="rp_need_hint"></textarea>
			<p class="rp-hint" id="rp_need_hint"><?php esc_html_e( 'Tell us in your own words. Please don\'t write children\'s full names, home addresses or school names. We will ask for what we need when we call.', 'raavanaapost' ); ?></p>
		</div>
		<label class="rp-check"><input type="checkbox" name="rp_ok_call" value="1" checked> <?php esc_html_e( 'You can call me about this', 'raavanaapost' ); ?></label>
		<p><button class="rp-btn rp-btn--orange" type="submit"><?php esc_html_e( 'Send to our team', 'raavanaapost' ); ?></button></p>
	</form>
	<?php
}

/* ---------- Morning brief ---------- */

add_action( 'admin_post_nopriv_rp_brief', 'rp_handle_brief' );
add_action( 'admin_post_rp_brief', 'rp_handle_brief' );

/** Save a morning brief sign-up. */
function rp_handle_brief() {
	$nonce = isset( $_POST['rp_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['rp_nonce'] ) ) : '';
	if ( ! wp_verify_nonce( $nonce, 'rp_brief' ) ) {
		wp_safe_redirect( rp_form_back( 'rp-brief', 'rp_berror', 'expired' ) );
		exit;
	}
	if ( ! empty( $_POST['rp_website'] ) ) {
		wp_safe_redirect( rp_form_back( 'rp-brief', 'rp_subscribed', '1' ) );
		exit;
	}
	$email = isset( $_POST['rp_email'] ) ? sanitize_email( wp_unslash( $_POST['rp_email'] ) ) : '';
	$lang  = ( isset( $_POST['rp_lang'] ) && 'ta' === $_POST['rp_lang'] ) ? 'ta' : 'en';
	if ( ! is_email( $email ) ) {
		wp_safe_redirect( rp_form_back( 'rp-brief', 'rp_berror', 'email' ) );
		exit;
	}
	$existing = get_posts(
		array(
			'post_type'   => 'rp_subscriber',
			'post_status' => 'any',
			'title'       => $email,
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( $existing ) {
		update_post_meta( $existing[0], 'rp_lang', $lang );
	} else {
		$id = wp_insert_post(
			array(
				'post_type'   => 'rp_subscriber',
				'post_status' => 'private',
				'post_title'  => $email,
			)
		);
		if ( $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, 'rp_lang', $lang );
		}
	}
	wp_safe_redirect( rp_form_back( 'rp-brief', 'rp_subscribed', '1' ) );
	exit;
}

/** The sign-up form. */
function rp_brief_form() {
	?>
	<form class="rp-form rp-form--dark" id="rp-brief" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<?php rp_form_notice( 'brief' ); ?>
		<input type="hidden" name="action" value="rp_brief">
		<?php wp_nonce_field( 'rp_brief', 'rp_nonce', false ); ?>
		<p class="rp-hp" aria-hidden="true"><label for="rp_website_b">Website</label><input type="text" id="rp_website_b" name="rp_website" tabindex="-1" autocomplete="off"></p>
		<fieldset class="rp-radios">
			<legend><?php esc_html_e( 'Read it in', 'raavanaapost' ); ?></legend>
			<label><input type="radio" name="rp_lang" value="en" checked> English</label>
			<label><input type="radio" name="rp_lang" value="ta"> <span lang="ta">தமிழ்</span></label>
		</fieldset>
		<div class="rp-field">
			<label for="rp_email"><?php esc_html_e( 'Email address', 'raavanaapost' ); ?></label>
			<div class="rp-inline">
				<input class="rp-input" type="email" id="rp_email" name="rp_email" required autocomplete="email" placeholder="you@example.com">
				<button class="rp-btn rp-btn--gold" type="submit"><?php esc_html_e( 'Sign me up', 'raavanaapost' ); ?></button>
			</div>
		</div>
	</form>
	<?php
}

/** Thank-you or problem message after a form is sent. */
function rp_form_notice( $form ) {
	// phpcs:disable WordPress.Security.NonceVerification
	$ok    = 'report' === $form ? isset( $_GET['rp_sent'] ) : isset( $_GET['rp_subscribed'] );
	$key   = 'report' === $form ? 'rp_error' : 'rp_berror';
	$error = isset( $_GET[ $key ] ) ? sanitize_key( wp_unslash( $_GET[ $key ] ) ) : '';
	// phpcs:enable
	if ( $ok ) {
		$text = 'report' === $form
			? __( 'Thank you. Your report has reached our team, and someone will be in touch.', 'raavanaapost' )
			: __( 'You are on the list. Your first morning brief is on its way.', 'raavanaapost' );
		echo '<p class="rp-notice rp-notice--ok" role="status">' . esc_html( $text ) . '</p>';
		return;
	}
	$messages = array(
		'missing' => __( 'Please fill in your phone or email, the town or village, and what is needed.', 'raavanaapost' ),
		'email'   => __( 'That email address doesn\'t look right. Please check it and try again.', 'raavanaapost' ),
		'expired' => __( 'The form timed out. Please try once more.', 'raavanaapost' ),
	);
	if ( isset( $messages[ $error ] ) ) {
		echo '<p class="rp-notice rp-notice--err" role="alert">' . esc_html( $messages[ $error ] ) . '</p>';
	}
}

/* Columns for the two lists in the dashboard. */
add_filter(
	'manage_rp_report_posts_columns',
	function () {
		return array(
			'cb'         => '<input type="checkbox">',
			'title'      => __( 'Need', 'raavanaapost' ),
			'rp_contact' => __( 'Phone or email', 'raavanaapost' ),
			'rp_name'    => __( 'Name', 'raavanaapost' ),
			'rp_ok_call' => __( 'OK to call', 'raavanaapost' ),
			'date'       => __( 'Sent', 'raavanaapost' ),
		);
	}
);
add_action(
	'manage_rp_report_posts_custom_column',
	function ( $col, $id ) {
		$value = get_post_meta( $id, $col, true );
		if ( 'rp_ok_call' === $col ) {
			$value = 'yes' === $value ? __( 'Yes', 'raavanaapost' ) : __( 'No', 'raavanaapost' );
		}
		echo esc_html( (string) $value );
	},
	10,
	2
);
add_filter(
	'manage_rp_subscriber_posts_columns',
	function () {
		return array(
			'cb'      => '<input type="checkbox">',
			'title'   => __( 'Email', 'raavanaapost' ),
			'rp_lang' => __( 'Language', 'raavanaapost' ),
			'date'    => __( 'Signed up', 'raavanaapost' ),
		);
	}
);
add_action(
	'manage_rp_subscriber_posts_custom_column',
	function ( $col, $id ) {
		if ( 'rp_lang' === $col ) {
			echo 'ta' === get_post_meta( $id, 'rp_lang', true ) ? 'தமிழ்' : 'English';
		}
	},
	10,
	2
);

/* Show the report's details on its dashboard screen. */
add_action(
	'add_meta_boxes_rp_report',
	function () {
		add_meta_box(
			'rp-report-who',
			__( 'Who sent it', 'raavanaapost' ),
			function ( $post ) {
				$rows = array(
					__( 'Name', 'raavanaapost' )            => get_post_meta( $post->ID, 'rp_name', true ),
					__( 'Phone or email', 'raavanaapost' )  => get_post_meta( $post->ID, 'rp_contact', true ),
					__( 'Town or village', 'raavanaapost' ) => get_post_meta( $post->ID, 'rp_place', true ),
					__( 'OK to call', 'raavanaapost' )      => 'yes' === get_post_meta( $post->ID, 'rp_ok_call', true ) ? __( 'Yes', 'raavanaapost' ) : __( 'No', 'raavanaapost' ),
				);
				echo '<table class="widefat striped"><tbody>';
				foreach ( $rows as $label => $value ) {
					printf( '<tr><th scope="row">%s</th><td>%s</td></tr>', esc_html( $label ), esc_html( $value ? $value : '-' ) );
				}
				echo '</tbody></table>';
			},
			'rp_report',
			'normal',
			'high'
		);
	}
);
