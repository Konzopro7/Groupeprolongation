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
    $segments = explode('/', trim($uriPath, '/'));
    $apiIndex = array_search('api', $segments, true);

    if ($apiIndex !== false) {
        $tail = array_slice($segments, $apiIndex + 1);
        $uriPath = '/' . implode('/', $tail);
    } elseif ($uriPath === '/api') {
        $uriPath = '/';
    }

    return rtrim($uriPath, '/') ?: '/';
}
