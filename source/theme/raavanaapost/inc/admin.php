<?php
/**
 * The RaavanaaPost menu in the dashboard, with a "Start here" page.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'admin_menu',
	function () {
		add_menu_page(
			__( 'RaavanaaPost', 'raavanaapost' ),
			__( 'RaavanaaPost', 'raavanaapost' ),
			'edit_posts',
			'raavanaapost',
			'rp_start_page',
			'dashicons-megaphone',
			3
		);
		add_submenu_page( 'raavanaapost', __( 'Start here', 'raavanaapost' ), __( 'Start here', 'raavanaapost' ), 'edit_posts', 'raavanaapost', 'rp_start_page' );
	},
	9
);

/* A friendly nudge right after the theme is switched on. */
add_action(
	'after_switch_theme',
	function () {
		set_transient( 'rp_welcome', 1, DAY_IN_SECONDS );
	}
);

add_action(
	'admin_notices',
	function () {
		if ( ! get_transient( 'rp_welcome' ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$screen = get_current_screen();
		if ( $screen && 'toplevel_page_raavanaapost' === $screen->id ) {
			return;
		}
		printf(
			'<div class="notice notice-success is-dismissible"><p><strong>%s</strong> %s <a href="%s">%s</a></p></div>',
			esc_html__( 'RaavanaaPost is on.', 'raavanaapost' ),
			esc_html__( 'Set up your sections, pages and sample stories in one click:', 'raavanaapost' ),
			esc_url( admin_url( 'admin.php?page=raavanaapost' ) ),
			esc_html__( 'open Start here', 'raavanaapost' )
		);
	}
);

/** The "Start here" screen. */
function rp_start_page() {
	delete_transient( 'rp_welcome' );
	$has_samples = (bool) get_posts(
		array(
			'meta_key'    => 'rp_sample', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'  => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts' => 1,
			'fields'      => 'ids',
			'post_status' => 'any',
		)
	);
	$reports     = wp_count_posts( 'rp_report' );
	$subs        = wp_count_posts( 'rp_subscriber' );
	// phpcs:ignore WordPress.Security.NonceVerification
	$done = isset( $_GET['rp_done'] ) ? sanitize_key( wp_unslash( $_GET['rp_done'] ) ) : '';
	?>
	<div class="wrap rp-start">
		<style>
			.rp-start{max-width:880px}
			.rp-start__head{display:flex;align-items:center;gap:16px;margin:12px 0 8px}
			.rp-start__head img{width:72px;height:auto}
			.rp-start h1{font-size:28px;margin:0}
			.rp-start__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:20px 0}
			.rp-start__card{background:#fff;border:1px solid #dcdcde;border-top:3px solid #C98A1E;border-radius:6px;padding:18px 20px}
			.rp-start__card h2{margin:0 0 8px;font-size:16px}
			.rp-start__card p{margin:0 0 12px}
			.rp-start__count{font-size:28px;font-weight:700;color:#0B3D22;margin:0 0 4px}
			.rp-start .button-primary{background:#0B3D22;border-color:#0B3D22}
			.rp-start .button-primary:hover{background:#124A2D;border-color:#124A2D}
		</style>
		<div class="rp-start__head">
			<img src="<?php echo esc_url( rp_img( 'crown.png' ) ); ?>" alt="">
			<h1><?php esc_html_e( 'Welcome to RaavanaaPost', 'raavanaapost' ); ?></h1>
		</div>
		<p><?php esc_html_e( 'Your news site, in the colours of your logo. Here is everything you need, in order.', 'raavanaapost' ); ?></p>

		<?php if ( 'added' === $done ) : ?>
			<div class="notice notice-success"><p><?php esc_html_e( 'Done. Sections, menus, pages and sample stories are in place.', 'raavanaapost' ); ?> <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'See your site', 'raavanaapost' ); ?></a></p></div>
		<?php elseif ( 'removed' === $done ) : ?>
			<div class="notice notice-success"><p><?php esc_html_e( 'Sample stories removed. Your own stories, pages and menus were kept.', 'raavanaapost' ); ?></p></div>
		<?php endif; ?>

		<div class="rp-start__grid">
			<div class="rp-start__card">
				<h2><?php esc_html_e( '1. Fill the site', 'raavanaapost' ); ?></h2>
				<?php if ( current_user_can( 'manage_options' ) ) : ?>
					<p><?php esc_html_e( 'Adds your sections, menus, the About, Contact, Report a need, Morning brief and Needs pages, and sample stories so you can see every page working.', 'raavanaapost' ); ?></p>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<input type="hidden" name="action" value="rp_samples">
						<?php wp_nonce_field( 'rp_samples' ); ?>
						<?php if ( $has_samples ) : ?>
							<input type="hidden" name="rp_do" value="remove">
							<button class="button"><?php esc_html_e( 'Remove sample stories', 'raavanaapost' ); ?></button>
						<?php else : ?>
							<input type="hidden" name="rp_do" value="add">
							<button class="button button-primary"><?php esc_html_e( 'Set up my site', 'raavanaapost' ); ?></button>
						<?php endif; ?>
					</form>
				<?php else : ?>
					<p><?php esc_html_e( 'Ask the site owner to run this step.', 'raavanaapost' ); ?></p>
				<?php endif; ?>
			</div>
			<div class="rp-start__card">
				<h2><?php esc_html_e( '2. Write a story', 'raavanaapost' ); ?></h2>
				<p><?php esc_html_e( 'Add a headline, the story, a picture and a short summary (the Excerpt). In "Story details", add the place, and say if it is a community need.', 'raavanaapost' ); ?></p>
				<a class="button" href="<?php echo esc_url( admin_url( 'post-new.php' ) ); ?>"><?php esc_html_e( 'Write a story', 'raavanaapost' ); ?></a>
			</div>
			<div class="rp-start__card">
				<h2><?php esc_html_e( '3. Change the words', 'raavanaapost' ); ?></h2>
				<p><?php esc_html_e( 'Change the green band, the footer line, your social links and the Tamil link.', 'raavanaapost' ); ?></p>
				<a class="button" href="<?php echo esc_url( admin_url( 'customize.php?autofocus[section]=rp_words' ) ); ?>"><?php esc_html_e( 'Open the Customizer', 'raavanaapost' ); ?></a>
			</div>
		</div>

		<div class="rp-start__grid">
			<div class="rp-start__card">
				<p class="rp-start__count"><?php echo esc_html( number_format_i18n( (int) $reports->private ) ); ?></p>
				<h2><?php esc_html_e( 'Need reports', 'raavanaapost' ); ?></h2>
				<p><?php esc_html_e( 'Sent from the Report a need page. Only your team can see them.', 'raavanaapost' ); ?></p>
				<a class="button" href="<?php echo esc_url( admin_url( 'edit.php?post_type=rp_report' ) ); ?>"><?php esc_html_e( 'Open reports', 'raavanaapost' ); ?></a>
			</div>
			<div class="rp-start__card">
				<p class="rp-start__count"><?php echo esc_html( number_format_i18n( (int) $subs->private ) ); ?></p>
				<h2><?php esc_html_e( 'Morning brief sign-ups', 'raavanaapost' ); ?></h2>
				<p><?php esc_html_e( 'Email addresses of readers who want the morning brief, with their language.', 'raavanaapost' ); ?></p>
				<a class="button" href="<?php echo esc_url( admin_url( 'edit.php?post_type=rp_subscriber' ) ); ?>"><?php esc_html_e( 'Open sign-ups', 'raavanaapost' ); ?></a>
			</div>
		</div>
	</div>
	<?php
}
