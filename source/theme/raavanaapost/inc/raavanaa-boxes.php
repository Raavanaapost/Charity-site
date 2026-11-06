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

/** budgetBoxHTML( p, site, false ), with budgetDetailHTML() inside. */
function rp_rorg_budget_box( $p ) {
	$b  = rp_rorg_budget( $p );
	$st = rp_rorg_stage( $p );
	if ( ! $b['goal'] ) {
		$inner = '<p class="b-wait">The budget for this project is being prepared. It will be shown here as soon as it is ready.</p>';
	} else {
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
			$inner = '<p class="b-top"><b>' . rp_rorg_money( $p, $b['goal'] ) . '</b> <span>budget</span></p>'
				. '<div class="b-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' . $b['pct'] . '" aria-label="Share of the budget funded"><i style="width:' . $b['pct'] . '%"></i></div>'
				. '<dl class="b-facts"><div><dt>Funded</dt><dd>' . $b['pct'] . '%</dd></div><div><dt>Still needed</dt><dd>' . rp_rorg_money( $p, max( 0, $b['goal'] - $b['raised'] ) ) . '</dd></div></dl>'
				. '<p class="b-ask">' . ( $b['raised'] ? 'Help us close the gap' : 'Be the first to sponsor' ) . ( $kids ? ' and give ' . esc_html( $kids[0] ) . ' children their day' : ' and make this day happen' ) . '.</p>'
				. $funders( 'Pledged so far' );
		} else {
			$inner = '<p class="b-top"><b>' . rp_rorg_money( $p, $b['goal'] ) . '</b> <span>budget</span> <em class="b-full">✓ Fully funded</em></p>' . $funders( 'Made possible by' );
		}
	}
	return '<div class="panel budget' . ( $b['full'] && $st > 1 ? ' full' : '' ) . '"><h2>Budget</h2>' . $inner . '</div>';
}

/** The two boxes as on the project page: Activating, then Budget (no Budget box once the day has happened). */
function rp_raavanaa_boxes( $post = null ) {
	$p = rp_project( $post );
	if ( ! $p ) {
		return;
	}
	echo '<div class="rorg">' . rp_rorg_activating( $p ) . ( 3 === rp_rorg_stage( $p ) ? '' : rp_rorg_budget_box( $p ) ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
}
