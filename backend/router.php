<?php

declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$normalizedPath = $requestPath;
if ($normalizedPath === '/api') {
    $normalizedPath = '/';
} elseif (str_starts_with($normalizedPath, '/api/')) {
    $normalizedPath = substr($normalizedPath, 4);
}

$publicRoot = realpath(__DIR__ . '/public') ?: (__DIR__ . '/public');
$publicFile = realpath($publicRoot . $normalizedPath);

if (
    $normalizedPath !== '/'
    && is_string($publicFile)
    && str_starts_with($publicFile, (string)$publicRoot)
    && is_file($publicFile)
) {
    $extension = strtolower((string)pathinfo($publicFile, PATHINFO_EXTENSION));
    if (in_array($extension, ['php', 'phtml', 'phar'], true)) {
        http_response_code(404);
        exit;
    }

    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'avif' => 'image/avif',
        'bmp' => 'image/bmp',
        'svg' => 'image/svg+xml',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'ogg' => 'video/ogg',
        'ogv' => 'video/ogg',
        'mov' => 'video/quicktime',
        'mpeg' => 'video/mpeg',
        'mpg' => 'video/mpeg',
        'json' => 'application/json',
        'txt' => 'text/plain; charset=utf-8',
    ];

    $contentType = $mimeTypes[$extension] ?? (function_exists('mime_content_type') ? mime_content_type($publicFile) : null);
    if (is_string($contentType) && $contentType !== '') {
        header('Content-Type: ' . $contentType);
    }

    $fileSize = filesize($publicFile);
    if ($fileSize !== false) {
        header('Content-Length: ' . (string)$fileSize);
    }

    readfile($publicFile);
    exit;
}

require __DIR__ . '/public/index.php';
