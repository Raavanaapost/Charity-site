<?php
/**
 * Prints RaavanaaPost's stories (from source/content/load-news.php) and raavanaa.org's projects as JSON,
 * so the picture robot can read them without WordPress. Run: php tools/pictures/export_stories.php
 */
$root = dirname( __DIR__, 2 );
$src  = file_get_contents( $root . '/source/content/load-news.php' );
foreach ( array( 'n_p', 'n_h', 'n_q', 'n_ul' ) as $f ) {
	// These small helpers are one line each in load-news.php; reuse them so story bodies read the same way.
	if ( preg_match( '/^function ' . $f . '\(.*$/m', $src, $m ) ) { eval( $m[0] ); }
}
function n_img( $id, $caption ) { return ''; }
function esc_attr( $s ) { return $s; }
$ph  = array();
$now = time();
if ( ! preg_match( '/^\$stories = array\(.*?^\);/ms', $src, $m ) ) { fwrite( STDERR, "stories not found\n" ); exit( 1 ); }
$ph = new class() implements ArrayAccess {
	public function offsetExists( $o ): bool { return true; }
	public function offsetGet( $o ): mixed { return 0; }
	public function offsetSet( $o, $v ): void {}
	public function offsetUnset( $o ): void {}
};
eval( $m[0] );
$projects = json_decode( (string) @file_get_contents( $root . '/source/content/projects.json' ), true ) ?: array();
$out = array();
foreach ( $stories as $s ) {
	$p     = ! empty( $s['project'] ) && isset( $projects[ $s['project'] ] ) ? $projects[ $s['project'] ] : array();
	$body  = trim( preg_replace( '/\s+/', ' ', html_entity_decode( strip_tags( preg_replace( '/%IMG_[A-Z_]+%/', '', (string) ( $s['body'] ?? '' ) ) ) ) ) );
	$out[] = array(
		'key'     => $s['key'] ?? sanitize( $s['title'] ),
		'title'   => $s['title'],
		'place'   => $s['place'] ?? '',
		'cats'    => $s['cats'] ?? array(),
		'stage'   => $s['stage'] ?? '',
		'excerpt' => $s['excerpt'] ?? '',
		'tagline' => $p['tagline'] ?? '',
		'reach'   => $p['reach'] ?? '',
		'body'    => mb_substr( $body, 0, 3000 ),
	);
}
function sanitize( $t ) { return trim( preg_replace( '/[^a-z0-9]+/', '-', strtolower( $t ) ), '-' ); }
echo json_encode( $out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ), "\n";
