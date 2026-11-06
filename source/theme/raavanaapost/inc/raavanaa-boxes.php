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
			array( 'Budget ready', $b['goal'] > 0 ? 1 : 0, '#3f9a5f', false ),
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
function rp_rorg_activating( $p ) {
	$steps = rp_rorg_steps( $p );
	$texts = array(
		1 => array( 'Activating', 'ACTIVATING', 'ACTIVATED', 'of the way to being activated' ),
		2 => array( 'Preparing the day', 'PREPARING', 'READY', 'of the preparations done' ),
		3 => array( 'Delivered', 'REPORTING', 'DELIVERED', 'of the results reported' ),
	);
	$t   = $texts[ rp_rorg_stage( $p ) ];
	$pct = (int) round( array_sum( array_column( $steps, 1 ) ) / count( $steps ) * 100 );
	$n   = count( $steps );
	$gap = $n > 5 ? 16 : 20;
	$len = 360 / $n - $gap;
	$arc = function ( $start, $l, $c, $o ) {
		return $l > 0.01 ? sprintf( '<circle cx="60" cy="60" r="48" fill="none" stroke="%s" stroke-opacity="%s" stroke-width="13" stroke-linecap="round" pathLength="360" stroke-dasharray="%.2f %.2f" stroke-dashoffset="%.2f"/>', $c, $o, $l, 360 - $l, -$start ) : '';
	};
	$arcs = '';
	foreach ( $steps as $k => $x ) {
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

/**
 * goPanelHTML(): the Initiated "Activating" box, "Help N children laugh. Let's take this to 100%.",
 * with "See what's left to reach 100%" and the "Make this happen" note. On RaavanaaPost the note is a
 * Netlify form of the RaavanaaPost site (form name "make-it-happen").
 */
function rp_rorg_go_panel( $p, $cls ) {
	$steps = rp_rorg_steps( $p );
	$b     = rp_rorg_budget( $p );
	$pct   = (int) round( array_sum( array_column( $steps, 1 ) ) / count( $steps ) * 100 );
	preg_match( '/\d+/', (string) ( $p['reach'] ?? '' ), $kids );
	$slice = 100 / count( $steps );
	$id    = preg_replace( '/\W/', '', $cls );
	$need  = max( 0, $b['goal'] - $b['raised'] );
	$say   = array(
		function ( $d ) { return $d ? 'Our team visited and saw the need for themselves.' : 'Our team visits to make sure the need is real. Know this place? Tell us below.'; },
		function ( $d ) use ( $p, $b ) { return $d ? 'We know what the day costs: ' . rp_rorg_money( $p, $b['goal'] ) . '.' : "We're working out what the day will cost: transport, food, tickets."; },
		function ( $d ) use ( $p, $b, $need ) { return $d >= 1 ? 'Every part of the day is covered.' : ( $b['goal'] ? rp_rorg_money( $p, $need ) . ' still to go. This is where you come in.' : "Opens as soon as the budget is ready. Send a note and we'll tell you first." ); },
	);
	$ways = array( 'Cover part of the day', 'Cover the whole day', 'Give something the day needs (a van, food, gifts)', 'Help on the day', 'Share it with friends' );
	preg_match( '/<svg class="ring"[\s\S]*?<\/svg>/', rp_rorg_activating( $p ), $ring );
	$raw   = 0;
	$items = '';
	$list  = '';
	foreach ( $steps as $k => $x ) {
		$d      = $x[1];
		$raw   += min( 1, $d ) * $slice;
		$items .= sprintf( '<li class="%s"><i style="background:%s"></i><span>%s</span><b>%s</b></li>', $d >= 1 ? 'done' : ( $d > 0 ? 'part' : '' ), $x[2], esc_html( $x[0] ), $d >= 1 ? '✓' : ( $x[3] && $d > 0 ? round( $d * 100 ) . '%' : '–' ) );
		$add    = $slice * ( 1 - min( 1, $d ) );
		$list  .= '<li class="' . ( $d >= 1 ? 'done' : 'todo' ) . '" data-add="' . $add . '"' . ( $d >= 1 ? '' : ' tabindex="0"' ) . '><i aria-hidden="true">' . ( $d >= 1 ? '✓' : '+' . round( $add ) . '%' ) . '</i><div><b>' . esc_html( $x[0] ) . '</b><span>' . ( isset( $say[ $k ] ) ? $say[ $k ]( $d ) : '' ) . '</span></div></li>';
	}
	$form = '';
	if ( $pct < 100 ) {
		$w = '';
		foreach ( $ways as $x ) { $w .= '<label class="go-way"><input type="checkbox" name="ways[]" value="' . esc_attr( $x ) . '"><span>' . esc_html( $x ) . '</span></label>'; }
		$form = '<button class="go-open" type="button" aria-expanded="false" aria-controls="go-fold-' . $id . '"><span>See what\'s left to reach 100%</span><i aria-hidden="true">⌄</i></button>'
			. '<div class="go-fold" id="go-fold-' . $id . '" hidden><ol class="go-list">' . $list . '</ol>'
			. '<form class="go-form" name="make-it-happen" method="post" action="?sent=1#go-fold-' . $id . '" data-netlify="true" netlify-honeypot="bot-field"><h3>Make this happen</h3>'
			. '<p class="go-sub">Send us a note. No payment here: just tell us how you\'d like to help and we\'ll reach out.</p>'
			. '<input type="hidden" name="form-name" value="make-it-happen"><input type="hidden" name="project" value="' . esc_attr( get_post_field( 'post_name' ) ) . '">'
			. '<p hidden><label>Leave empty <input name="bot-field"></label></p>'
			. '<fieldset class="go-ways"><legend>I\'d love to…</legend>' . $w . '</fieldset>'
			. '<label for="go-name-' . $id . '">Your name<input id="go-name-' . $id . '" name="name" required maxlength="80" autocomplete="name"></label>'
			. '<label for="go-contact-' . $id . '">Email or WhatsApp<input id="go-contact-' . $id . '" name="contact" required maxlength="120"></label>'
			. '<label for="go-note-' . $id . '">A note for us (optional)<textarea id="go-note-' . $id . '" name="note" maxlength="1500" rows="3"></textarea></label>'
			. '<button class="btn go-send" type="submit">Send my note</button></form></div>';
	}
	return '<div class="panel activating go100 ' . $cls . '" data-pct="' . $pct . '" data-raw="' . $raw . '"><p class="go-kicker">Activating</p>'
		. '<h2 class="go-title">Help ' . ( $kids ? esc_html( $kids[0] ) . ' children' : 'these children' ) . ' laugh. <span>Let\'s take this to 100%.</span></h2>'
		. '<div class="ring-row">' . ( $ring ? $ring[0] : '' ) . '<ul class="ring-steps">' . $items . '</ul></div>' . $form . '</div>';
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
		$html .= '<li class="' . $state . ' jr' . $x[0] . '"><i aria-hidden="true">' . ( $x[4] ? '✓' : '' ) . '</i><span><b>' . $x[1] . '</b>' . ( $info ? '<small>' . $info . '</small>' : ( 'now' === $state ? '<small>In progress</small>' : '' ) ) . '</span></li>';
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
	return '<div class="glance"><button type="button" class="glance-btn" aria-label="Project at a glance" aria-describedby="rp-glance"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".6" fill="currentColor"/></svg><span>At a glance</span></button>'
		. '<div class="panel glance-card" id="rp-glance" role="tooltip"><h2>Project at a glance</h2><dl class="facts">' . $rows . '</dl>' . ( $stats ? '<div class="stats">' . $stats . '</div>' : '' ) . '</div></div>';
}

/** The two boxes as on the project page: Activating, then Budget (no Budget box once the day has happened). */
function rp_raavanaa_boxes( $post = null ) {
	$p = rp_project( $post );
	if ( ! $p ) {
		return;
	}
	echo '<div class="rorg">' . rp_rorg_activating( $p ) . ( 3 === rp_rorg_stage( $p ) ? '' : rp_rorg_budget_box( $p ) ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
}
