<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
$PATH = dirname(__FILE__);

// get song
if (isset($_GET['path'])) {
    $data = read_song($_GET['path']);

// get index
} else {
    $ghs_files = getFileList($PATH . '/ghs');
    $ccli_files = getFileList($PATH . '/ccli');

    $data = [
        "ghs" => array_values($ghs_files),
        "ccli" => array_values($ccli_files)
    ];
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);


function getFileList($path) {
    $files = array_diff(scandir($path), array('.', '..'));
    natsort($files);
    return $files;
}

function read_song($path) {
    $file_content = file_get_contents($path);
    
    $file_content = preg_split("/[-]+/", $file_content);
    $meta = get_meta($file_content[0]);
    $text = get_parts($file_content[1]);

    return array_merge($meta, ["lyrics" => $text]);
}

function get_meta($str) {
    preg_match_all('/(titel|melodie|text|ccli|satz|ablauf|text und melodie|c)\s*:(.*)/i', $str, $matches);

    $data = [];

    foreach($matches[1] as $id => $match) {
        $data[strtolower(trim($match))] = trim($matches[2][$id]);
    }

    $data['ablauf'] = array_map('trim', explode(',', $data['ablauf']));

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