<?php 
function get_html($url){
	$c = curl_init($url);
	curl_setopt($c, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($c,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
	$html = curl_exec($c);
	$status = curl_getinfo($c, CURLINFO_HTTP_CODE);
	if (curl_error($c)) die( $status . " " . curl_error($c) );
	curl_close($c);
	return $html;
}
header('Content-type: text/plain; charset=utf-8');
libxml_use_internal_errors(true);

if(isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] == "https://a.cms.omniupdate.com") 
    header('Access-Control-Allow-Origin: '.$_SERVER['HTTP_ORIGIN']);
else
	exit('{"error" : "domain invalid"}');

$url = filter_input(INPUT_GET, "url", FILTER_SANITIZE_URL);
$html = get_html($url);
$tidy_config = array( 'clean' => 1,  'input-xml' => 1,	'output-xml' => 1);
$tidy = tidy_parse_string($html, $tidy_config);
$tidy->cleanRepair();
echo $tidy;
?>