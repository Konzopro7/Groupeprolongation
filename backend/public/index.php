<?php

declare(strict_types=1);

$rootDir = dirname(__DIR__);
if (!file_exists($rootDir . '/config.php')) {
    $rootDir = __DIR__;
}

$config = require $rootDir . '/config.php';
date_default_timezone_set($config['app']['timezone']);

require $rootDir . '/src/Database.php';
require $rootDir . '/src/Http.php';
require $rootDir . '/src/Validator.php';

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? '') === '443');
$sessionName = (string)($config['app']['session_name'] ?? 'gp_admin_session');
if (session_status() !== PHP_SESSION_ACTIVE) {
    $savePath = (string)ini_get('session.save_path');
    $normalizedSavePath = trim(explode(';', $savePath)[count(explode(';', $savePath)) - 1] ?? '');
    if ($normalizedSavePath === '' || !is_dir($normalizedSavePath) || !is_writable($normalizedSavePath)) {
        $fallbackPath = sys_get_temp_dir();
        if (is_dir($fallbackPath) && is_writable($fallbackPath)) {
            session_save_path($fallbackPath);
        }
    }

    session_name($sessionName);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

$allowedOrigin = $config['app']['allowed_origin'] ?? '*';
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
if ($allowedOrigin !== '*') {
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function mapListingRow(array $row): array
{
    $images = [];
    if (!empty($row['images'])) {
        $rawImages = (string)$row['images'];
        $decoded = json_decode($rawImages, true);
        if (is_array($decoded)) {
            foreach ($decoded as $entry) {
                if (is_string($entry) && trim($entry) !== '') {
                    $images[] = $entry;
                }
            }
        } elseif (filter_var($rawImages, FILTER_VALIDATE_URL) || str_starts_with($rawImages, '/')) {
            $images[] = $rawImages;
        }
    }

    return [
        'id' => (int)$row['id'],
        'title' => (string)$row['title'],
        'description' => (string)$row['description'],
        'price' => (float)$row['price'],
        'category_id' => (int)$row['category_id'],
        'category_name' => (string)$row['category_name'],
        'fuel' => ($row['fuel'] ?? null) !== null ? (string)$row['fuel'] : null,
        'transmission' => ($row['transmission'] ?? null) !== null ? (string)$row['transmission'] : null,
        'delivery' => ($row['delivery'] ?? null) !== null ? (int)$row['delivery'] : null,
        'export_available' => ($row['export_available'] ?? null) !== null ? (int)$row['export_available'] : null,
        'status' => ($row['status'] ?? null) !== null ? (string)$row['status'] : null,
        'mileage' => ($row['mileage'] ?? null) !== null ? (int)$row['mileage'] : null,
        'year' => ($row['year'] ?? null) !== null ? (int)$row['year'] : null,
        'negotiable' => ($row['negotiable'] ?? null) !== null ? (int)$row['negotiable'] : null,
        'phone' => ($row['phone'] ?? null) !== null ? (string)$row['phone'] : null,
        'city' => ($row['city'] ?? null) !== null ? (string)$row['city'] : null,
        'item_state' => ($row['item_state'] ?? null) !== null ? (string)$row['item_state'] : null,
        'price_currency' => ($row['price_currency'] ?? null) !== null ? (string)$row['price_currency'] : 'CAD',
        'location' => ($row['location'] ?? null) !== null ? (string)$row['location'] : null,
        'images' => $images,
        'created_at' => (string)$row['created_at'],
    ];
}

function fetchListingById(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(
        'SELECT l.*, c.name AS category_name
         FROM listings l
         INNER JOIN categories c ON c.id = l.category_id
         WHERE l.id = :id
         LIMIT 1'
    );
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch();

    return $row ? mapListingRow($row) : null;
}

function bindValue(PDOStatement $stmt, string $param, mixed $value): void
{
    if ($value === null) {
        $stmt->bindValue($param, null, PDO::PARAM_NULL);
        return;
    }

    if (is_int($value)) {
        $stmt->bindValue($param, $value, PDO::PARAM_INT);
        return;
    }

    if (is_float($value)) {
        $stmt->bindValue($param, (string)$value, PDO::PARAM_STR);
        return;
    }

    if (is_bool($value)) {
        $stmt->bindValue($param, $value ? 1 : 0, PDO::PARAM_INT);
        return;
    }

    $stmt->bindValue($param, (string)$value, PDO::PARAM_STR);
}

function verifyAdminPassword(string $password, array $config): bool
{
    $hash = trim((string)($config['app']['admin_password_hash'] ?? ''));
    if ($hash !== '') {
        return password_verify($password, $hash);
    }

    $plain = (string)($config['app']['admin_password'] ?? '');
    if ($plain === '') {
        return false;
    }

    return hash_equals($plain, $password);
}

function isAdminAuthenticated(): bool
{
    return !empty($_SESSION['is_admin']) && !empty($_SESSION['admin_username']);
}

function requireAdminAuth(): bool
{
    if (!isAdminAuthenticated()) {
        errorResponse('Authentification admin requise.', 401);
        return false;
    }
    return true;
}

function handleAuthMeRoute(): void
{
    jsonResponse([
        'data' => [
            'authenticated' => isAdminAuthenticated(),
            'username' => isAdminAuthenticated() ? (string)$_SESSION['admin_username'] : null,
        ],
    ]);
}

function handleAuthLoginRoute(array $config): void
{
    $input = getJsonInput();
    $username = trim((string)($input['username'] ?? ''));
    $password = (string)($input['password'] ?? '');

    if ($username === '' || $password === '') {
        errorResponse('Nom utilisateur et mot de passe requis.', 422);
        return;
    }

    $expectedUsername = trim((string)($config['app']['admin_username'] ?? 'admin'));
    if ($expectedUsername === '') {
        errorResponse('Configuration admin invalide.', 500);
        return;
    }

    if (!verifyAdminPassword($password, $config) || !hash_equals($expectedUsername, $username)) {
        errorResponse('Identifiants invalides.', 401);
        return;
    }

    session_regenerate_id(true);
    $_SESSION['is_admin'] = true;
    $_SESSION['admin_username'] = $expectedUsername;
    $_SESSION['auth_time'] = time();

    jsonResponse([
        'data' => [
            'authenticated' => true,
            'username' => $expectedUsername,
        ],
    ]);
}

function handleAuthLogoutRoute(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'] ?? '/',
            $params['domain'] ?? '',
            (bool)($params['secure'] ?? false),
            (bool)($params['httponly'] ?? true)
        );
    }
    session_destroy();

    jsonResponse([
        'data' => [
            'success' => true,
        ],
    ]);
}

function normalizeIncomingUploadField(array $field): array
{
    $normalized = [];
    $names = $field['name'] ?? null;

    if (is_array($names)) {
        $count = count($names);
        for ($index = 0; $index < $count; $index++) {
            $normalized[] = [
                'name' => (string)($field['name'][$index] ?? ''),
                'tmp_name' => (string)($field['tmp_name'][$index] ?? ''),
                'size' => (int)($field['size'][$index] ?? 0),
                'error' => (int)($field['error'][$index] ?? UPLOAD_ERR_NO_FILE),
            ];
        }
        return $normalized;
    }

    return [[
        'name' => (string)($field['name'] ?? ''),
        'tmp_name' => (string)($field['tmp_name'] ?? ''),
        'size' => (int)($field['size'] ?? 0),
        'error' => (int)($field['error'] ?? UPLOAD_ERR_NO_FILE),
    ]];
}

function collectIncomingUploadFiles(): array
{
    $files = [];

    if (isset($_FILES['media']) && is_array($_FILES['media'])) {
        $files = array_merge($files, normalizeIncomingUploadField($_FILES['media']));
    }

    if (isset($_FILES['image']) && is_array($_FILES['image'])) {
        $files = array_merge($files, normalizeIncomingUploadField($_FILES['image']));
    }

    return array_values(array_filter(
        $files,
        static fn(array $file): bool => (int)($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
    ));
}

function getAllowedMediaMimeMap(): array
{
    return [
        'image/jpeg' => 'jpg',
        'image/pjpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/bmp' => 'bmp',
        'image/avif' => 'avif',
        'video/mp4' => 'mp4',
        'video/mpeg' => 'mpeg',
        'video/quicktime' => 'mov',
        'video/webm' => 'webm',
        'video/ogg' => 'ogv',
    ];
}

function detectUploadedMimeType(string $tmpName, string $originalName): string
{
    $mimeType = '';

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $detected = finfo_file($finfo, $tmpName);
            if (is_string($detected)) {
                $mimeType = $detected;
            }
            finfo_close($finfo);
        }
    }

    if ($mimeType === '' && function_exists('mime_content_type')) {
        $detected = mime_content_type($tmpName);
        if (is_string($detected)) {
            $mimeType = $detected;
        }
    }

    $mimeType = strtolower(trim(explode(';', $mimeType)[0] ?? ''));
    if ($mimeType !== '') {
        return $mimeType;
    }

    $extension = strtolower((string)pathinfo($originalName, PATHINFO_EXTENSION));
    $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: '';

    $fallbackByExt = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'bmp' => 'image/bmp',
        'avif' => 'image/avif',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'ogv' => 'video/ogg',
        'ogg' => 'video/ogg',
        'mov' => 'video/quicktime',
        'mpeg' => 'video/mpeg',
        'mpg' => 'video/mpeg',
    ];

    return $fallbackByExt[$extension] ?? '';
}

function handleUploadRoute(array $config): void
{
    $files = collectIncomingUploadFiles();
    if (empty($files)) {
        errorResponse('Aucun fichier media recu.', 422);
        return;
    }

    $maxUploadFiles = (int)($config['app']['max_upload_files'] ?? 20);
    $maxUploadFiles = max(1, min($maxUploadFiles, 20));
    if (count($files) > $maxUploadFiles) {
        errorResponse('Maximum ' . $maxUploadFiles . ' fichiers media par annonce.', 422);
        return;
    }

    $maxUploadSize = (int)($config['app']['max_upload_size'] ?? (25 * 1024 * 1024));
    if ($maxUploadSize <= 0) {
        $maxUploadSize = 25 * 1024 * 1024;
    }

    $uploadDir = trim((string)($config['app']['uploads_dir'] ?? ''));
    if ($uploadDir === '') {
        $uploadDir = __DIR__ . '/uploads';
    }

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        errorResponse('Impossible de creer le dossier upload.', 500);
        return;
    }

    $allowedMimeMap = getAllowedMediaMimeMap();
    $allowedExtensions = array_values(array_unique(array_values($allowedMimeMap)));
    $uploadsUrlBase = rtrim((string)($config['app']['uploads_url_base'] ?? '/api/uploads'), '/');
    $savedPaths = [];
    $savedUrls = [];

    foreach ($files as $file) {
        $errorCode = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($errorCode !== UPLOAD_ERR_OK) {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse('Erreur lors de l upload des fichiers media.', 400);
            return;
        }

        $fileSize = (int)($file['size'] ?? 0);
        if ($fileSize <= 0 || $fileSize > $maxUploadSize) {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            $maxUploadSizeMb = (int)round($maxUploadSize / (1024 * 1024));
            errorResponse(
                'Un fichier est invalide ou trop volumineux (max ' . $maxUploadSizeMb . ' MB par fichier).',
                422
            );
            return;
        }

        $tmpName = (string)($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse('Upload invalide.', 400);
            return;
        }

        $originalName = (string)($file['name'] ?? 'media');
        $mimeType = detectUploadedMimeType($tmpName, $originalName);
        $extension = $allowedMimeMap[$mimeType] ?? '';

        if ($extension === '') {
            $fallbackExtension = strtolower((string)pathinfo($originalName, PATHINFO_EXTENSION));
            $fallbackExtension = preg_replace('/[^a-z0-9]/', '', $fallbackExtension) ?: '';

            if (
                ($mimeType !== '' && (str_starts_with($mimeType, 'image/') || str_starts_with($mimeType, 'video/')))
                && in_array($fallbackExtension, $allowedExtensions, true)
            ) {
                $extension = $fallbackExtension;
            }
        }

        if ($extension === '') {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse(
                'Format media non supporte. Formats acceptes: JPG, PNG, WEBP, GIF, AVIF, BMP, MP4, WEBM, OGG, MOV, MPEG.',
                422
            );
            return;
        }

        $fileName = date('YmdHis') . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
        $destination = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName;
        if (!move_uploaded_file($tmpName, $destination)) {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse('Impossible de sauvegarder un des fichiers media.', 500);
            return;
        }

        $savedPaths[] = $destination;
        $savedUrls[] = $uploadsUrlBase . '/' . $fileName;
    }

    jsonResponse([
        'data' => [
            'url' => $savedUrls[0] ?? null,
            'urls' => $savedUrls,
        ],
    ], 201);
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = normalizeRequestPath();

    if ($path === '/' && $method === 'GET') {
        jsonResponse([
            'data' => [
                'name' => 'Groupe Prolongation API',
                'status' => 'ok',
            ],
        ]);
        return;
    }

    if ($path === '/auth/me' && $method === 'GET') {
        handleAuthMeRoute();
        return;
    }

    if ($path === '/auth/login' && $method === 'POST') {
        handleAuthLoginRoute($config);
        return;
    }

    if ($path === '/auth/logout' && $method === 'POST') {
        handleAuthLogoutRoute();
        return;
    }

    if ($path === '/uploads' && $method === 'POST') {
        if (!requireAdminAuth()) {
            return;
        }
        handleUploadRoute($config);
        return;
    }

    $pdo = Database::getConnection($config);

    if ($path === '/categories' && $method === 'GET') {
        $stmt = $pdo->query(
            'SELECT id, name, slug, parent_id
             FROM categories
             ORDER BY
                CASE WHEN parent_id IS NULL THEN id ELSE parent_id END ASC,
                parent_id ASC,
                name ASC'
        );
        jsonResponse(['data' => $stmt->fetchAll()]);
        return;
    }

    if ($path === '/listings' && $method === 'GET') {
        $conditions = [];
        $params = [];

        if (!empty($_GET['category_id']) && is_numeric($_GET['category_id'])) {
            $conditions[] = 'l.category_id = :category_id';
            $params[':category_id'] = (int)$_GET['category_id'];
        }

        if (!empty($_GET['q'])) {
            $conditions[] = '(l.title LIKE :q OR l.description LIKE :q OR l.location LIKE :q OR l.city LIKE :q)';
            $params[':q'] = '%' . trim((string)$_GET['q']) . '%';
        }

        if (!empty($_GET['fuel'])) {
            $conditions[] = 'l.fuel = :fuel';
            $params[':fuel'] = trim((string)$_GET['fuel']);
        }

        if (!empty($_GET['transmission'])) {
            $conditions[] = 'l.transmission = :transmission';
            $params[':transmission'] = trim((string)$_GET['transmission']);
        }

        if (!empty($_GET['status'])) {
            $conditions[] = 'l.status = :status';
            $params[':status'] = trim((string)$_GET['status']);
        }

        if (isset($_GET['min_price']) && is_numeric($_GET['min_price'])) {
            $conditions[] = 'l.price >= :min_price';
            $params[':min_price'] = (float)$_GET['min_price'];
        }

        if (isset($_GET['max_price']) && is_numeric($_GET['max_price'])) {
            $conditions[] = 'l.price <= :max_price';
            $params[':max_price'] = (float)$_GET['max_price'];
        }

        $limit = 24;
        if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
            $limit = max(1, min((int)$_GET['limit'], 100));
        }

        $sql = 'SELECT l.*, c.name AS category_name
                FROM listings l
                INNER JOIN categories c ON c.id = l.category_id';
        if (!empty($conditions)) {
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $sql .= ' ORDER BY l.created_at DESC LIMIT :limit';

        $stmt = $pdo->prepare($sql);
        foreach ($params as $name => $value) {
            bindValue($stmt, $name, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $data = array_map(static fn(array $row): array => mapListingRow($row), $rows);
        jsonResponse(['data' => $data]);
        return;
    }

    if ($path === '/listings' && $method === 'POST') {
        if (!requireAdminAuth()) {
            return;
        }
        $input = getJsonInput();
        $validation = validateListingInput($input, false);
        if (!empty($validation['errors'])) {
            errorResponse('Validation echouee.', 422, $validation['errors']);
            return;
        }

        $cleanData = $validation['data'];
        $images = normalizeImages($input['images'] ?? $input['image_url'] ?? $input['imageUrl'] ?? null);
        $imagesJson = !empty($images) ? json_encode($images, JSON_UNESCAPED_SLASHES) : null;

        $stmt = $pdo->prepare(
            'INSERT INTO listings
             (title, description, price, category_id, fuel, transmission, delivery, export_available, status, mileage, year, negotiable, phone, city, item_state, price_currency, location, images)
             VALUES
             (:title, :description, :price, :category_id, :fuel, :transmission, :delivery, :export_available, :status, :mileage, :year, :negotiable, :phone, :city, :item_state, :price_currency, :location, :images)'
        );
        bindValue($stmt, ':title', $cleanData['title']);
        bindValue($stmt, ':description', $cleanData['description']);
        bindValue($stmt, ':price', $cleanData['price']);
        bindValue($stmt, ':category_id', $cleanData['category_id']);
        bindValue($stmt, ':fuel', $cleanData['fuel']);
        bindValue($stmt, ':transmission', $cleanData['transmission']);
        bindValue($stmt, ':delivery', $cleanData['delivery']);
        bindValue($stmt, ':export_available', $cleanData['export_available']);
        bindValue($stmt, ':status', $cleanData['status']);
        bindValue($stmt, ':mileage', $cleanData['mileage']);
        bindValue($stmt, ':year', $cleanData['year']);
        bindValue($stmt, ':negotiable', $cleanData['negotiable']);
        bindValue($stmt, ':phone', $cleanData['phone']);
        bindValue($stmt, ':city', $cleanData['city']);
        bindValue($stmt, ':item_state', $cleanData['item_state']);
        bindValue($stmt, ':price_currency', $cleanData['price_currency']);
        bindValue($stmt, ':location', $cleanData['location']);
        bindValue($stmt, ':images', $imagesJson);
        $stmt->execute();

        $created = fetchListingById($pdo, (int)$pdo->lastInsertId());
        jsonResponse(['data' => $created], 201);
        return;
    }

    if (preg_match('#^/listings/(\d+)$#', $path, $matches) === 1) {
        $listingId = (int)$matches[1];

        if ($method === 'GET') {
            $listing = fetchListingById($pdo, $listingId);
            if ($listing === null) {
                errorResponse('Annonce introuvable.', 404);
                return;
            }
            jsonResponse(['data' => $listing]);
            return;
        }

        if ($method === 'PUT') {
            if (!requireAdminAuth()) {
                return;
            }
            $input = getJsonInput();
            $validation = validateListingInput($input, true);
            if (!empty($validation['errors'])) {
                errorResponse('Validation echouee.', 422, $validation['errors']);
                return;
            }

            $cleanData = $validation['data'];
            $updates = [];
            $params = [':id' => $listingId];

            foreach ([
                'title',
                'description',
                'price',
                'category_id',
                'fuel',
                'transmission',
                'delivery',
                'export_available',
                'status',
                'mileage',
                'year',
                'negotiable',
                'phone',
                'city',
                'item_state',
                'price_currency',
                'location',
            ] as $field) {
                if (array_key_exists($field, $cleanData)) {
                    $updates[] = $field . ' = :' . $field;
                    $params[':' . $field] = $cleanData[$field];
                }
            }

            $imageKeyExists = array_key_exists('images', $input)
                || array_key_exists('image_url', $input)
                || array_key_exists('imageUrl', $input);
            if ($imageKeyExists) {
                $images = normalizeImages($input['images'] ?? $input['image_url'] ?? $input['imageUrl'] ?? null);
                $updates[] = 'images = :images';
                $params[':images'] = !empty($images) ? json_encode($images, JSON_UNESCAPED_SLASHES) : null;
            }

            if (empty($updates)) {
                errorResponse('Aucune donnee a mettre a jour.', 400);
                return;
            }

            $stmt = $pdo->prepare('UPDATE listings SET ' . implode(', ', $updates) . ' WHERE id = :id');
            foreach ($params as $param => $value) {
                bindValue($stmt, $param, $value);
            }
            $stmt->execute();

            $updated = fetchListingById($pdo, $listingId);
            if ($updated === null) {
                errorResponse('Annonce introuvable.', 404);
                return;
            }

            jsonResponse(['data' => $updated]);
            return;
        }

        if ($method === 'DELETE') {
            if (!requireAdminAuth()) {
                return;
            }
            $stmt = $pdo->prepare('DELETE FROM listings WHERE id = :id');
            $stmt->bindValue(':id', $listingId, PDO::PARAM_INT);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                errorResponse('Annonce introuvable.', 404);
                return;
            }

            jsonResponse(['data' => ['success' => true]]);
            return;
        }
    }

    if ($path === '/contact' && $method === 'POST') {
        $input = getJsonInput();
        $validation = validateContactInput($input);
        if (!empty($validation['errors'])) {
            errorResponse('Validation echouee.', 422, $validation['errors']);
            return;
        }

        $contact = $validation['data'];

        $insert = $pdo->prepare(
            'INSERT INTO contact_messages (name, email, message) VALUES (:name, :email, :message)'
        );
        bindValue($insert, ':name', $contact['name']);
        bindValue($insert, ':email', $contact['email']);
        bindValue($insert, ':message', $contact['message']);
        $insert->execute();

        $mailSent = false;
        if (function_exists('mail')) {
            $subject = 'Nouveau message - Groupe Prolongation';
            $body = "Nom: {$contact['name']}\nEmail: {$contact['email']}\n\nMessage:\n{$contact['message']}\n";
            $headers = "From: noreply@groupeprolongation.com\r\n";
            $headers .= "Reply-To: {$contact['email']}\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $mailSent = @mail($config['app']['contact_email'], $subject, $body, $headers);
        }

        jsonResponse([
            'data' => [
                'success' => true,
                'mail_sent' => $mailSent,
            ],
        ], 201);
        return;
    }

    errorResponse('Route introuvable.', 404);
} catch (PDOException $exception) {
    $sqlState = $exception->getCode();
    if ($sqlState === '23000') {
        errorResponse('Contrainte SQL non respectee (categorie invalide ou donnee dupliquee).', 422);
        return;
    }
    errorResponse('Erreur base de donnees.', 500);
} catch (Throwable $exception) {
    errorResponse('Erreur interne du serveur.', 500);
}
