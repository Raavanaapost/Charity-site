#!/bin/bash
# Rebuilds RaavanaaPost's static site (../../site) from the theme and stories
# in ../theme and ../content. Needs PHP 8 with pdo_sqlite, git, curl and python3.
# It makes a throw-away local WordPress in $RP_WORK (default /tmp/rp-wp).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${RP_WORK:-/tmp/rp-wp}"
mkdir -p "$WORK"
cd "$WORK"

[ -d wp ] || { git clone -q -c advice.detachedHead=false --depth 1 --branch 7.1.4 https://github.com/WordPress/WordPress.git wp; rm -rf wp/.git; }
[ -d sqlite-mono ] || git clone -q -c advice.detachedHead=false --depth 1 --branch v3.1.2 https://github.com/WordPress/sqlite-database-integration.git sqlite-mono
PLUGIN="$WORK/wp/wp-content/plugins/sqlite-database-integration"
[ -d "$PLUGIN" ] || cp -rL sqlite-mono/packages/plugin-sqlite-database-integration "$PLUGIN"
sed "s#{SQLITE_IMPLEMENTATION_FOLDER_PATH}#$PLUGIN#; s#{SQLITE_PLUGIN}#sqlite-database-integration/load.php#" "$PLUGIN/db.copy" > wp/wp-content/db.php
[ -f wp-cli.phar ] || curl -sSL -o wp-cli.phar https://github.com/wp-cli/wp-cli/releases/download/v2.12.0/wp-cli-2.12.0.phar

cat > wp/wp-config.php <<'PHP'
<?php
define( 'DB_NAME', 'wp' ); define( 'DB_USER', 'wp' ); define( 'DB_PASSWORD', 'wp' ); define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' ); define( 'DB_COLLATE', '' );
define( 'AUTH_KEY', 'a1' ); define( 'SECURE_AUTH_KEY', 'a2' ); define( 'LOGGED_IN_KEY', 'a3' ); define( 'NONCE_KEY', 'a4' );
define( 'AUTH_SALT', 'a5' ); define( 'SECURE_AUTH_SALT', 'a6' ); define( 'LOGGED_IN_SALT', 'a7' ); define( 'NONCE_SALT', 'a8' );
$table_prefix = 'wp_';
define( 'WP_DEBUG', false );
define( 'WP_HTTP_BLOCK_EXTERNAL', true );
define( 'AUTOMATIC_UPDATER_DISABLED', true );
define( 'DISABLE_WP_CRON', true );
if ( ! defined( 'ABSPATH' ) ) { define( 'ABSPATH', __DIR__ . '/' ); }
require_once ABSPATH . 'wp-settings.php';
PHP

cat > router.php <<'PHP'
<?php
$root = $_SERVER['DOCUMENT_ROOT'];
$path = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
if ( $path !== '/' && file_exists( $root . $path ) && ! is_dir( $root . $path ) ) { return false; }
$_SERVER['SCRIPT_NAME'] = '/index.php';
include $root . '/index.php';
PHP

printf '#!/bin/bash\nphp %s/wp-cli.phar --allow-root --path=%s/wp "$@"\n' "$WORK" "$WORK" > wpcli.sh
chmod +x wpcli.sh
WPCLI="$WORK/wpcli.sh"

$WPCLI core is-installed 2>/dev/null || $WPCLI core install --url=http://localhost:8899 --title=RaavanaaPost --admin_user=admin --admin_password="$(date +%s%N)" --admin_email=admin@example.com --skip-email
$WPCLI option update siteurl http://localhost:8899 >/dev/null
$WPCLI option update home http://localhost:8899 >/dev/null
$WPCLI option update timezone_string America/Toronto >/dev/null
$WPCLI rewrite structure '/%postname%/' >/dev/null
rm -rf wp/wp-content/themes/raavanaapost
cp -r "$HERE/../theme/raavanaapost" wp/wp-content/themes/raavanaapost
$WPCLI theme activate raavanaapost >/dev/null
$WPCLI eval 'rp_install_samples();'
$WPCLI eval-file "$HERE/../content/load-news.php"
$WPCLI eval-file "$HERE/../content/live-settings.php"

php -S localhost:8899 -t wp router.php > server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
RP_WP_DIR="$WORK/wp" RP_WPCLI="$WPCLI" python3 "$HERE/static-export.py"
echo "Done: the site is in $(cd "$HERE/../.." && pwd)/site"
