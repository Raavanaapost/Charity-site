<?php
/**
 * The "Activating" and "Budget" boxes from a raavanaa.org project page, ported
 * one to one from raavanaa.org's site.js (activatingPanelHTML, budgetBoxHTML) so
 * a need story shows exactly what its project page shows. The figures come from
 * the story's "rp_project" field (a copy of the project in raavanaa.org's projects.json).
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The project behind a need story, or null. */
function rp_project( $post = null ) {
	$post = get_post( $post );
	$raw  = $post ? (string) get_post_meta( $post->ID, 'rp_project', true ) : '';
	$p    = $raw ? json_decode( $raw, true ) : null;
	return is_array( $p ) ? $p : null;
}

function rp_rorg_num( $v ) {
	$n = preg_replace( '/[^0-9.]/', '', (string) $v );
	return is_numeric( $n ) ? (float) $n : 0.0;
}

function rp_rorg_rows( $p, $key, $field ) {
	return array_values( array_filter( (array) ( $p[ $key ] ?? array() ), function ( $x ) use ( $field ) { return is_array( $x ) && ! empty( $x[ $field ] ); } ) );
}

/** budgetOf() */
function rp_rorg_budget( $p ) {
	$lines   = rp_rorg_rows( $p, 'budget', 'item' );
	$funders = rp_rorg_rows( $p, 'funders', 'name' );
	$goal    = rp_rorg_num( $p['goal'] ?? '' );
	if ( ! $goal ) {
		foreach ( $lines as $x ) { $goal += rp_rorg_num( $x['amount'] ?? '' ); }
	}
	$raised = 0;
	foreach ( $funders as $f ) { $raised += rp_rorg_num( $f['amount'] ?? '' ); }
	return array(
		'lines'   => $lines,
		'funders' => $funders,
		'goal'    => $goal,
		'raised'  => $raised,
		'pct'     => $goal ? (int) min( 100, round( $raised / $goal * 100 ) ) : 0,
		'full'    => $goal > 0 && $raised >= $goal,
	);
}

/** stageNum() */
function rp_rorg_stage( $p ) {
	if ( preg_match( '/complete/i', (string) ( $p['status'] ?? '' ) ) ) {
		return 3;
	}
	$b = rp_rorg_budget( $p );
	return ! empty( $p['verified'] ) && $b['goal'] > 0 && $b['raised'] >= $b['goal'] ? 2 : 1;
}

/** ringSteps(): name, done (0 to 1), colour, show a % while part done. */
function rp_rorg_steps( $p ) {
	$b  = rp_rorg_budget( $p );
	$st = rp_rorg_stage( $p );
	if ( 1 === $st ) {
		return array(
			array( 'Visited and verified', ! empty( $p['verified'] ) ? 1 : 0, '#1f7a47', false ),
			array( 'Budgeted', $b['goal'] > 0 ? 1 : 0, '#3f9a5f', false ),
			array( 'Funded', $b['goal'] > 0 ? min( 1, $b['raised'] / $b['goal'] ) : 0, '#eaa21c', true ),
		);
	}
	if ( 2 === $st ) {
		$steps = array(
			array( 'Date confirmed', ! empty( $p['date_set'] ) ? 1 : 0, '#e5851a', false ),
			array( 'Place and transport booked', ! empty( $p['booked'] ) ? 1 : 0, '#d9632b', false ),
			array( 'Volunteers ready', ! empty( $p['volunteers'] ) ? 1 : 0, '#c8381e', false ),
		);
		foreach ( rp_rorg_rows( $p, 'steps', 'name' ) as $k => $x ) {
			$steps[] = array( $x['name'], ! empty( $x['done'] ) ? 1 : 0, array( '#8f6200', '#b4560a', '#0f5132' )[ $k % 3 ], false );
		}
		return $steps;
	}
	$ex  = rp_rorg_rows( $p, 'expectations', 'text' );
	$met = count( array_filter( $ex, function ( $x ) { return ! empty( $x['result'] ); } ) );
	return array(
		array( 'The day happened', 1, '#1f7a47', false ),
		array( 'Story shared', ( ! empty( $p['updates'] ) || ! empty( $p['story'] ) ) ? 1 : 0, '#3f9a5f', false ),
		array( 'Money reported', rp_rorg_rows( $p, 'budget', 'item' ) ? 1 : 0, '#e5851a', false ),
		array( 'Expectations reviewed', $ex ? $met / count( $ex ) : 0, '#c8381e', false ),
	);
}

/** moneyOf() */
function rp_rorg_money( $p, $n ) {
	return esc_html( ( ! empty( $p['currency'] ) ? $p['currency'] : '$' ) . number_format( round( $n ) ) );
}

/** activatingPanelHTML() */
/** Initiated: the % is only how much is funded so far; verified and budgeted show as ticks but do not count (SURESH, 6 Nov 2026). */
function rp_rorg_arcs( $p ) {
	$steps = rp_rorg_steps( $p );
	return 1 === rp_rorg_stage( $p ) ? array_values( array_filter( $steps, function ( $x ) { return 'Funded' === $x[0]; } ) ) : $steps;
}

function rp_rorg_activating( $p ) {
	$steps = rp_rorg_steps( $p );
	$texts = array(
		1 => array( 'Activating', 'FUNDED', 'ACTIVATED', 'funded so far' ),
		2 => array( 'Preparing the day', 'PREPARING', 'READY', 'of the preparations done' ),
		3 => array( 'Delivered', 'REPORTING', 'DELIVERED', 'of the results reported' ),
	);
	$t   = $texts[ rp_rorg_stage( $p ) ];
	$rings = rp_rorg_arcs( $p );
	$pct = (int) round( array_sum( array_column( $rings, 1 ) ) / count( $rings ) * 100 );
	$n   = count( $rings );
	$gap = 1 === $n ? 0 : ( $n > 5 ? 16 : 20 );
	$len = 360 / $n - $gap;
	$arc = function ( $start, $l, $c, $o ) {
		return $l > 0.01 ? sprintf( '<circle cx="60" cy="60" r="48" fill="none" stroke="%s" stroke-opacity="%s" stroke-width="13" stroke-linecap="round" pathLength="360" stroke-dasharray="%.2f %.2f" stroke-dashoffset="%.2f"/>', $c, $o, $l, 360 - $l, -$start ) : '';
	};
	$arcs = '';
	foreach ( $rings as $k => $x ) {
		$start = $k * ( $len + $gap ) + $gap / 2;
		$arcs .= $arc( $start, $len, $x[2], '.18' ) . $arc( $start, $len * $x[1], $x[2], '1' );
	}
	$items = '';
	foreach ( $steps as $x ) {
		$d      = $x[1];
		$items .= sprintf(
			'<li class="%s"><i style="background:%s"></i><span>%s</span><b>%s</b></li>',
			$d >= 1 ? 'done' : ( $d > 0 ? 'part' : '' ),
			$x[2],
			esc_html( $x[0] ),
			$d >= 1 ? '✓' : ( $x[3] && $d > 0 ? round( $d * 100 ) . '%' : '–' )
		);
	}
	return sprintf(
		'<div class="panel activating"><h2>%1$s</h2><div class="ring-row"><svg class="ring" viewBox="0 0 120 120" role="img" aria-label="%2$d%% %3$s"><g transform="rotate(-90 60 60)">%4$s</g><text x="60" y="%5$d" text-anchor="middle" class="ring-n">%2$d%%</text><text x="60" y="%6$d" text-anchor="middle" class="ring-l">%7$s</text></svg><ul class="ring-steps">%8$s</ul></div></div>',
		$t[0],
		$pct,
		$t[3],
		$arcs,
		100 === $pct ? 60 : 62,
		100 === $pct ? 77 : 78,
		100 === $pct ? $t[2] : $t[1],
		$items
	);
}

/** fmtDate() */
function rp_rorg_date( $d ) {
	$t = strtotime( strlen( (string) $d ) === 10 ? $d . ' 12:00:00' : (string) $d );
	return $t ? wp_date( 'M j, Y', $t ) : esc_html( $d );
}

/** md(): the small Markdown used on raavanaa.org (headings, lists, quotes, paragraphs). */
function rp_rorg_md( $src ) {
	$inline = function ( $t ) {
		$t = esc_html( $t );
		$t = preg_replace( '/\*\*(.+?)\*\*/', '<strong>$1</strong>', $t );
		return preg_replace( '/\*(.+?)\*/', '<em>$1</em>', $t );
	};
	$out = '';
	foreach ( preg_split( '/\n{2,}/', str_replace( "\r", '', (string) $src ) ) as $b ) {
		$t = trim( $b );
		if ( '' === $t ) {
			continue;
		}
		if ( false === strpos( $t, "\n" ) && preg_match( '/^(#{1,4})\s+(.*)$/', $t, $h ) ) {
			$n    = min( max( strlen( $h[1] ), 2 ), 4 );
			$out .= "<h$n>" . $inline( $h[2] ) . "</h$n>";
			continue;
		}
		$lines = explode( "\n", $t );
		if ( ! array_filter( $lines, function ( $l ) { return ! preg_match( '/^\s*[-*]\s+/', $l ); } ) ) {
			$out .= '<ul>' . implode( '', array_map( function ( $l ) use ( $inline ) { return '<li>' . $inline( preg_replace( '/^\s*[-*]\s+/', '', $l ) ) . '</li>'; }, $lines ) ) . '</ul>';
			continue;
		}
		$out .= '<p>' . implode( '<br>', array_map( $inline, $lines ) ) . '</p>';
	}
	return $out;
}

/** budgetDetailHTML( p, site, detail ). */
function rp_rorg_budget_detail( $p, $detail = false ) {
	$b  = rp_rorg_budget( $p );
	$st = rp_rorg_stage( $p );
	if ( ! $b['goal'] ) {
		return '<p class="b-wait">The budget for this project is being prepared. It will be shown here as soon as it is ready.</p>';
	}
	$sum = 0;
	foreach ( $b['lines'] as $x ) { $sum += rp_rorg_num( $x['amount'] ?? '' ); }
	$list = function ( $h, $total ) use ( $b, $p, $sum ) {
		if ( ! $b['lines'] ) {
			return '';
		}
		$out = '<h3 class="money-h">' . $h . '</h3><ul class="bx-list">';
		foreach ( $b['lines'] as $x ) {
			$out .= '<li><span>' . esc_html( $x['item'] ) . '</span><b>' . rp_rorg_money( $p, rp_rorg_num( $x['amount'] ?? '' ) ) . '</b></li>';
		}
		return $out . '</ul><p class="bx-total"><span>' . $total . '</span><b>' . rp_rorg_money( $p, $sum ) . '</b></p>';
	};
	$funders = function ( $h ) use ( $b, $p ) {
		if ( ! $b['funders'] ) {
			return '';
		}
		$out = '<h3 class="money-h">' . $h . '</h3><ul class="funders">';
		foreach ( $b['funders'] as $f ) {
			$words = array_filter( preg_split( '/\s+/', trim( (string) $f['name'] ) ), function ( $w ) { return preg_match( '/^[A-Za-z0-9]/', $w ); } );
			$init  = strtoupper( implode( '', array_slice( array_map( function ( $w ) { return $w[0]; }, $words ), 0, 2 ) ) );
			$a     = rp_rorg_num( $f['amount'] ?? '' );
			$out  .= '<li><span class="avatar">' . esc_html( $init ) . '</span><span class="f-name">' . esc_html( $f['name'] ) . '</span>' . ( $a ? '<b>' . rp_rorg_money( $p, $a ) . '</b>' : '' ) . '</li>';
		}
		return $out . '</ul>';
	};
	if ( 1 === $st ) {
		preg_match( '/\d+/', (string) ( $p['reach'] ?? '' ), $kids );
		return '<p class="b-top"><b>' . rp_rorg_money( $p, $b['goal'] ) . '</b> <span>budget</span></p>'
			. '<div class="b-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' . $b['pct'] . '" aria-label="Share of the budget funded"><i style="width:' . $b['pct'] . '%"></i></div>'
			. '<dl class="b-facts"><div><dt>Funded</dt><dd>' . $b['pct'] . '%</dd></div><div><dt>Still needed</dt><dd>' . rp_rorg_money( $p, max( 0, $b['goal'] - $b['raised'] ) ) . '</dd></div></dl>'
			. '<p class="b-ask">' . ( $b['raised'] ? 'Help us close the gap' : 'Be the first to sponsor' ) . ( $kids ? ' and give ' . esc_html( $kids[0] ) . ' children their day' : ' and make this day happen' ) . '.</p>'
			. $funders( 'Pledged so far' )
			. ( $detail ? $list( 'Estimated costs', 'Estimated total' ) : '' );
	}
	return '<p class="b-top"><b>' . rp_rorg_money( $p, $b['goal'] ) . '</b> <span>budget</span> <em class="b-full">✓ Fully funded</em></p>'
		. $funders( 'Made possible by' )
		. ( 3 === $st || $detail ? $list( 3 === $st ? 'Where the money went' : 'Estimated costs', 3 === $st ? 'Total spent' : 'Estimated total' ) : '' );
}

/** budgetBoxHTML( p, site, false ) */
function rp_rorg_budget_box( $p ) {
	$b  = rp_rorg_budget( $p );
	$st = rp_rorg_stage( $p );
	return '<div class="panel budget' . ( $b['full'] && $st > 1 ? ' full' : '' ) . '"><h2>Budget</h2>' . rp_rorg_budget_detail( $p ) . '</div>';
}

/** Each sponsor's share of the budget: name, amount, % of the goal. */
function rp_rorg_shares( $p ) {
	$b   = rp_rorg_budget( $p );
	$out = array();
	foreach ( $b['funders'] as $f ) {
		$a     = rp_rorg_num( $f['amount'] ?? '' );
		$out[] = array( $f['name'], $a, $b['goal'] ? (int) round( $a / $b['goal'] * 100 ) : 0 );
	}
	return $out;
}

/**
 * goPanelHTML(): the Initiated "Activating" box, "Help N children laugh. Let's take this to 100%."
 * RaavanaaPost changes (SURESH, 6 Nov 2026):
 *  - The sponsors' names sit under "Funded" with their share, e.g. "Kiri Family 25%".
 *  - A Donate button; it opens the pilot-phase note (no donations yet, sign up and follow).
 *  - The fold-out lists only the funding, sponsor by sponsor, and what is still to go.
 *  - "Make this happen" has two tabs: Donate, and Help another way (the note form).
 */
function rp_rorg_go_panel( $p, $cls ) {
	$steps  = rp_rorg_steps( $p );
	$b      = rp_rorg_budget( $p );
	$shares = rp_rorg_shares( $p );
	$rings  = rp_rorg_arcs( $p );
	$pct    = (int) round( array_sum( array_column( $rings, 1 ) ) / count( $rings ) * 100 );
	preg_match( '/\d+/', (string) ( $p['reach'] ?? '' ), $kids );
	$slice = 100 / count( $rings );
	$id    = preg_replace( '/\W/', '', $cls );
	$need  = max( 0, $b['goal'] - $b['raised'] );
	preg_match( '/<svg class="ring"[\s\S]*?<\/svg>/', rp_rorg_activating( $p ), $ring );
	$names = implode( ' · ', array_map( function ( $x ) { return esc_html( $x[0] ) . ' <b>' . $x[2] . '%</b>'; }, $shares ) );
	$raw   = 0;
	$items = '';
	foreach ( $steps as $k => $x ) {
		$d      = $x[1];
		$who    = ( 2 === $k && $names ) ? '<small class="rp-who">' . $names . '</small>' : '';
		$items .= sprintf( '<li class="%s"><i style="background:%s"></i><span>%s%s</span><b>%s</b></li>', $d >= 1 ? 'done' : ( $d > 0 ? 'part' : '' ), $x[2], esc_html( $x[0] ), $who, $d >= 1 ? '✓' : ( $x[3] && $d > 0 ? round( $d * 100 ) . '%' : '–' ) );
	}
	foreach ( $rings as $x ) {
		$raw += min( 1, $x[1] ) * $slice;
	}
	$heart  = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg>';
	$donate = '<button class="rp-donate" type="button" data-donate>' . $heart . '<span>Donate</span></button>';
	$form   = '';
	if ( $pct < 100 ) {
		$list = '';
		foreach ( $shares as $x ) {
			$list .= '<li class="done rp-funder"><i aria-hidden="true">' . $x[2] . '%</i><div><b>' . esc_html( $x[0] ) . '</b><span>Pledged ' . rp_rorg_money( $p, $x[1] ) . ' for this day.</span></div></li>';
		}
		$open_pct = $b['goal'] ? max( 0, 100 - array_sum( array_column( $shares, 2 ) ) ) : 0;
		$add      = $slice * ( 1 - min( 1, $b['goal'] ? $b['raised'] / $b['goal'] : 0 ) );
		$list    .= '<li class="todo" data-add="' . $add . '" tabindex="0"><i aria-hidden="true">' . ( $b['goal'] ? $open_pct . '%' : '…' ) . '</i><div><b>' . ( $shares ? 'Still to fund' : 'Be the first sponsor' ) . '</b><span>'
			. ( $b['goal'] ? rp_rorg_money( $p, $need ) . ' still to go. This is where you come in.' : "Opens as soon as the budget is ready. Send a note and we'll tell you first." ) . '</span></div></li>';
		$ways = '';
		foreach ( array( 'Give something the day needs (a van, food, gifts)', 'Help on the day', 'Share it with friends' ) as $x ) {
			$ways .= '<label class="go-way"><input type="checkbox" name="ways[]" value="' . esc_attr( $x ) . '"><span>' . esc_html( $x ) . '</span></label>';
		}
		$form = '<button class="go-open" type="button" aria-expanded="false" aria-controls="go-fold-' . $id . '"><span>See what\'s left to reach 100%</span><i aria-hidden="true">⌄</i></button>'
			. '<div class="go-fold" id="go-fold-' . $id . '" hidden><ol class="go-list">' . $list . '</ol>'
			. '<div class="go-form rp-make"><h3>Make this happen</h3>'
			. '<div class="rp-mk-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-mk="donate">' . $heart . 'Donate</button><button type="button" role="tab" aria-selected="false" data-mk="other">Help another way</button></div>'
			. '<div class="rp-mk-pane" data-mkpane="donate"><p class="go-sub">Want to give towards this day? Tap Donate and we\'ll tell you how it works during our pilot.</p>' . $donate . '</div>'
			. '<form class="rp-mk-pane" data-mkpane="other" hidden name="make-it-happen" method="post" action="' . esc_attr( wp_make_link_relative( get_permalink() ) ) . '?sent=1" data-netlify="true" netlify-honeypot="bot-field">'
			. '<p class="go-sub">Not able to give money? There are other ways to make this day happen. Tell us how you\'d like to help and we\'ll reach out.</p>'
			. '<input type="hidden" name="form-name" value="make-it-happen"><input type="hidden" name="project" value="' . esc_attr( get_post_field( 'post_name' ) ) . '">'
			. '<p hidden><label>Leave empty <input name="bot-field"></label></p>'
			. '<fieldset class="go-ways"><legend>I\'d love to…</legend>' . $ways . '</fieldset>'
			. '<label for="go-name-' . $id . '">Your name<input id="go-name-' . $id . '" name="name" required maxlength="80" autocomplete="name"></label>'
			. '<label for="go-contact-' . $id . '">Email or WhatsApp<input id="go-contact-' . $id . '" name="contact" required maxlength="120"></label>'
			. '<label for="go-note-' . $id . '">A note for us (optional)<textarea id="go-note-' . $id . '" name="note" maxlength="1500" rows="3"></textarea></label>'
			. '<button class="btn go-send" type="submit">Send my note</button></form></div></div>';
	}
	return '<div class="panel activating go100 ' . $cls . '" data-pct="' . $pct . '" data-raw="' . $raw . '"><p class="go-kicker">Activating</p>'
		. '<h2 class="go-title">Help ' . ( $kids ? esc_html( $kids[0] ) . ' children' : 'these children' ) . ' laugh. <span>Let\'s take this to 100%.</span></h2>'
		. '<div class="ring-row">' . ( $ring ? $ring[0] : '' ) . '<ul class="ring-steps">' . $items . '</ul></div>' . $form . '</div>';
}

/** The small Donate button on the picture of an Initiated story (SURESH, 6 Nov 2026). */
function rp_rorg_donate_btn() {
	return '<button class="rp-donate" type="button" data-donate><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg><span>Donate</span></button>';
}

/** The Donate pop-up: no donations during the pilot; join, sign up and follow instead. */
function rp_rorg_donate_pop() {
	return '<div class="rp-pop" id="rp-donate-pop" hidden><div class="rp-pop__card" role="dialog" aria-modal="true" aria-labelledby="rp-pop-h">'
		. '<button class="rp-pop__x" type="button" data-pop-close aria-label="Close">×</button>'
		. '<p class="rp-pop__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg></p>'
		. '<h2 id="rp-pop-h">Thank you for wanting to give!</h2>'
		. '<p>We are in our <b>pilot phase</b>, so we are not taking donations online yet. Every day so far has been made possible by our community.</p>'
		. '<p>Join the Raavanaa community: sign up and follow this project. We\'ll tell you the moment you can give, and share every smile you help create.</p>'
		. '<form class="rp-pop__form" name="follow" method="post" action="' . esc_attr( wp_make_link_relative( get_permalink() ) ) . '?followed=1" data-netlify="true" netlify-honeypot="bot-field">'
		. '<input type="hidden" name="form-name" value="follow"><input type="hidden" name="project" value="' . esc_attr( get_post_field( 'post_name' ) ) . '">'
		. '<p hidden><label>Leave empty <input name="bot-field"></label></p>'
		. '<label>Your name<input name="name" maxlength="80" autocomplete="name"></label>'
		. '<label>Email or WhatsApp<input name="contact" required maxlength="120"></label>'
		. '<button class="rp-donate rp-pop__go" type="submit"><span>Sign up and follow</span></button></form>'
		. '<p class="rp-pop__other"><button type="button" data-pop-other>Or help another way →</button></p>'
		. '</div></div>';
}

/** ringPanel(): the "go to 100%" box while a project is Initiated, the plain ring after that. */
function rp_rorg_ring_panel( $p, $cls ) {
	return 1 === rp_rorg_stage( $p ) ? rp_rorg_go_panel( $p, $cls ) : str_replace( 'class="panel activating"', 'class="panel activating ' . $cls . '"', rp_rorg_activating( $p ) );
}

/** expectHTML() */
function rp_rorg_expect( $p ) {
	$xs = rp_rorg_rows( $p, 'expectations', 'text' );
	$st = rp_rorg_stage( $p );
	if ( ! $xs || 1 === $st ) {
		return '';
	}
	if ( 2 === $st ) {
		$li = '';
		foreach ( $xs as $x ) { $li .= '<li><span class="ex-mark pending" aria-hidden="true">◎</span><span>' . esc_html( $x['text'] ) . '</span></li>'; }
		return '<section class="expect"><h3 class="money-h">What the organizers expect this day to achieve</h3><ul class="expect-list">' . $li . '</ul><p class="note">After the day, the organizers come back and mark each one, so you can see if it was achieved.</p></section>';
	}
	$r   = array( 'met' => array( '✓', 'Met' ), 'partly' => array( '◐', 'Partly met' ), 'not' => array( '✗', 'Not met' ) );
	$met = count( array_filter( $xs, function ( $x ) { return 'met' === ( $x['result'] ?? '' ); } ) );
	$li  = '';
	foreach ( $xs as $x ) {
		$res = $x['result'] ?? '';
		$m   = $r[ $res ] ?? array( '…', 'Being reviewed' );
		$li .= '<li class="r-' . esc_attr( $res ? $res : 'open' ) . '"><span class="ex-mark" aria-hidden="true">' . $m[0] . '</span><span>' . esc_html( $x['text'] ) . ( ! empty( $x['note'] ) ? '<small>' . esc_html( $x['note'] ) . '</small>' : '' ) . '</span><em>' . $m[1] . '</em></li>';
	}
	return '<section class="expect closed"><h3 class="money-h">Did the day deliver?</h3><p class="ex-score"><b>' . $met . ' of ' . count( $xs ) . '</b> expectations met</p><ul class="expect-list">' . $li . '</ul></section>';
}

/**
 * journeyHTML(). On RaavanaaPost a need story shows only "Smiles in the Making";
 * "Moments on the Way" and "Days of Joy, Created" are shown on impact stories only (SURESH, 6 Nov 2026).
 */
function rp_rorg_journey( $p ) {
	$w   = (array) ( $p['people'] ?? array() );
	$st  = rp_rorg_stage( $p );
	$b   = rp_rorg_budget( $p );
	$ex  = rp_rorg_rows( $p, 'expectations', 'text' );
	$rev = $ex && ! array_filter( $ex, function ( $x ) { return empty( $x['result'] ); } );
	$nf  = count( $b['funders'] );
	$S   = array(
		array( 1, 'Requested', $w['requested_by'] ?? '', $w['requested_on'] ?? '', true ),
		array( 1, 'Visited and verified', $w['verified_by'] ?? '', $w['verified_on'] ?? '', ! empty( $p['verified'] ) ),
		array( 1, 'Approved', $w['approved_by'] ?? '', $w['approved_on'] ?? '', ! empty( $w['approved_by'] ) || ! empty( $w['approved_on'] ) || $st > 1 ),
		array( 1, 'Fully funded', $nf ? $nf . ' sponsor' . ( $nf > 1 ? 's' : '' ) : '', $w['funded_on'] ?? '', $b['full'] || $st > 1 ),
		array( 2, 'Day prepared', ! empty( $w['day_lead'] ) ? 'Led by ' . $w['day_lead'] : '', '', $st > 2 || ( ! empty( $p['date_set'] ) && ! empty( $p['booked'] ) && ! empty( $p['volunteers'] ) ) ),
		array( 2, 'The day', $p['reach'] ?? '', $w['day_on'] ?? '', $st > 2 ),
		array( 3, 'Impact reviewed', $w['impact_by'] ?? '', $w['impact_on'] ?? '', $st > 2 && ( $rev || ! empty( $w['impact_by'] ) ) ),
	);
	$now = -1;
	foreach ( $S as $k => $x ) {
		if ( ! $x[4] ) { $now = $k; break; }
	}
	$G    = array( '', 'Smiles in the Making', 'Moments on the Way', 'Days of Joy, Created' );
	$html = '';
	$g    = 0;
	foreach ( $S as $k => $x ) {
		if ( $x[0] > 1 && $st < 3 ) {
			break;
		}
		if ( $x[0] !== $g ) {
			$g     = $x[0];
			$html .= ( $k ? '</ol>' : '' ) . '<p class="jr-g jr-g' . $g . '">' . $G[ $g ] . '</p><ol class="jr">';
		}
		$state = $x[4] ? 'done' : ( $k === $now ? 'now' : 'next' );
		$info  = implode( ' · ', array_filter( array( $x[2] ? esc_html( $x[2] ) : '', $x[3] ? rp_rorg_date( $x[3] ) : '' ) ) );
		// The funding step, while it is the current one, gets a small "Make it happen" nudge (SURESH, 6 Nov 2026).
		$cta   = ( 'now' === $state && 'Fully funded' === $x[1] && 1 === $st ) ? '<span class="jr-nudge"><svg class="jr-arrow" viewBox="0 0 56 34" width="44" height="27" aria-hidden="true"><path class="jr-arrow-line" d="M5 3c2 15 14 24 40 22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" pathLength="100"/><path class="jr-arrow-head" d="M37 17l9 8-10 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><button type="button" class="jr-cta" data-fund><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 7.5 2.9c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg>Be the reason they smile. Make it happen</button></span>' : '';
		$html .= '<li class="' . $state . ' jr' . $x[0] . '"><i aria-hidden="true">' . ( $x[4] ? '✓' : '' ) . '</i><span><b>' . $x[1] . '</b>' . ( $info ? '<small>' . $info . '</small>' : ( 'now' === $state ? '<small>In progress</small>' : '' ) ) . $cta . '</span></li>';
	}
	return '<div class="panel journey"><h2>The journey</h2>' . $html . '</ol></div>';
}

/** "Project at a glance", shown from a small icon on the picture (hover, or tap on a phone). */
function rp_rorg_glance( $p ) {
	$rows = '';
	foreach ( array( 'status' => 'Status', 'location' => 'Location', 'started' => 'Started', 'reach' => 'Reach' ) as $k => $l ) {
		if ( ! empty( $p[ $k ] ) ) {
			$rows .= '<dt>' . $l . '</dt><dd>' . esc_html( $p[ $k ] ) . '</dd>';
		}
	}
	$stats = '';
	foreach ( (array) ( $p['impact'] ?? array() ) as $s ) {
		if ( is_array( $s ) && ! empty( $s['value'] ) ) {
			$stats .= '<div class="stat"><b>' . esc_html( $s['value'] ) . '</b><span>' . esc_html( $s['label'] ?? '' ) . '</span></div>';
		}
	}
	return '<div class="glance"><button type="button" class="glance-btn" aria-expanded="false" aria-controls="rp-glance"><span>At a glance</span><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
		. '<div class="panel glance-card" id="rp-glance"><h2>Project at a glance</h2><dl class="facts">' . $rows . '</dl>' . ( $stats ? '<div class="stats">' . $stats . '</div>' : '' ) . '</div></div>';
}

/** The two boxes as on the project page: Activating, then Budget (no Budget box once the day has happened). */
function rp_raavanaa_boxes( $post = null ) {
	$p = rp_project( $post );
	if ( ! $p ) {
		return;
	}
	echo '<div class="rorg">' . rp_rorg_activating( $p ) . ( 3 === rp_rorg_stage( $p ) ? '' : rp_rorg_budget_box( $p ) ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
}
