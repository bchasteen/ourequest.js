<?php 
namespace rss;

use \DateTime, \DateTimeZone;

#error_reporting(E_ALL);
#ini_set('display_errors', '1');
header('Content-type: application/json');
header('Access-Control-Allow-Origin: *'); // Turn on CORS
libxml_use_internal_errors(true);

define("DEFAULT_SEARCH", "searchby");
define("DEFAULT_KEY", "category");
define("DEFAULT_RSS", "/rss/events.xml");

function asc($a, $b) 
{
    return ($a['pubDate'] == $b['pubDate']) ? 0 : ($a['pubDate'] > $b['pubDate']) ? 1 : -1;
}

function desc($a, $b) 
{
    return ($a['pubDate'] == $b['pubDate']) ? 0 : ($a['pubDate'] > $b['pubDate']) ? -1 : 1;
}

function extractItems($item, &$posts)
{
	$item->registerXPathNamespace("media", "http://search.yahoo.com/mrss/");
	$img = $item->xpath('./media:content');
	$timezone = new DateTimeZone("America/New_York");
	
	$pubDate = (new DateTime($item->pubDate, $timezone))->getTimestamp();
	$endDate = isset($item->endDate) ? (new DateTime($item->endDate, $timezone))->getTimestamp() : NULL;
	
	$posts[] = [
		"title" => strval($item->title),
		"description" => strval($item->description),
		"author" => strval($item->author),
		"link"  => strval($item->link),
		"pubDate" => $pubDate,
		"endDate" => $endDate,
		"category" => $item->category,
		"image" => isset($img[0]) ? [
			"img" => strval($img[0]->attributes()->url),
			"thm" => strval($item->xpath('./media:content/media:thumbnail')[0]->attributes()->url),
			"alt" => strval($item->xpath('./media:content/media:title')[0])
		] : []
	];
}

$key = trim(filter_input(INPUT_GET, DEFAULT_KEY, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH));
$searchby = trim(filter_input(INPUT_GET, DEFAULT_SEARCH, FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH));
$feed = trim(filter_input(INPUT_GET, "feed", FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH));
$sort = trim(filter_input(INPUT_GET, "feed", FILTER_SANITIZE_STRING, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH));

if(!$sort || ($sort && $sort != "asc" && $sort != "desc"))
	$sort = "asc";
if(!$feed)
	$feed = DEFAULT_RSS;
if(!$searchby)
	$searchby = DEFAULT_SEARCH;

define("DEFAULT_SEARCH", "searchby");
define("DEFAULT_KEY", "category");
define("DEFAULT_RSS
#
# Only allow retreival of xml files
if(strpos($feed, "xml") === false) 
	exit('{message: "Only XML files supported."}');

$xml = simplexml_load_file($feed);

if(!$xml) 
	exit('{message: "Invalid XML."}');

$xpath = empty($key) ? "/rss/channel/item" : "/rss/channel/item[" . $searchby . "='" . $key . "']";

$posts = [];
foreach($xml->xpath($xpath) as $item)
	extractItems($item, $posts);

usort($posts, "rss\\".$sort); // Sort items by pubDate;
echo json_encode($posts);
?>
