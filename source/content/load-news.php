<?php
/**
 * RaavanaaPost stories. Loads every story, photo, section and page into a
 * local WordPress that uses the RaavanaaPost theme. Run with:
 *   wp eval-file load-news.php
 * Then run live-settings.php, then build/static-export.py.
 */
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

if ( ! defined( 'N_IMG' ) ) { define( 'N_IMG', __DIR__ . '/photos/' ); }

// 1. Clear every story (samples and earlier runs). Pages and sections stay.
foreach ( get_posts( array( 'numberposts' => -1, 'post_status' => 'any', 'fields' => 'ids' ) ) as $id ) {
	wp_delete_post( $id, true );
}
update_option( 'sticky_posts', array() );
foreach ( get_posts( array( 'post_type' => 'attachment', 'numberposts' => -1, 'fields' => 'ids', 'post_status' => 'any' ) ) as $id ) {
	wp_delete_attachment( $id, true );
}

// 2. Sections.
$sections = array(
	'community-needs' => 'Community needs',
	'real-impact'     => 'Real impact',
	'sri-lanka'       => 'Sri Lanka',
	'diaspora'        => 'Diaspora',
	'culture'         => 'Culture',
	'sports'          => 'Sports',
	'opinion'         => 'Voices',
);
$cat = array();
foreach ( $sections as $slug => $name ) {
	$t = get_term_by( 'slug', $slug, 'category' );
	if ( $t ) {
		wp_update_term( $t->term_id, 'category', array( 'name' => $name ) );
		$cat[ $slug ] = $t->term_id;
	} else {
		$r            = wp_insert_term( $name, 'category', array( 'slug' => $slug ) );
		$cat[ $slug ] = $r['term_id'];
	}
}
wp_update_term( get_term_by( 'slug', 'real-impact', 'category' )->term_id, 'category', array( 'description' => 'Days of joy that happened, with the story, the pictures and what was spent.' ) );
wp_update_term( get_term_by( 'slug', 'community-needs', 'category' )->term_id, 'category', array( 'description' => 'Needs that have reached the Raavanaa team, and where each one stands.' ) );
wp_update_term( get_term_by( 'slug', 'opinion', 'category' )->term_id, 'category', array( 'description' => 'In their own words: the people behind each day of joy.' ) );

// Helpers.
function n_p( $t ) { return "<!-- wp:paragraph -->\n<p>$t</p>\n<!-- /wp:paragraph -->\n\n"; }
function n_h( $t ) { return "<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">$t</h2>\n<!-- /wp:heading -->\n\n"; }
function n_q( $t, $cite ) { return "<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><!-- wp:paragraph -->\n<p>$t</p>\n<!-- /wp:paragraph --><cite>$cite</cite></blockquote>\n<!-- /wp:quote -->\n\n"; }
function n_ul( $items ) { return "<!-- wp:list -->\n<ul class=\"wp-block-list\">" . implode( '', array_map( function ( $i ) { return "<!-- wp:list-item -->\n<li>$i</li>\n<!-- /wp:list-item -->"; }, $items ) ) . "</ul>\n<!-- /wp:list -->\n\n"; }
function n_img( $id, $caption ) {
	$url = wp_get_attachment_image_url( $id, 'large' );
	return "<!-- wp:image {\"id\":$id,\"sizeSlug\":\"large\"} -->\n<figure class=\"wp-block-image size-large\"><img src=\"$url\" alt=\"" . esc_attr( $caption ) . "\" class=\"wp-image-$id\"/><figcaption class=\"wp-element-caption\">$caption</figcaption></figure>\n<!-- /wp:image -->\n\n";
}
function n_photo( $file, $caption ) {
	$tmp = wp_tempnam( basename( $file ) );
	copy( N_IMG . $file, $tmp );
	$id = media_handle_sideload( array( 'name' => str_replace( '/', '-', $file ), 'tmp_name' => $tmp ), 0, $caption );
	if ( is_wp_error( $id ) ) { WP_CLI::error( $id->get_error_message() ); }
	update_post_meta( $id, '_wp_attachment_image_alt', $caption );
	wp_update_post( array( 'ID' => $id, 'post_excerpt' => $caption ) );
	return $id;
}

$ph = array(
	'maha_cover'  => n_photo( 'yogapuram-preschool/cover.jpg', 'Children, parents and teachers together at the Black Bridge' ),
	'maha_grass'  => n_photo( 'yogapuram-preschool/snacks-on-the-grass.jpg', 'Ice cream on the grass by the river' ),
	'maha_hall'   => n_photo( 'yogapuram-preschool/temple-hall.jpg', 'Inside Banalingeswaram temple' ),
	'maha_drawn'  => n_photo( 'yogapuram-preschool/bridge-illustration.jpg', 'Children, parents and teachers at the Black Bridge (AI illustration)' ),
	'maha_temple' => n_photo( 'yogapuram-preschool/at-the-temple.jpg', 'Children, parents and teachers at the temple' ),
	'maha_treats' => n_photo( 'yogapuram-preschool/sharing-treats.jpg', 'Snacks for every child' ),
	'pus_cover'   => n_photo( 'pussellawa/cover.jpg', 'Looking out over the hills at Hanuman Kovil' ),
	'pus_games'   => n_photo( 'pussellawa/games-on-the-lawn.jpg', 'Games on the lawn' ),
	'pus_dance'   => n_photo( 'pussellawa/dancing.jpg', 'Dancing in their best clothes' ),
	'pus_run'     => n_photo( 'pussellawa/running-together.jpg', 'Running together' ),
	'pus_hills'   => n_photo( 'pussellawa/hills-view.jpg', 'The view from Hanuman Kovil' ),
	'pus_look'    => n_photo( 'pussellawa/looking-out.jpg', 'A quiet moment with the view' ),
);

/* Fixed to when the stories were first published, so a rebuild keeps their dates. */
$now = strtotime( '2026-11-01T15:07:22+00:00' );
$by  = 'RaavanaaPost team';
$stories = array(
	array(
		'key'     => 'A',
		'project' => 'yogapuram-preschool-day',
		'title'   => 'Ice cream, a river and a temple: a day to remember for Yogapuram\'s pre-schoolers',
		'cats'    => array( 'real-impact', 'sri-lanka' ),
		'place'   => 'Yogapuram, Mullaitivu',
		'excerpt' => 'Seventeen little ones, 20 parents and two teachers spent an afternoon at the old Black Bridge over the Pali Aru and at Banalingeswaram temple in Oddankulam.',
		'stage'   => 'solved',
		'update'  => 'The day happened on 12 October, and the full Rs 20,000 went to the trip.',
		'hours'   => 0,
		'views'   => 140,
		'thumb'   => 'maha_drawn', // SURESH's Gemini illustration in place of the group photo (7 Nov 2026)
		'body'    => n_p( 'On 12 October 2026, 17 children from a pre-school in Yogapuram set off for an afternoon out with 20 parents, two teachers and members of the pre-school\'s management. The bus left at 3.30 and reached the Black Bridge (Karutha Palam) over the Pali Aru at 3.45.' )
			. n_p( 'The children had ice cream, danced together and watched the river flow quietly under the old bridge, said to have been built by the Dutch. Then they went down into the water to play. For many of them it was the first day like this in a long time.' )
			. '%IMG_GRASS%'
			. n_p( 'Next came Banalingeswaram Narmatha Natheeswarar temple, where the children looked at the carved sculptures of the Nayanmars and walked through the flower garden. Outside the temple they danced again and shared snacks. Everyone left at 5.45 and was back at the pre-school by 6.00.' )
			. n_q( 'It was a wonderful day! The happiness on the children\'s faces is the greatest gift we received.', 'Sarvika, the pre-school\'s manager, the day after' )
			. n_h( 'Where the money went' )
			. n_p( 'The full cost of the trip, Rs 20,000, was covered by Friends of Raavanaa: the bus, food and snacks, and what the children needed for the day.' )
			. '%IMG_HALL%'
			. n_p( 'This was a Raavanaa – Beyond the Lanes day of joy. See every project at <a href="https://raavanaa.org">raavanaa.org</a>.' ),
	),
	array(
		'key'     => 'KT',
		'project' => 'pussellawa-kandy-trip',
		'title'   => 'A first school trip: Pussellawa pupils hope to see Kandy',
		'art'     => 'kandy-trip',
		'cats'    => array( 'community-needs', 'sri-lanka' ),
		'place'   => 'Pussellawa, Kandy District',
		'excerpt' => 'The children of a small Tamil primary school in Pussellawa\'s tea country have never been on a school trip. On Friday 27 November they hope to visit the Temple of the Tooth and the Peradeniya gardens.',
		'stage'   => 'reported',
		'update'  => 'Visited and verified. The day has moved to 27 November, and the Rs 61,000 for the bus and food is still to be covered.',
		'highlights' => array(
			'52 children have never been on a school trip',
			'Friday 27 November: the Temple of the Tooth, Kandy',
			'Then the Peradeniya gardens on the way home',
			'Half pledged. Rs 30,500 still to go',
		),
		'hours'   => -68,
		'views'   => 30,
		'body'    => n_p( 'The second request from Pussellawa has been checked and is now a project. It comes from a small Tamil primary school in the tea country, with 52 children and 6 teachers. The principal calls it a fully disadvantaged school, and says these children have never been anywhere on an excursion.' )
			. n_p( 'The school\'s vision is to give society primary pupils with sound skills and good character. Its mission is to give every pupil all the core skills and the chance to go on to secondary education.' )
			. n_h( 'The plan' )
			. n_p( 'On Friday 27 November 2026, about 55 children and teachers travel by bus to Kandy, about 50 km away. They visit the Sri Dalada Maligawa, the Temple of the Tooth, and stop at the Peradeniya gardens on the way back. The school has permission for the trip from the Department of Education.' )
			. n_h( 'What it costs' )
			. n_ul( array( 'Bus to Kandy and back: about Rs 30,000', 'Food for the whole group: about Rs 31,000' ) )
			. n_p( 'Rs 61,000 in all. After the day we will share the story and the pictures here.' )
			. n_p( 'See the project on <a href="https://raavanaa.org">raavanaa.org</a>.' ),
	),
	array(
		'key'     => 'F',
		'title'   => 'Two new requests reach the Raavanaa team',
		'art'     => 'two-requests',
		'cats'    => array( 'community-needs' ),
		'place'   => '',
		'excerpt' => 'A day out for children from a children\'s home, and a second request from Pussellawa in the hill country. Both are being checked.',
		'hours'   => 1,
		'views'   => 40,
		'body'    => n_p( 'Two new requests for a day of joy reached the Raavanaa team in October. One is for children from a children\'s home. The other comes from Pussellawa, in the tea country, where the first Raavanaa day in the hill country took place on 12 October.' )
			. n_p( 'As with every request, the team calls and visits before anything is shared. Until then we keep names and places private. When a request is checked and becomes a project, it will appear here as Initiated.' ),
	),
	array(
		'key'     => 'M',
		'title'   => 'How a Raavanaa day of joy happens: Initiated, Activated, Impact',
		'art'     => 'day-of-joy',
		'cats'    => array( 'community-needs' ),
		'place'   => '',
		'excerpt' => 'Every project is one simple, happy day: a game, a trip or a good meal. Here is how a need becomes a day the children remember.',
		'hours'   => 2,
		'views'   => 55,
		'body'    => n_p( 'Some children grow up without ever going to a game, seeing a new place or sitting down to a really good meal. Raavanaa exists for one thing: giving children a day of joy they will remember. Every project moves through three stages.' )
			. n_h( 'Initiated' )
			. n_p( 'A teacher, a children\'s home, an organisation or one of our members tells us about children who are waiting for a day like this. We visit, listen and make sure the need is real.' )
			. n_h( 'Activated' )
			. n_p( 'The day is funded by friends, family and supporters of Raavanaa, and then planned: the date, the place, the food and the helpers.' )
			. n_h( 'Impact' )
			. n_p( 'The day happens. We come back with the story, the pictures and what was spent, so everyone who gave can see the smiles they created.' )
			. n_h( 'The promise' )
			. n_ul( array( 'Every need is checked in person before a project is shared.', 'Every penny goes to the project itself. Nothing is kept for running costs.', 'Every project shows its budget and who made it possible.', 'The children\'s safety and dignity always come first.' ) ),
	),
	array(
		'key'     => 'H',
		'title'   => 'Cholan v Pandiyan: inside the Kingpins Crew bowling league',
		'art'     => 'cholan-pandiyan',
		'cats'    => array( 'sports' ),
		'place'   => '',
		'excerpt' => 'Two teams, a 16-week season and medals every Saturday: a look at the Raavanaa bowling league.',
		'hours'   => 3,
		'views'   => 50,
		'body'    => n_p( 'The Kingpins Crew league bowls on Saturdays, with two teams: Cholan, in crimson and gold, captained by Myooran, and Pandiyan, in green, captained by Sabes.' )
			. n_p( 'The season runs for 16 weeks. Every week there are gold, silver and bronze medals in seven categories, and a weekly MVP. At the end of the season there is a prize for the most medals, and a season MVP.' )
			. n_p( 'Follow the standings and the weekly results at <a href="https://raavanaabowling.com">raavanaabowling.com</a>.' ),
	),
	array(
		'key'     => 'D',
		'project' => 'casuarina-beach-day',
		'title'   => 'Casuarina Beach day is funded: about 25 children are going to the sea',
		'art'     => 'beach-day',
		'cats'    => array( 'community-needs', 'sri-lanka' ),
		'place'   => 'Karainagar, Jaffna',
		'excerpt' => 'Sand, waves, kites and a good lunch under the casuarina trees. The day is fully funded and the van is booked.',
		'stage'   => 'help',
		'update'  => 'Fully funded by Kiri & Family. The van is booked and the volunteers are getting ready.',
		'hours'   => 4,
		'views'   => 90,
		'body'    => n_p( 'Many of these children live less than an hour from the sea and have never spent a day on the beach. Transport, food and a safe group are what stand between them and the shore.' )
			. n_h( 'The plan' )
			. n_p( 'A van takes the group to Casuarina Beach in the morning. The children play games, fly kites and build sandcastles with volunteers watching the water, then share lunch in the shade before heading home with a small gift.' )
			. n_h( 'Who made it possible' )
			. n_p( 'The day is fully funded by Kiri &amp; Family, $600 in all:' )
			. n_ul( array( 'Van hire to Karainagar and back: $220', 'Lunch, snacks and water: $200', 'Beach games, balls and kites: $80', 'A small gift for each child: $60', 'First aid and sun care: $40' ) )
			. n_p( 'After the day we will share the story and the pictures here.' ),
	),
	array(
		'key'     => 'E',
		'project' => 'bowling-day',
		'title'   => 'A bowling day for children with special needs is being planned',
		'art'     => 'bowling-day',
		'cats'    => array( 'community-needs' ),
		'place'   => '',
		'excerpt' => 'A full day at the lanes, where every child gets a turn and every roll gets a cheer.',
		'stage'   => 'reported',
		'update'  => 'The budget for the day has been requested, and we are waiting for the reply.',
		'hours'   => 5,
		'views'   => 75,
		'body'    => n_p( 'A day out for a whole group of children with special needs takes transport, extra helpers and a budget, so it does not happen often. These are exactly the days a child remembers.' )
			. n_h( 'The plan' )
			. n_p( 'A full day at the bowling lanes, where every child gets a turn and every roll gets a cheer, with transport, food and helpers arranged for the group.' )
			. n_p( 'The budget for the day has been requested. As soon as it is ready, we will share it here, and the project can move to Activated.' ),
	),
	array(
		'key'     => 'B',
		'project' => 'pussellawa-kids-trip',
		'title'   => 'A day in the hills for the children of Pussellawa',
		'cats'    => array( 'real-impact', 'sri-lanka' ),
		'place'   => 'Pussellawa, Kandy District',
		'excerpt' => 'Games on the lawn, dancing in their best clothes and a view over the mountains at Hanuman Kovil.',
		'stage'   => 'solved',
		'update'  => 'The day happened on 12 October. Rs 19,250 covered the vehicle and the food.',
		'hours'   => 6,
		'views'   => 120,
		'thumb'   => 'pus_cover',
		'body'    => n_p( 'Pussellawa is a tea-country town, and many of its children grow up among the estates. Families work hard, and a day away together is rare. Transport and food are what stand between these children and a day out.' )
			. n_p( 'On 12 October 2026 a hired vehicle took the children to Hanuman Kovil, in the hills on the road between Gampola and Nuwara Eliya. On the big lawn they played running games, held hands in circles and danced, while the grown-ups watched over them. Some of the little ones simply stood and looked out at the mountains.' )
			. '%IMG_GAMES%'
			. n_q( 'The children truly enjoyed the experience and were very happy.', 'The organisers in Pussellawa, on the day' )
			. n_h( 'Where the money went' )
			. n_p( 'Every rupee went to the day itself: Rs 10,500 for the vehicle and Rs 8,750 for food, Rs 19,250 in total, covered by Friends of Raavanaa. It was the first Raavanaa day in the hill country.' ),
	),
	array(
		'key'     => 'C',
		'project' => 'mums-and-kids-day-out',
		'title'   => 'Mums and kids, united: a day out together in Kilinochchi',
		'art'     => 'mums-and-kids',
		'cats'    => array( 'real-impact', 'sri-lanka' ),
		'place'   => 'Kilinochchi',
		'excerpt' => 'Sack races, a tug of war the mums won, and a long lunch in the shade.',
		'stage'   => 'solved',
		'update'  => '18 mums and 30 children had their day out, and every family took home a printed photo.',
		'hours'   => 7,
		'views'   => 100,
		'body'    => n_p( 'For many of these mums, days off are rare, and days out with their children rarer still. So the day was theirs: no cooking and no chores, only time together.' )
			. n_p( 'A bus took 18 mums and 30 children out for the day. They played sack races and a tug of war, which the mums won, then sat down to a long lunch in the shade. For many mums it was the first day in years with no work to do. Every family went home with a printed photo of the day.' )
			. n_h( 'Who made it possible' )
			. n_p( 'Sasi, Shanker and Bala gave $150 each, $450 in all: the bus ($150), lunch for mums and children ($180), games and activities ($70) and a printed family photo for each mum ($50).' ),
	),
	array(
		'key'     => 'L',
		'title'   => 'In pictures: a day at Hanuman Kovil',
		'cats'    => array( 'real-impact', 'sri-lanka' ),
		'place'   => 'Pussellawa',
		'excerpt' => 'Running, dancing and a quiet look at the mountains: the children of Pussellawa on 12 October.',
		'hours'   => 8,
		'views'   => 85,
		'thumb'   => 'pus_games',
		'body'    => n_p( 'Photos shared with permission by the organisers in Pussellawa.' ) . '%IMG_PUS_ALL%',
	),
	array(
		'key'     => 'I',
		'title'   => 'The Black Bridge over the Pali Aru',
		'cats'    => array( 'culture', 'sri-lanka' ),
		'place'   => 'Oddankulam',
		'excerpt' => 'The old bridge at Oddankulam, said to have been built by the Dutch, gave Yogapuram\'s pre-schoolers an afternoon by the river.',
		'hours'   => 9,
		'views'   => 60,
		'thumb'   => 'maha_grass',
		'body'    => n_p( 'The Black Bridge, Karutha Palam, crosses the Pali Aru at Oddankulam. People there count it among the oldest bridges in the area, and say it was built by the Dutch.' )
			. n_p( 'On 12 October it was the first stop for 17 pre-school children from Yogapuram. They had ice cream on the grass, danced, and then went down into the quiet river to play.' ),
	),
	array(
		'key'     => 'K',
		'title'   => 'Hanuman Kovil, where the hills open up',
		'cats'    => array( 'culture', 'sri-lanka' ),
		'place'   => 'Pussellawa',
		'excerpt' => 'A big lawn and wide views over the mountains, on the road between Gampola and Nuwara Eliya.',
		'hours'   => 10,
		'views'   => 45,
		'thumb'   => 'pus_hills',
		'body'    => n_p( 'In the hills on the road between Gampola and Nuwara Eliya, Hanuman Kovil has a big lawn and wide views over the mountains.' )
			. n_p( 'On 12 October it was where the children of Pussellawa ran, played and danced, in the first Raavanaa day in the hill country.' ),
	),
	array(
		'key'     => 'J',
		'title'   => 'Banalingeswaram: the temple of the Nayanmars',
		'cats'    => array( 'culture', 'sri-lanka' ),
		'place'   => 'Oddankulam',
		'excerpt' => 'Carved sculptures of the Nayanmars and a flower garden at Banalingeswaram Narmatha Natheeswarar temple.',
		'hours'   => 11,
		'views'   => 50,
		'thumb'   => 'maha_hall',
		'body'    => n_p( 'Banalingeswaram Narmatha Natheeswarar temple at Oddankulam is known for its carved sculptures of the Nayanmars, the Saiva saints, and for its flower garden.' )
			. n_p( 'When Yogapuram\'s pre-schoolers visited on 12 October, they walked among the sculptures and through the garden, then danced outside the temple and shared snacks before heading home.' ),
	),
	array(
		'key'     => 'G',
		'title'   => 'The friends behind this autumn\'s days of joy',
		'cats'    => array( 'diaspora' ),
		'place'   => '',
		'excerpt' => 'Friends of Raavanaa, Sasi, Shanker and Bala, and Kiri & Family: who made four days possible, and what each one paid for.',
		'hours'   => 12,
		'views'   => 65,
		'art'     => 'friends-temple', // drawing in place of the group photo (SURESH, 6 Nov 2026)
		'body'    => n_p( 'All over the world there are people who would gladly give a child a day of joy, if only they knew where it was needed and could trust that it would truly reach the child. These are the friends behind this autumn\'s days.' )
			. n_ul( array( '<strong>Pussellawa, a day in the hills:</strong> Friends of Raavanaa, Rs 19,250', '<strong>Yogapuram, the Black Bridge and the temple:</strong> Friends of Raavanaa, Rs 20,000', '<strong>Kilinochchi, mums and kids:</strong> Sasi, Shanker and Bala, $450', '<strong>Karainagar, Casuarina Beach:</strong> Kiri &amp; Family, $600' ) )
			. n_p( 'Every penny goes to the project itself, and every project shows its budget and who made it possible. Want to be part of the next one? Visit <a href="https://raavanaa.org">raavanaa.org</a>.' ),
	),
	array(
		'key'     => 'V1',
		'title'   => 'The happiness on the children\'s faces is the greatest gift we received',
		'art'     => 'voice-happiness',
		'cats'    => array( 'opinion' ),
		'place'   => '',
		'byline'  => 'Sarvika, pre-school manager, Yogapuram',
		'excerpt' => 'The day after the trip to the Black Bridge, the pre-school\'s manager wrote to the Raavanaa team.',
		'hours'   => 13,
		'views'   => 70,
		'body'    => n_q( 'குழந்தைகளின் முகத்தில் இருந்த மகிழ்ச்சியே எமக்குக் கிடைத்த பெரிய பரிசு.', 'In Tamil, as she wrote it' )
			. n_p( '"It was a wonderful day! The happiness on the children\'s faces is the greatest gift we received. Our heartfelt thanks to Raavanaa and to everyone who helped make this day possible."' )
			. n_p( 'Before the trip she had written: "For many of these children a day like this comes rarely. It will be a day to remember, to play, to laugh and to eat together."' ),
	),
	array(
		'key'     => 'V2',
		'title'   => 'The children truly enjoyed the experience and were very happy',
		'art'     => 'voice-hills',
		'cats'    => array( 'opinion' ),
		'place'   => '',
		'byline'  => 'The organisers in Pussellawa',
		'excerpt' => 'The local organisers wrote to the Raavanaa team on the day of the trip to Hanuman Kovil.',
		'hours'   => 14,
		'views'   => 45,
		'body'    => n_p( 'On 12 October, the local organisers in Pussellawa wrote to the Raavanaa team the same day: "The children truly enjoyed the experience and were very happy."' ),
	),
	array(
		'key'     => 'V3',
		'title'   => 'Beyond the Lanes is our promise to step out of our own lanes',
		'art'     => 'beyond-the-lanes',
		'cats'    => array( 'opinion' ),
		'place'   => '',
		'byline'  => 'Raavanaa – Beyond the Lanes',
		'excerpt' => 'Why Raavanaa does what it does.',
		'hours'   => 15,
		'views'   => 40,
		'body'    => n_p( '"Beyond the Lanes" is our promise to step out of our own lanes and into the lives of the children around us.' )
			. n_p( 'A game, a trip, a good meal. Simple days that many children never get. Together we make them happen, and we show you every smile you helped create.' ),
	),
);

/* Budget and progress for need stories, copied from raavanaa.org's projects.json. */
$projects = json_decode( file_get_contents( __DIR__ . '/projects.json' ), true );

/* Which story leads the front page: a story key in front-lead.txt ("rotate front"), or the newest story when it is empty. */
$front = trim( (string) @file_get_contents( __DIR__ . '/front-lead.txt' ) );
delete_option( 'rp_front_lead' );

$sticky = array();
foreach ( $stories as $s ) {
	$body = $s['body'];
	/*
	 * AI pictures from the picture robot (tools/pictures), when a story has them: they replace the story's
	 * real photos, the cover becomes the story's picture, and each caption says it is an AI illustration.
	 */
	$ai = N_IMG . 'ai/' . $s['key'] . '/manifest.json';
	if ( is_readable( $ai ) ) {
		$ai_pics = (array) ( json_decode( file_get_contents( $ai ), true )['pictures'] ?? array() );
		$inside  = '';
		foreach ( $ai_pics as $x ) {
			$cap = trim( $x['caption'] ?? '' ) . ' (AI illustration)';
			$pid = n_photo( 'ai/' . $s['key'] . '/' . $x['file'], $cap );
			if ( 'cover.jpg' === $x['file'] ) {
				$s['thumb_id'] = $pid;
			} else {
				$inside .= n_img( $pid, $cap );
			}
		}
		$body = preg_replace( '/%IMG_[A-Z_]+%/', '', $body );
		$cut  = strpos( $body, '<!-- /wp:paragraph -->' );
		$body = false === $cut ? $body . $inside : substr_replace( $body, "<!-- /wp:paragraph -->\n\n" . $inside, $cut, strlen( '<!-- /wp:paragraph -->' ) );
		unset( $s['thumb'] );
	}
	$body = str_replace( '%IMG_GRASS%', n_img( $ph['maha_grass'], 'Ice cream on the grass by the river' ), $body );
	$body = str_replace( '%IMG_HALL%', n_img( $ph['maha_hall'], 'Inside Banalingeswaram temple' ), $body );
	$body = str_replace( '%IMG_GAMES%', n_img( $ph['pus_games'], 'Games on the lawn' ), $body );
	$body = str_replace(
		'%IMG_PUS_ALL%',
		n_img( $ph['pus_cover'], 'Looking out over the hills at Hanuman Kovil' )
		. n_img( $ph['pus_games'], 'Games on the lawn' )
		. n_img( $ph['pus_run'], 'Running together' )
		. n_img( $ph['pus_dance'], 'Dancing in their best clothes' )
		. n_img( $ph['pus_look'], 'A quiet moment with the view' ),
		$body
	);
	$id = wp_insert_post(
		array(
			'post_type'     => 'post',
			'post_status'   => 'publish',
			'post_title'    => $s['title'],
			'post_excerpt'  => $s['excerpt'],
			'post_content'  => $body,
			'post_category' => array_map( function ( $c ) use ( $cat ) { return $cat[ $c ]; }, $s['cats'] ),
			'post_date'     => wp_date( 'Y-m-d H:i:s', $now - $s['hours'] * HOUR_IN_SECONDS ),
			'comment_status'=> 'closed',
		)
	);
	update_post_meta( $id, 'rp_byline', isset( $s['byline'] ) ? $s['byline'] : $by );
	update_post_meta( $id, 'rp_views', $s['views'] );
	if ( ! empty( $s['art'] ) ) { update_post_meta( $id, 'rp_art', $s['art'] ); }
	if ( ! empty( $s['highlights'] ) ) { update_post_meta( $id, 'rp_highlights', wp_slash( wp_json_encode( $s['highlights'] ) ) ); }
	if ( $s['place'] ) { update_post_meta( $id, 'rp_place', $s['place'] ); }
	if ( ! empty( $s['stage'] ) ) {
		update_post_meta( $id, 'rp_stage', $s['stage'] );
		update_post_meta( $id, 'rp_update', $s['update'] );
	}
	if ( ! empty( $s['project'] ) && isset( $projects[ $s['project'] ] ) ) {
		update_post_meta( $id, 'rp_project', wp_slash( wp_json_encode( $projects[ $s['project'] ] ) ) );
	}
	if ( ! empty( $s['thumb_id'] ) ) {
		set_post_thumbnail( $id, $s['thumb_id'] );
	} elseif ( ! empty( $s['thumb'] ) ) {
		set_post_thumbnail( $id, $ph[ $s['thumb'] ] );
	}
	if ( ! empty( $s['sticky'] ) ) { $sticky[] = $id; }
	if ( $front && $s['key'] === $front ) { update_option( 'rp_front_lead', $id ); }
}
update_option( 'sticky_posts', $sticky );

// 3. Menu: only sections that have stories.
$locations = get_theme_mod( 'nav_menu_locations', array() );
if ( ! empty( $locations['primary'] ) ) {
	wp_delete_nav_menu( $locations['primary'] );
}
$menu = wp_create_nav_menu( 'Sections ' . wp_rand( 100, 999 ) );
wp_update_nav_menu_item( $menu, 0, array( 'menu-item-title' => 'Home', 'menu-item-url' => home_url( '/' ), 'menu-item-type' => 'custom', 'menu-item-status' => 'publish' ) );
foreach ( array_keys( $sections ) as $slug ) {
	wp_update_nav_menu_item( $menu, 0, array( 'menu-item-object-id' => $cat[ $slug ], 'menu-item-object' => 'category', 'menu-item-type' => 'taxonomy', 'menu-item-status' => 'publish' ) );
}
$locations['primary'] = $menu;
set_theme_mod( 'nav_menu_locations', $locations );
$canada = get_term_by( 'slug', 'canada', 'category' );
if ( $canada ) { wp_delete_term( $canada->term_id, 'category' ); }

// 4. Pages with real words.
function n_page( $key, $content, $excerpt = null ) {
	$p = get_posts( array( 'post_type' => 'page', 'meta_key' => 'rp_page', 'meta_value' => $key, 'numberposts' => 1 ) );
	if ( $p ) {
		$a = array( 'ID' => $p[0]->ID, 'post_content' => $content );
		if ( null !== $excerpt ) { $a['post_excerpt'] = $excerpt; }
		wp_update_post( $a );
	}
}
n_page( 'about',
	n_p( 'RaavanaaPost brings you the stories behind <a href="https://raavanaa.org">Raavanaa – Beyond the Lanes</a>: the needs that reach us, the days of joy they become, and the people who make them happen.' )
	. n_p( 'Raavanaa exists for one thing: giving children a day of joy they will remember. A game, a trip, a good meal. Simple days that many children never get.' )
	. n_h( 'Community needs. Real impact.' )
	. n_p( 'Every story here follows a need from the moment it reaches us to the day it becomes real: Initiated, Activated, Impact. We come back with the story, the pictures and what was spent.' ),
	'The stories behind Raavanaa – Beyond the Lanes.'
);
n_page( 'promise',
	n_p( 'We check before we publish. Every need is checked in person before a project is shared.' )
	. n_p( 'We follow up. Every need we report shows its stage: Initiated, Activated or Impact, and we come back with the story after the day.' )
	. n_p( 'We show the money. Every project shows its budget and who made it possible. Every penny goes to the project itself.' )
	. n_p( 'Children come first. We share photos and first names only with permission from a parent, a guardian or the home that cares for the child. We never post a child\'s full name, address or school.' )
	. n_p( 'We fix our mistakes. If something here should not be, tell us and we will correct or remove it.' ),
	'How we report, and what you can expect from us.'
);
n_page( 'report', n_p( 'Know children who deserve a day of joy, or a need in your community? Tell us. The Raavanaa team will call, visit and check before anything is shared.' ) );
n_page( 'needs', n_p( 'Every need that reaches us stays here, with its stage, until the day of joy has happened.' ) );

set_theme_mod( 'rp_footer_about', 'The news of Raavanaa – Beyond the Lanes: community needs, and the real impact your kindness creates.' );
set_theme_mod( 'rp_needs_text', 'Every need moves through three stages: Initiated, Activated and Impact. Here is where each one stands today.' );

WP_CLI::success( 'Loaded ' . count( $stories ) . ' stories.' );
