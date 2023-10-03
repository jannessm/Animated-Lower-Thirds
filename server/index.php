<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
$PATH = dirname(__FILE__);

// get song
if (isset($_GET['book']) && isset($_GET['name'])) {
    $data = read_song($PATH . '/' . $_GET['book'] . '/' . $_GET['name'] . '.txt');

// get index
} else {
    $ghs_files = array_diff(scandir($PATH . '/ghs'), array('.', '..'));
    $ccli_files = array_diff(scandir($PATH . '/ccli'), array('.', '..'));

    $data = [
        "ghs" => array_values($ghs_files),
        "ccli" => array_values($ccli_files)
    ];
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);



function read_song($path) {
    $file_content = file_get_contents($path);
    
    $file_content = preg_split("/[-]+/", $file_content);
    $meta = get_meta($file_content[0]);
    $text = get_parts($file_content[1]);

    return array_merge($meta, ["text" => $text]);
}

function get_meta($str) {
    preg_match_all('/(titel|melodie|text|ccli|satz)\s*:(.*)/i', $str, $matches);

    $data = [];

    foreach($matches[1] as $id => $match) {
        $data[strtolower(trim($match))] = trim($matches[2][$id]);
    }

    return $data;
}

function get_parts($str) {
    $parts = preg_match_all('/#\s+(.+)\n([^#]+)/', $str, $matches);

    $data = [];

    foreach($matches[1] as $id => $title) {
        $data[trim($title)] = trim($matches[2][$id]);
    }

    return $data;
}