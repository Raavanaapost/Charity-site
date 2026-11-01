<?php
/**
 * "Story details" box on the post editor: place, byline, need stage.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'add_meta_boxes_post',
	function () {
		add_meta_box( 'rp-story', __( 'Story details', 'raavanaapost' ), 'rp_story_box', 'post', 'side', 'high' );
	}
);

/** The box itself. */
function rp_story_box( $post ) {
	wp_nonce_field( 'rp_story', 'rp_story_nonce' );
	$place  = get_post_meta( $post->ID, 'rp_place', true );
	$byline = get_post_meta( $post->ID, 'rp_byline', true );
	$stage  = rp_stage( $post );
	$update = get_post_meta( $post->ID, 'rp_update', true );
	?>
	<p>
		<label for="rp_place"><strong><?php esc_html_e( 'Place', 'raavanaapost' ); ?></strong></label><br>
		<input type="text" id="rp_place" name="rp_place" value="<?php echo esc_attr( $place ); ?>" class="widefat" placeholder="<?php esc_attr_e( 'For example: Jaffna', 'raavanaapost' ); ?>">
		<span class="description"><?php esc_html_e( 'Shown in orange above the headline.', 'raavanaapost' ); ?></span>
	</p>
	<p>
		<label for="rp_byline"><strong><?php esc_html_e( 'Written by', 'raavanaapost' ); ?></strong></label><br>
		<input type="text" id="rp_byline" name="rp_byline" value="<?php echo esc_attr( $byline ); ?>" class="widefat">
		<span class="description"><?php esc_html_e( 'Leave empty to show your own name.', 'raavanaapost' ); ?></span>
	</p>
	<hr>
	<p>
		<label for="rp_stage"><strong><?php esc_html_e( 'Is this a community need?', 'raavanaapost' ); ?></strong></label><br>
		<select id="rp_stage" name="rp_stage" class="widefat">
			<option value=""><?php esc_html_e( 'No, a normal story', 'raavanaapost' ); ?></option>
			<?php foreach ( rp_stages() as $key => $label ) : ?>
				<option value="<?php echo esc_attr( $key ); ?>" <?php selected( $stage, $key ); ?>>
					<?php
					/* translators: %s: stage name such as Reported */
					printf( esc_html__( 'Yes: %s', 'raavanaapost' ), esc_html( $label ) );
					?>
				</option>
			<?php endforeach; ?>
		</select>
		<span class="description"><?php esc_html_e( 'Need stories appear in the green "Community needs. Real impact." band with their stage.', 'raavanaapost' ); ?></span>
	</p>
	<p>
		<label for="rp_update"><strong><?php esc_html_e( 'Latest update (one line)', 'raavanaapost' ); ?></strong></label><br>
		<input type="text" id="rp_update" name="rp_update" value="<?php echo esc_attr( $update ); ?>" class="widefat" placeholder="<?php esc_attr_e( 'For example: A local group is buying the pump.', 'raavanaapost' ); ?>">
	</p>
	<p class="description"><?php esc_html_e( 'Tip: the Excerpt box is the short summary shown under the headline. Tick "Stick to the top of the blog" to make a story the big lead on the front page.', 'raavanaapost' ); ?></p>
	<?php
}

add_action(
	'save_post_post',
	function ( $post_id ) {
		if ( ! isset( $_POST['rp_story_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rp_story_nonce'] ) ), 'rp_story' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		foreach ( array( 'rp_place', 'rp_byline', 'rp_update' ) as $key ) {
			$value = isset( $_POST[ $key ] ) ? sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) : '';
			if ( '' === $value ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, $value );
			}
		}
		$stage = isset( $_POST['rp_stage'] ) ? sanitize_key( wp_unslash( $_POST['rp_stage'] ) ) : '';
		if ( array_key_exists( $stage, rp_stages() ) ) {
			update_post_meta( $post_id, 'rp_stage', $stage );
		} else {
			delete_post_meta( $post_id, 'rp_stage' );
		}
	}
);

/* Show place and stage in the Posts list. */
add_filter(
	'manage_post_posts_columns',
	function ( $cols ) {
		$new = array();
		foreach ( $cols as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['rp_place'] = __( 'Place', 'raavanaapost' );
				$new['rp_stage'] = __( 'Need stage', 'raavanaapost' );
			}
		}
		return $new;
	}
);

add_action(
	'manage_post_posts_custom_column',
	function ( $col, $post_id ) {
		if ( 'rp_place' === $col ) {
			echo esc_html( (string) get_post_meta( $post_id, 'rp_place', true ) );
		} elseif ( 'rp_stage' === $col ) {
			$stage  = rp_stage( $post_id );
			$stages = rp_stages();
			echo $stage ? esc_html( $stages[ $stage ] ) : '&mdash;';
		}
	},
	10,
	2
);
