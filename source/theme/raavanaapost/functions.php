<?php
/**
 * RaavanaaPost theme.
 *
 * @package RaavanaaPost
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RP_VERSION', '1.1.7' );
define( 'RP_DIR', get_template_directory() );
define( 'RP_URI', get_template_directory_uri() );

require RP_DIR . '/inc/setup.php';
require RP_DIR . '/inc/template-tags.php';
require RP_DIR . '/inc/story-fields.php';
require RP_DIR . '/inc/forms.php';
require RP_DIR . '/inc/customizer.php';
require RP_DIR . '/inc/admin.php';
require RP_DIR . '/inc/sample-content.php';
