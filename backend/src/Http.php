<?php

declare(strict_types=1);

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function errorResponse(string $message, int $status = 400, array $details = []): void
{
    $payload = ['error' => $message];
    if (!empty($details)) {
        $payload['details'] = $details;
    }
    jsonResponse($payload, $status);
}

function getJsonInput(): array
{
    $rawBody = file_get_contents('php://input');
    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    return is_array($decoded) ? $decoded : [];
}

function normalizeRequestPath(): string
{
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $uriPath = '/' . ltrim($uriPath, '/');

    // Supporte /api/* et aussi les installations dans un sous-dossier (ex: /sinc_admin/api/*).
    // Certains mutualises livrent le chemin sous la forme /api/index.php/<route>.
    $segments = array_values(array_filter(
        explode('/', trim($uriPath, '/')),
        static fn(string $segment): bool => $segment !== ''
    ));

    $apiIndex = array_search('api', $segments, true);
    if ($apiIndex !== false) {
        $segments = array_slice($segments, $apiIndex + 1);
    } elseif ($uriPath === '/api') {
        $segments = [];
    }

    if (!empty($segments) && strtolower($segments[0]) === 'index.php') {
        $segments = array_slice($segments, 1);
    }

    $uriPath = '/' . implode('/', $segments);

    return rtrim($uriPath, '/') ?: '/';
}
