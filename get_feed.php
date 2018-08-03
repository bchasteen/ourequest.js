<?php 
namespace rss;

use \DateTime, \DateTimeZone;

#error_reporting(E_ALL);
#ini_set('display_errors', '1');
header('Content-type: application/json');
libxml_use_internal_errors(true);

if(isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] == "https://a.cms.omniupdate.com") 
    header('Access-Control-Allow-Origin: '.$_SERVER['HTTP_ORIGIN']);
else
	exit('{"error" : "domain invalid"}');

define("DEFAULT_SEARCH", "searchby");
define("DEFAULT_KEY", "category");
define("DEFAULT_RSS", "/rss/events.xml");

function desc($a, $b) 
{
    return ($a['pubDate'] == $b['pubDate']) ? 0 : ($a['pubDate'] > $b['pubDate']) ? -1 : 1;
}
function asc($a, $b) 
{
    return ($a['pubDate'] == $b['pubDate']) ? 0 : ($a['pubDate'] > $b['pubDate']) ? 1 : -1;
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

$key = isset($_GET[DEFAULT_KEY]) ? filter_input(INPUT_GET, DEFAULT_KEY, FILTER_SANITIZE_STRING) : "";
$searchby = isset($_GET[DEFAULT_SEARCH]) ? filter_input(INPUT_GET, DEFAULT_SEARCH, FILTER_SANITIZE_STRING) : "category";
$feed = isset($_GET["feed"]) ? filter_input(INPUT_GET, "feed", FILTER_SANITIZE_STRING) : DEFAULT_RSS;
$sort = isset($_GET["sort"]) && ($_GET["sort"] == "asc" || $_GET["sort"] == "desc") ? $_GET["sort"] : "asc";

$feed = substr($feed, 0, 1) == DIRECTORY_SEPARATOR ? $_SERVER["DOCUMENT_ROOT"].$feed : $feed;

#
# Important for security reasons.  Allowing people to view only xml files will keep them from putting whatever
# value they want in this field.
if(strpos($feed, "xml") === false) exit('{message: "Only XML files supported."}');

$xml = simplexml_load_file($feed);
if(!$xml) exit('{message: "Invalid XML."}');
$xpath = empty($key) ? "/rss/channel/item" : "/rss/channel/item[" . $searchby . "='" . $key . "']";
$posts = [];
foreach($xml->xpath($xpath) as $item)
	extractItems($item, $posts);

$sort = "rss\\".$sort;
usort($posts, $sort); // Sort items descending by pubDate;
echo json_encode($posts);
?>