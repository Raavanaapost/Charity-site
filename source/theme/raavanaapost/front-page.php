<?php
/**
 * Front page.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* If the owner chose a static page for the front page, show that page normally. */
if ( 'page' === get_option( 'show_on_front' ) && ! is_home() ) {
	get_template_part( 'page' );
	return;
}

get_header();

global $rp_shown;
$rp_shown = array();

// The newest story is always the front-page lead.
$rp_lead = rp_take( array( 'numberposts' => 1, 'ignore_sticky_posts' => true ) );

if ( ! $rp_lead ) :
	?>
	<section class="rp-wrap rp-empty">
		<img src="<?php echo esc_url( rp_img( 'crown.png' ) ); ?>" alt="" width="330" height="207">
		<h1><?php esc_html_e( 'The first stories are on their way.', 'raavanaapost' ); ?></h1>
		<?php if ( current_user_can( 'manage_options' ) ) : ?>
			<p><a class="rp-btn rp-btn--orange" href="<?php echo esc_url( admin_url( 'admin.php?page=raavanaapost' ) ); ?>"><?php esc_html_e( 'Set up the site', 'raavanaapost' ); ?></a></p>
		<?php endif; ?>
	</section>
	<?php
	get_footer();
	return;
endif;

$rp_lead = $rp_lead[0];
$rp_side = rp_take( array( 'numberposts' => 3 ) );
?>

<section class="rp-wrap rp-top" aria-label="<?php esc_attr_e( 'Top stories', 'raavanaapost' ); ?>">
	<article class="rp-lead">
		<?php rp_media( $rp_lead, 'rp-wide', '16-9', true ); ?>
		<?php if ( rp_place( $rp_lead ) ) : ?>
			<p class="rp-kicker"><?php echo esc_html( rp_place( $rp_lead ) ); ?></p>
		<?php endif; ?>
		<h1 class="rp-lead__title"><a href="<?php echo esc_url( get_permalink( $rp_lead ) ); ?>"><?php echo esc_html( get_the_title( $rp_lead ) ); ?></a></h1>
		<?php if ( has_excerpt( $rp_lead ) ) : ?>
			<p class="rp-lead__standfirst"><?php echo esc_html( get_the_excerpt( $rp_lead ) ); ?></p>
		<?php endif; ?>
		<p class="rp-byline"><span class="rp-byline__name"><?php echo esc_html( rp_byline( $rp_lead ) ); ?></span>, <?php echo rp_time_tag( $rp_lead ); // phpcs:ignore WordPress.Security.EscapeOutput ?></p>
		<?php if ( rp_stage( $rp_lead ) ) : ?>
			<div class="rp-lead__need">
				<?php rp_tracker( $rp_lead, 'light' ); ?>
				<?php rp_need_update( $rp_lead ); ?>
			</div>
		<?php endif; ?>
	</article>

	<aside class="rp-top__side" aria-label="<?php esc_attr_e( 'More top stories', 'raavanaapost' ); ?>">
		<?php
		foreach ( $rp_side as $rp_p ) {
			rp_card( $rp_p, 'side', 'h2' );
		}
		rp_most_read();
		?>
	</aside>
</section>

<?php
$rp_needs = rp_take(
	array(
		'numberposts' => 4,
		'orderby'     => 'modified',
		'meta_query'  => array( // phpcs:ignore WordPress.DB.SlowDBQuery
			array(
				'key'     => 'rp_stage',
				'value'   => array_keys( rp_stages() ),
				'compare' => 'IN',
			),
		),
	)
);
$rp_report_url = rp_page_url( 'report' );
$rp_needs_url  = rp_page_url( 'needs' );
?>
<section class="rp-needs" aria-labelledby="rp-needs-title">
	<div class="rp-wrap">
		<div class="rp-needs__head">
			<img class="rp-needs__king" src="<?php echo esc_url( rp_img( 'king.png' ) ); ?>" alt="" width="417" height="463" loading="lazy">
			<div class="rp-needs__intro">
				<h2 class="rp-needs__title" id="rp-needs-title"><?php echo esc_html( rp_mod( 'rp_needs_title' ) ); ?></h2>
				<?php rp_swoosh( 'rp-needs__swoosh' ); ?>
				<p class="rp-needs__text"><?php echo esc_html( rp_mod( 'rp_needs_text' ) ); ?></p>
				<div class="rp-needs__actions">
					<?php if ( $rp_report_url ) : ?>
						<a class="rp-btn rp-btn--gold" href="<?php echo esc_url( rp_soon_url( $rp_report_url ) ); ?>"><?php esc_html_e( 'Tell us about a need', 'raavanaapost' ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
					<?php endif; ?>
					<?php if ( $rp_needs_url ) : ?>
						<a class="rp-needs__all" href="<?php echo esc_url( rp_soon_url( $rp_needs_url ) ); ?>"><?php esc_html_e( 'See every need we are following', 'raavanaapost' ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
					<?php endif; ?>
				</div>
			</div>
		</div>
		<?php if ( $rp_needs ) : ?>
			<div class="rp-needs__grid">
				<?php
				foreach ( $rp_needs as $rp_p ) {
					rp_card( $rp_p, 'need', 'h3' );
				}
				?>
			</div>
		<?php endif; ?>
	</div>
</section>

<?php
$rp_cat = rp_cat( 'sri-lanka' );
$rp_sl  = $rp_cat ? rp_take(
	array(
		'numberposts' => 4,
		'cat'         => $rp_cat->term_id,
	)
) : array();
if ( $rp_sl ) :
	?>
	<section class="rp-wrap rp-section" aria-labelledby="rp-sec-sl">
		<?php
		rp_section_head(
			$rp_cat->name,
			array(
				'id'         => 'rp-sec-sl',
				'more_url'   => get_category_link( $rp_cat ),
				/* translators: %s: section name */
				'more_label' => sprintf( __( 'More from %s', 'raavanaapost' ), $rp_cat->name ),
			)
		);
		?>
		<div class="rp-grid">
			<?php
			foreach ( $rp_sl as $rp_p ) {
				rp_card( $rp_p, 'grid', 'h3' );
			}
			?>
		</div>
	</section>
<?php endif; ?>

<?php
$rp_ca_ids = array_filter( array( rp_cat( 'canada' ) ? rp_cat( 'canada' )->term_id : 0, rp_cat( 'diaspora' ) ? rp_cat( 'diaspora' )->term_id : 0 ) );
$rp_ca     = $rp_ca_ids ? rp_take(
	array(
		'numberposts'  => 5,
		'category__in' => $rp_ca_ids,
	)
) : array();
if ( $rp_ca ) :
	$rp_ca_cat = rp_cat( 'canada' ) ? rp_cat( 'canada' ) : rp_cat( 'diaspora' );
	?>
	<section class="rp-wrap rp-section" aria-labelledby="rp-sec-ca">
		<?php
		rp_section_head(
			rp_cat( 'canada' ) && rp_cat( 'diaspora' ) ? __( 'Canada and the diaspora', 'raavanaapost' ) : $rp_ca_cat->name,
			array(
				'id'         => 'rp-sec-ca',
				'more_url'   => get_category_link( $rp_ca_cat ),
				/* translators: %s: section name */
				'more_label' => sprintf( __( 'More from %s', 'raavanaapost' ), $rp_ca_cat->name ),
			)
		);
		?>
		<div class="rp-split">
			<?php rp_card( array_shift( $rp_ca ), 'feature', 'h3' ); ?>
			<?php if ( $rp_ca ) : ?>
				<ul class="rp-list">
					<?php foreach ( $rp_ca as $rp_p ) : ?>
						<li><?php rp_card( $rp_p, 'list', 'h3' ); ?></li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div>
	</section>
<?php endif; ?>

<?php
$rp_pair = array();
foreach ( array( 'culture', 'sports' ) as $rp_slug ) {
	$rp_c = rp_cat( $rp_slug );
	if ( ! $rp_c ) {
		continue;
	}
	$rp_items = rp_take(
		array(
			'numberposts' => 3,
			'cat'         => $rp_c->term_id,
		)
	);
	if ( $rp_items ) {
		$rp_pair[] = array( $rp_c, $rp_items );
	}
}
if ( 1 === count( $rp_pair ) ) :
	/* Only one of Culture and Sports has stories: show it as a normal row. */
	$rp_block = $rp_pair[0];
	?>
	<section class="rp-wrap rp-section" aria-labelledby="rp-sec-pair-0">
		<?php
		rp_section_head(
			$rp_block[0]->name,
			array(
				'id'         => 'rp-sec-pair-0',
				'more_url'   => get_category_link( $rp_block[0] ),
				/* translators: %s: section name */
				'more_label' => sprintf( __( 'More from %s', 'raavanaapost' ), $rp_block[0]->name ),
			)
		);
		?>
		<div class="rp-grid">
			<?php
			foreach ( $rp_block[1] as $rp_p ) {
				rp_card( $rp_p, 'grid', 'h3' );
			}
			?>
		</div>
	</section>
	<?php
elseif ( $rp_pair ) :
	?>
	<div class="rp-wrap rp-pair">
		<?php foreach ( $rp_pair as $rp_i => $rp_block ) : ?>
			<section aria-labelledby="rp-sec-pair-<?php echo (int) $rp_i; ?>">
				<?php
				rp_section_head(
					$rp_block[0]->name,
					array(
						'id'         => 'rp-sec-pair-' . $rp_i,
						'more_url'   => get_category_link( $rp_block[0] ),
						'more_label' => __( 'More', 'raavanaapost' ),
					)
				);
				rp_card( array_shift( $rp_block[1] ), 'big', 'h3' );
				?>
				<?php if ( $rp_block[1] ) : ?>
					<ul class="rp-textlist">
						<?php foreach ( $rp_block[1] as $rp_p ) : ?>
							<li><a href="<?php echo esc_url( get_permalink( $rp_p ) ); ?>"><?php echo esc_html( get_the_title( $rp_p ) ); ?></a></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</section>
		<?php endforeach; ?>
	</div>
<?php endif; ?>

<?php
$rp_op_cat = rp_cat( 'opinion' );
$rp_op     = $rp_op_cat ? rp_take(
	array(
		'numberposts' => 3,
		'cat'         => $rp_op_cat->term_id,
	)
) : array();
if ( $rp_op ) :
	?>
	<section class="rp-voices" aria-labelledby="rp-sec-op">
		<div class="rp-wrap">
			<?php
			rp_section_head(
				__( 'Voices', 'raavanaapost' ),
				array(
					'id'         => 'rp-sec-op',
					'more_url'   => get_category_link( $rp_op_cat ),
					/* translators: %s: section name */
					'more_label' => sprintf( __( 'More from %s', 'raavanaapost' ), $rp_op_cat->name ),
				)
			);
			?>
			<div class="rp-voices__grid">
				<?php
				foreach ( $rp_op as $rp_p ) {
					rp_card( $rp_p, 'voice', 'h3' );
				}
				?>
			</div>
		</div>
	</section>
<?php endif; ?>

<section class="rp-wrap rp-involve" aria-label="<?php esc_attr_e( 'Get involved', 'raavanaapost' ); ?>">
	<?php if ( $rp_report_url ) : ?>
		<div class="rp-involve__report">
			<img class="rp-involve__crown" src="<?php echo esc_url( rp_img( 'crown.png' ) ); ?>" alt="" width="330" height="207" loading="lazy">
			<h2><?php esc_html_e( 'Know a need in your community?', 'raavanaapost' ); ?></h2>
			<p><?php esc_html_e( 'Tell us about it. Our team will call you, check the facts and keep following it until something changes.', 'raavanaapost' ); ?></p>
			<a class="rp-btn rp-btn--orange" href="<?php echo esc_url( rp_soon_url( $rp_report_url ) ); ?>"><?php esc_html_e( 'Report a need', 'raavanaapost' ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</div>
	<?php endif; ?>
	<?php if ( rp_page_url( 'brief' ) ) : ?>
		<div class="rp-involve__brief">
			<h2><?php esc_html_e( 'The morning brief', 'raavanaapost' ); ?></h2>
			<p><?php esc_html_e( 'The day\'s community stories in your inbox, every morning at 7.', 'raavanaapost' ); ?></p>
			<?php rp_brief_form(); ?>
		</div>
	<?php elseif ( rp_mod( 'rp_partner_url' ) ) : ?>
		<div class="rp-involve__brief rp-involve__partner">
			<h2><?php echo esc_html( rp_mod( 'rp_partner_title' ) ); ?></h2>
			<p><?php echo esc_html( rp_mod( 'rp_partner_text' ) ); ?></p>
			<p><a class="rp-btn rp-btn--gold" href="<?php echo esc_url( rp_soon_url( rp_mod( 'rp_partner_url' ) ) ); ?>"><?php echo esc_html( rp_mod( 'rp_partner_button' ) ); ?><?php echo rp_soon_tag(); // phpcs:ignore WordPress.Security.EscapeOutput ?></a></p>
		</div>
	<?php endif; ?>
</section>

<?php
get_footer();
