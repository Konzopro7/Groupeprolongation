<?php

declare(strict_types=1);

$bootstrapRoots = [
    dirname(__DIR__),
    __DIR__,
    dirname(__DIR__) . '/api',
    __DIR__ . '/api',
];

$configPath = null;
$sourceDir = null;
$checkedRoots = [];

foreach ($bootstrapRoots as $candidateRoot) {
    $root = rtrim(str_replace('\\', '/', $candidateRoot), '/');
    if ($root === '' || in_array($root, $checkedRoots, true)) {
        continue;
    }
    $checkedRoots[] = $root;

    $candidateConfig = $root . '/config.php';
    $candidateSrc = $root . '/src';

    if (is_file($candidateConfig) && is_dir($candidateSrc)) {
        $configPath = $candidateConfig;
        $sourceDir = $candidateSrc;
        break;
    }
}

if ($configPath === null || $sourceDir === null) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Configuration API introuvable.',
        'details' => [
            'checked_roots' => $checkedRoots,
            'expected_files' => ['config.php', 'src/Database.php', 'src/Http.php', 'src/Validator.php'],
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$config = require $configPath;
date_default_timezone_set($config['app']['timezone']);

require $sourceDir . '/Database.php';
require $sourceDir . '/Http.php';
require $sourceDir . '/Validator.php';

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
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$requestOrigin = is_string($requestOrigin) ? trim($requestOrigin) : '';

// If config is '*', echo back the request Origin to allow cookies (credentials).
// Browsers reject `Access-Control-Allow-Origin: *` when `credentials: include` is used.
if ($allowedOrigin === '*' && $requestOrigin !== '') {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    if ($allowedOrigin !== '*') {
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
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
                    $normalizedEntry = trim($entry);
                    if (str_starts_with($normalizedEntry, '/api/uploads/')) {
                        $normalizedEntry = '/api/media/' . basename($normalizedEntry);
                    }
                    $images[] = $normalizedEntry;
                }
            }
        } elseif (filter_var($rawImages, FILTER_VALIDATE_URL) || str_starts_with($rawImages, '/')) {
            $normalizedEntry = $rawImages;
            if (str_starts_with($normalizedEntry, '/api/uploads/')) {
                $normalizedEntry = '/api/media/' . basename($normalizedEntry);
            }
            $images[] = $normalizedEntry;
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
        'interior_color' => ($row['interior_color'] ?? null) !== null ? (string)$row['interior_color'] : null,
        'exterior_color' => ($row['exterior_color'] ?? null) !== null ? (string)$row['exterior_color'] : null,
        'delivery' => ($row['delivery'] ?? null) !== null ? (int)$row['delivery'] : null,
        'export_available' => ($row['export_available'] ?? null) !== null ? (int)$row['export_available'] : null,
        'status' => ($row['status'] ?? null) !== null ? (string)$row['status'] : null,
        'mileage' => ($row['mileage'] ?? null) !== null ? (int)$row['mileage'] : null,
        'year' => ($row['year'] ?? null) !== null ? (int)$row['year'] : null,
        'negotiable' => ($row['negotiable'] ?? null) !== null ? (int)$row['negotiable'] : null,
        'phone' => ($row['phone'] ?? null) !== null ? (string)$row['phone'] : null,
        'city' => ($row['city'] ?? null) !== null ? (string)$row['city'] : null,
        'item_state' => ($row['item_state'] ?? null) !== null ? (string)$row['item_state'] : null,
        'price_currency' => ($row['price_currency'] ?? null) !== null ? (string)$row['price_currency'] : 'XAF',
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

function fetchAdminStats(PDO $pdo): array
{
    $totalsRow = $pdo->query(
        'SELECT
            COUNT(*) AS listings,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(status, ""))) = "disponible" THEN 1 ELSE 0 END) AS available,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(status, ""))) = "reserve" THEN 1 ELSE 0 END) AS reserved,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(status, ""))) = "vendu" THEN 1 ELSE 0 END) AS sold,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS listings_30d
         FROM listings'
    )->fetch();

    $categoriesCount = (int)$pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();
    $contactsCount = (int)$pdo->query('SELECT COUNT(*) FROM contact_messages')->fetchColumn();
    $contactsLast30Days = (int)$pdo->query(
        'SELECT COUNT(*) FROM contact_messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    )->fetchColumn();

    $financialRow = $pdo->query(
        'SELECT
            COALESCE(SUM(price), 0) AS total_value,
            COALESCE(AVG(price), 0) AS avg_price,
            COALESCE(MIN(price), 0) AS min_price,
            COALESCE(MAX(price), 0) AS max_price
         FROM listings'
    )->fetch();

    $currency = $pdo->query(
        'SELECT COALESCE(NULLIF(price_currency, ""), "XAF")
         FROM listings
         ORDER BY id DESC
         LIMIT 1'
    )->fetchColumn();
    if (!is_string($currency) || trim($currency) === '') {
        $currency = 'XAF';
    }

    $categoryRows = $pdo->query(
        'SELECT
            c.id AS category_id,
            c.name AS category_name,
            COUNT(l.id) AS total
         FROM categories c
         LEFT JOIN listings l ON l.category_id = c.id
         GROUP BY c.id, c.name
         HAVING COUNT(l.id) > 0
         ORDER BY total DESC, c.name ASC
         LIMIT 8'
    )->fetchAll();

    $listingsMonthlyRows = $pdo->query(
        'SELECT
            DATE_FORMAT(created_at, "%Y-%m") AS month_key,
            COUNT(*) AS total
         FROM listings
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, "%Y-%m")
         ORDER BY month_key ASC'
    )->fetchAll();

    $contactsMonthlyRows = $pdo->query(
        'SELECT
            DATE_FORMAT(created_at, "%Y-%m") AS month_key,
            COUNT(*) AS total
         FROM contact_messages
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, "%Y-%m")
         ORDER BY month_key ASC'
    )->fetchAll();

    $listingsByMonth = [];
    foreach ($listingsMonthlyRows as $row) {
        $month = (string)($row['month_key'] ?? '');
        if ($month === '') {
            continue;
        }
        $listingsByMonth[$month] = (int)($row['total'] ?? 0);
    }

    $contactsByMonth = [];
    foreach ($contactsMonthlyRows as $row) {
        $month = (string)($row['month_key'] ?? '');
        if ($month === '') {
            continue;
        }
        $contactsByMonth[$month] = (int)($row['total'] ?? 0);
    }

    $months = [];
    $now = new DateTimeImmutable('first day of this month');
    for ($index = 5; $index >= 0; $index--) {
        $monthValue = $now->sub(new DateInterval('P' . $index . 'M'))->format('Y-m');
        $months[] = $monthValue;
    }

    $byMonth = array_map(
        static fn(string $month): array => [
            'month' => $month,
            'listingsCount' => $listingsByMonth[$month] ?? 0,
            'contactsCount' => $contactsByMonth[$month] ?? 0,
            // Legacy keys for compatibility with old frontend payload mapping.
            'listings_count' => $listingsByMonth[$month] ?? 0,
            'contacts_count' => $contactsByMonth[$month] ?? 0,
        ],
        $months
    );

    $byCategory = array_map(
        static fn(array $row): array => [
            'categoryId' => (int)($row['category_id'] ?? 0),
            'categoryName' => (string)($row['category_name'] ?? ''),
            'total' => (int)($row['total'] ?? 0),
            // Legacy keys for compatibility with old frontend payload mapping.
            'category_id' => (int)($row['category_id'] ?? 0),
            'category_name' => (string)($row['category_name'] ?? ''),
        ],
        $categoryRows
    );

    return [
        'totals' => [
            'listings' => (int)($totalsRow['listings'] ?? 0),
            'categories' => $categoriesCount,
            'contacts' => $contactsCount,
            'available' => (int)($totalsRow['available'] ?? 0),
            'reserved' => (int)($totalsRow['reserved'] ?? 0),
            'sold' => (int)($totalsRow['sold'] ?? 0),
            'listingsLast30Days' => (int)($totalsRow['listings_30d'] ?? 0),
            'contactsLast30Days' => $contactsLast30Days,
            // Legacy keys for compatibility with old frontend payload mapping.
            'listings_last_30_days' => (int)($totalsRow['listings_30d'] ?? 0),
            'contacts_last_30_days' => $contactsLast30Days,
        ],
        'financial' => [
            'totalValue' => (float)($financialRow['total_value'] ?? 0),
            'avgPrice' => (float)($financialRow['avg_price'] ?? 0),
            'minPrice' => (float)($financialRow['min_price'] ?? 0),
            'maxPrice' => (float)($financialRow['max_price'] ?? 0),
            'currency' => strtoupper(trim($currency)),
            // Legacy keys for compatibility with old frontend payload mapping.
            'total_value' => (float)($financialRow['total_value'] ?? 0),
            'avg_price' => (float)($financialRow['avg_price'] ?? 0),
            'min_price' => (float)($financialRow['min_price'] ?? 0),
            'max_price' => (float)($financialRow['max_price'] ?? 0),
        ],
        'byCategory' => $byCategory,
        'byMonth' => $byMonth,
        // Legacy keys for compatibility with old frontend payload mapping.
        'by_category' => $byCategory,
        'by_month' => $byMonth,
    ];
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

function isDebugMode(array $config): bool
{
    $raw = $config['app']['debug'] ?? false;
    if (is_bool($raw)) {
        return $raw;
    }
    if (is_int($raw) || is_float($raw)) {
        return (int)$raw === 1;
    }
    if (is_string($raw)) {
        $value = strtolower(trim($raw));
        return in_array($value, ['1', 'true', 'yes', 'on'], true);
    }
    return false;
}

/**
 * Message public sans secrets (pour le front). Aide au diagnostic sur cPanel / hebergeur mutualise.
 */
function mapPdoExceptionToPublicMessage(PDOException $exception): string
{
    $errorInfo = $exception->errorInfo;
    $driverCode = is_array($errorInfo) && isset($errorInfo[1]) ? (int) $errorInfo[1] : 0;
    $msg = strtolower($exception->getMessage());

    return match ($driverCode) {
        1044 => 'Acces refuse a la base: verifiez privileges MySQL de DB_USER sur DB_NAME.',
        1045 => 'Connexion MySQL refusee : verifiez DB_USER et DB_PASS dans api/config.php (cPanel > MySQL).',
        1049 => 'Base inexistante : creez la base et importez backend/sql/schema.sql, puis verifiez DB_NAME.',
        2002, 2003 => 'Serveur MySQL injoignable : verifiez DB_HOST (souvent "localhost" sur cPanel).',
        1142 => 'Permission SQL insuffisante: accordez SELECT/INSERT/UPDATE/DELETE au user MySQL.',
        1146 => 'Table manquante : importez backend/sql/schema.sql dans phpMyAdmin.',
        1054 => 'Colonne manquante: executez backend/sql/v2_2_migration.sql puis rafraichissez.',
        default => (function () use ($msg): string {
            if (str_contains($msg, 'access denied')) {
                return 'Connexion MySQL refusee : identifiants incorrects dans api/config.php.';
            }
            if (str_contains($msg, 'unknown database')) {
                return 'Base de donnees inexistante : verifiez DB_NAME et importez schema.sql.';
            }
            if (str_contains($msg, 'unknown column')) {
                return 'Schema SQL incomplet: executez backend/sql/v2_2_migration.sql.';
            }
            if (str_contains($msg, 'command denied')) {
                return 'Privileges SQL insuffisants pour ce user MySQL.';
            }
            if (str_contains($msg, "doesn't exist") && str_contains($msg, 'table')) {
                return 'Table manquante : importez backend/sql/schema.sql.';
            }
            return 'Erreur base de donnees. Verifiez api/config.php et l import SQL.';
        })(),
    };
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

    if (isset($_FILES['files']) && is_array($_FILES['files'])) {
        $files = array_merge($files, normalizeIncomingUploadField($_FILES['files']));
    }

    if (isset($_FILES['file']) && is_array($_FILES['file'])) {
        $files = array_merge($files, normalizeIncomingUploadField($_FILES['file']));
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
        'image/jfif' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
        'image/bmp' => 'bmp',
        'image/avif' => 'avif',
        'image/heic' => 'heic',
        'image/heif' => 'heif',
        'image/tiff' => 'tif',
        'image/x-icon' => 'ico',
        'image/vnd.microsoft.icon' => 'ico',
        'video/mp4' => 'mp4',
        'video/mpeg' => 'mpeg',
        'video/quicktime' => 'mov',
        'video/webm' => 'webm',
        'video/ogg' => 'ogv',
    ];
}

function iniSizeToBytes(string $value): int
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return 0;
    }

    $unit = strtolower(substr($trimmed, -1));
    $numberPart = $trimmed;
    if (in_array($unit, ['k', 'm', 'g'], true)) {
        $numberPart = substr($trimmed, 0, -1);
    } else {
        $unit = '';
    }

    if (!is_numeric($numberPart)) {
        return 0;
    }

    $bytes = (float)$numberPart;
    switch ($unit) {
        case 'g':
            $bytes *= 1024;
            // no break
        case 'm':
            $bytes *= 1024;
            // no break
        case 'k':
            $bytes *= 1024;
            break;
    }

    return (int)round($bytes);
}

function getUploadErrorMessage(int $errorCode): string
{
    return match ($errorCode) {
        UPLOAD_ERR_INI_SIZE => 'Le fichier depasse la limite upload_max_filesize du serveur.',
        UPLOAD_ERR_FORM_SIZE => 'Le fichier depasse la limite du formulaire.',
        UPLOAD_ERR_PARTIAL => 'Le fichier a ete partiellement recu. Reessaie.',
        UPLOAD_ERR_NO_FILE => 'Aucun fichier n a ete recu.',
        UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant sur le serveur.',
        UPLOAD_ERR_CANT_WRITE => 'Impossible d ecrire le fichier sur le disque serveur.',
        UPLOAD_ERR_EXTENSION => 'Upload bloque par une extension PHP du serveur.',
        default => 'Erreur upload inconnue (code ' . $errorCode . ').',
    };
}

function getResolvedUploadDir(array $config): string
{
    $uploadDir = trim((string)($config['app']['uploads_dir'] ?? ''));
    $uploadDir = str_replace(["\r", "\n", "\t"], '', $uploadDir);
    $uploadDir = preg_replace('/[[:space:]]*\/[[:space:]]*/', '/', $uploadDir) ?? $uploadDir;
    $uploadDir = trim($uploadDir);
    if ($uploadDir === '') {
        return getDefaultUploadDir();
    }

    return $uploadDir;
}

function getDefaultUploadDir(): string
{
    return __DIR__ . '/uploads';
}

function ensureUploadDirExistsAndWritable(string $path): bool
{
    if (!is_dir($path) && !mkdir($path, 0755, true) && !is_dir($path)) {
        return false;
    }

    return is_writable($path);
}

function getUploadDiagnostics(array $config): array
{
    $candidateDirs = [];
    foreach (getCandidateUploadDirs($config) as $candidate) {
        $candidateDirs[] = [
            'path' => $candidate,
            'exists' => is_dir($candidate),
            'writable' => is_writable($candidate),
            'realpath' => realpath($candidate) ?: null,
        ];
    }

    $tmpDir = (string)ini_get('upload_tmp_dir');
    if ($tmpDir === '') {
        $tmpDir = sys_get_temp_dir();
    }

    return [
        'authenticated' => isAdminAuthenticated(),
        'php' => [
            'file_uploads' => (string)ini_get('file_uploads'),
            'upload_max_filesize' => (string)ini_get('upload_max_filesize'),
            'post_max_size' => (string)ini_get('post_max_size'),
            'max_file_uploads' => (string)ini_get('max_file_uploads'),
            'upload_tmp_dir' => $tmpDir,
            'upload_tmp_dir_exists' => is_dir($tmpDir),
            'upload_tmp_dir_writable' => is_writable($tmpDir),
        ],
        'app' => [
            'uploads_url_base' => getUploadsUrlBase($config),
            'max_upload_size' => (int)($config['app']['max_upload_size'] ?? 0),
            'max_upload_files' => (int)($config['app']['max_upload_files'] ?? 0),
        ],
        'candidate_upload_dirs' => $candidateDirs,
    ];
}

function getCandidateUploadDirs(array $config): array
{
    $dirs = [getResolvedUploadDir($config), getDefaultUploadDir()];
    $unique = [];
    foreach ($dirs as $dir) {
        $normalized = rtrim(str_replace(["\r", "\n", "\t"], '', $dir), DIRECTORY_SEPARATOR);
        if ($normalized === '') {
            continue;
        }
        if (!in_array($normalized, $unique, true)) {
            $unique[] = $normalized;
        }
    }

    return $unique;
}

function getUploadsUrlBase(array $config): string
{
    $base = trim((string)($config['app']['uploads_url_base'] ?? ''));
    if ($base === '' || $base === '/api/uploads') {
        return '/api/media';
    }

    return rtrim('/' . ltrim($base, '/'), '/');
}

function resolveUploadedMediaFilePath(array $config, string $fileName): ?string
{
    foreach (getCandidateUploadDirs($config) as $uploadDir) {
        $basePath = realpath($uploadDir);
        if ($basePath === false || !is_dir($basePath)) {
            continue;
        }

        $basePrefix = rtrim($basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        $candidatePath = $basePrefix . $fileName;
        $resolved = realpath($candidatePath);
        if ($resolved === false) {
            continue;
        }

        if (str_starts_with($resolved, $basePrefix) && is_file($resolved)) {
            return $resolved;
        }
    }

    return null;
}

function detectMimeTypeByExtension(string $filePath): string
{
    $extension = strtolower((string)pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeByExt = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'jfif' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'bmp' => 'image/bmp',
        'avif' => 'image/avif',
        'heic' => 'image/heic',
        'heif' => 'image/heif',
        'tif' => 'image/tiff',
        'tiff' => 'image/tiff',
        'ico' => 'image/x-icon',
        'mp4' => 'video/mp4',
        'mpeg' => 'video/mpeg',
        'mpg' => 'video/mpeg',
        'mov' => 'video/quicktime',
        'webm' => 'video/webm',
        'ogv' => 'video/ogg',
        'ogg' => 'video/ogg',
    ];

    return $mimeByExt[$extension] ?? 'application/octet-stream';
}

function detectMimeTypeFromFile(string $filePath): string
{
    $mimeType = '';

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $detected = finfo_file($finfo, $filePath);
            if (is_string($detected) && trim($detected) !== '') {
                $mimeType = trim(explode(';', $detected)[0]);
            }
            finfo_close($finfo);
        }
    }

    if ($mimeType === '' && function_exists('mime_content_type')) {
        $detected = mime_content_type($filePath);
        if (is_string($detected) && trim($detected) !== '') {
            $mimeType = trim(explode(';', $detected)[0]);
        }
    }

    if ($mimeType === '') {
        return detectMimeTypeByExtension($filePath);
    }

    return strtolower($mimeType);
}

function streamUploadedMedia(array $config, string $fileName, bool $headOnly = false): void
{
    if (preg_match('/^[a-zA-Z0-9._-]+$/', $fileName) !== 1) {
        errorResponse('Fichier media invalide.', 404);
        return;
    }

    $filePath = resolveUploadedMediaFilePath($config, $fileName);
    if ($filePath === null) {
        errorResponse('Fichier media introuvable.', 404);
        return;
    }

    $size = filesize($filePath);
    if ($size === false) {
        errorResponse('Impossible de lire le media.', 500);
        return;
    }

    $mimeType = detectMimeTypeFromFile($filePath);

    http_response_code(200);
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . (string)$size);
    header('Cache-Control: public, max-age=31536000, immutable');
    header('X-Content-Type-Options: nosniff');

    if ($headOnly) {
        return;
    }

    $stream = fopen($filePath, 'rb');
    if ($stream === false) {
        errorResponse('Impossible de lire le media.', 500);
        return;
    }

    while (!feof($stream)) {
        $chunk = fread($stream, 8192);
        if ($chunk === false) {
            fclose($stream);
            errorResponse('Erreur de lecture media.', 500);
            return;
        }
        echo $chunk;
    }
    fclose($stream);
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
        'jfif' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'bmp' => 'image/bmp',
        'avif' => 'image/avif',
        'heic' => 'image/heic',
        'heif' => 'image/heif',
        'tif' => 'image/tiff',
        'tiff' => 'image/tiff',
        'ico' => 'image/x-icon',
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

function getWritableUploadDir(array $config): ?string
{
    foreach (getCandidateUploadDirs($config) as $candidateUploadDir) {
        if (ensureUploadDirExistsAndWritable($candidateUploadDir)) {
            return $candidateUploadDir;
        }
    }
    return null;
}

function resolveUploadExtension(string $mimeType, string $originalName, array $allowedMimeMap, array $allowedExtensions): string
{
    $extension = $allowedMimeMap[$mimeType] ?? '';

    if ($extension === '' && $mimeType !== '' && str_starts_with($mimeType, 'image/')) {
        $extFromName = strtolower((string)pathinfo($originalName, PATHINFO_EXTENSION));
        $extFromName = preg_replace('/[^a-z0-9]/', '', $extFromName) ?: '';

        $imageFallbackMap = [
            'jpeg' => 'jpg',
            'jpg' => 'jpg',
            'jfif' => 'jpg',
            'png' => 'png',
            'webp' => 'webp',
            'gif' => 'gif',
            'bmp' => 'bmp',
            'avif' => 'avif',
            'heic' => 'heic',
            'heif' => 'heif',
            'tif' => 'tif',
            'tiff' => 'tif',
            'ico' => 'ico',
        ];

        if ($extFromName !== '' && isset($imageFallbackMap[$extFromName])) {
            $extension = $imageFallbackMap[$extFromName];
        } else {
            $extension = 'jpg';
        }
    }

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

    return $extension;
}

function decodeDataUrlPayload(string $dataUrl): ?array
{
    $trimmed = trim($dataUrl);
    if ($trimmed === '') {
        return null;
    }

    if (preg_match('/^data:([^;]+);base64,(.+)$/s', $trimmed, $matches) !== 1) {
        return null;
    }

    $mimeType = strtolower(trim((string)$matches[1]));
    $payload = preg_replace('/\s+/', '', (string)$matches[2]) ?? '';
    if ($payload === '') {
        return null;
    }

    $binary = base64_decode($payload, true);
    if ($binary === false) {
        return null;
    }

    return [
        'mime' => $mimeType,
        'binary' => $binary,
    ];
}

function handleUploadJsonRoute(array $config): void
{
    $input = getJsonInput();
    $items = $input['files'] ?? null;
    if (!is_array($items) || empty($items)) {
        errorResponse('Aucun fichier JSON recu pour upload.', 422);
        return;
    }

    $maxUploadFiles = (int)($config['app']['max_upload_files'] ?? 20);
    $maxUploadFiles = max(1, min($maxUploadFiles, 20));
    if (count($items) > $maxUploadFiles) {
        errorResponse('Maximum ' . $maxUploadFiles . ' fichiers media par annonce.', 422);
        return;
    }

    $maxUploadSize = (int)($config['app']['max_upload_size'] ?? (25 * 1024 * 1024));
    if ($maxUploadSize <= 0) {
        $maxUploadSize = 25 * 1024 * 1024;
    }

    $uploadDir = getWritableUploadDir($config);
    if ($uploadDir === null) {
        errorResponse('Impossible de creer le dossier upload.', 500);
        return;
    }

    $allowedMimeMap = getAllowedMediaMimeMap();
    $allowedExtensions = array_values(array_unique(array_values($allowedMimeMap)));
    $uploadsUrlBase = getUploadsUrlBase($config);
    $savedPaths = [];
    $savedUrls = [];

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $originalName = (string)($item['name'] ?? 'media');
        $dataUrl = (string)($item['data_url'] ?? '');
        $decoded = decodeDataUrlPayload($dataUrl);
        if ($decoded === null) {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse('Format JSON media invalide (data URL attendue).', 422);
            return;
        }

        $mimeType = (string)$decoded['mime'];
        $binary = (string)$decoded['binary'];
        $fileSize = strlen($binary);
        if ($fileSize <= 0 || $fileSize > $maxUploadSize) {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            $maxUploadSizeMb = (int)round($maxUploadSize / (1024 * 1024));
            errorResponse('Un fichier JSON est trop volumineux (max ' . $maxUploadSizeMb . ' MB).', 422);
            return;
        }

        $extension = resolveUploadExtension($mimeType, $originalName, $allowedMimeMap, $allowedExtensions);
        if ($extension === '') {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse(
                'Format media non supporte. Formats acceptes: JPG, JPEG, JFIF, PNG, WEBP, GIF, AVIF, BMP, HEIC, HEIF, TIFF, ICO, MP4, WEBM, OGG, MOV, MPEG.',
                422
            );
            return;
        }

        $fileName = date('YmdHis') . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
        $destination = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $fileName;
        if (@file_put_contents($destination, $binary, LOCK_EX) === false) {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse('Impossible de sauvegarder un des fichiers media (fallback JSON).', 500);
            return;
        }

        @chmod($destination, 0644);
        $savedPaths[] = $destination;
        $savedUrls[] = $uploadsUrlBase . '/' . $fileName;
    }

    if (empty($savedUrls)) {
        errorResponse('Aucun media valide recu.', 422);
        return;
    }

    jsonResponse([
        'data' => [
            'url' => $savedUrls[0] ?? null,
            'urls' => $savedUrls,
        ],
    ], 201);
}

function handleUploadRoute(array $config): void
{
    $files = collectIncomingUploadFiles();
    if (empty($files)) {
        $contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
        $postMaxBytes = iniSizeToBytes((string)ini_get('post_max_size'));
        if ($postMaxBytes > 0 && $contentLength > $postMaxBytes) {
            $postMaxLabel = (string)ini_get('post_max_size');
            errorResponse('Le total des fichiers depasse la limite post_max_size (' . $postMaxLabel . ').', 422);
            return;
        }

        errorResponse('Aucun fichier media recu (verifie max_file_uploads, post_max_size et upload_max_filesize).', 422);
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

    $uploadDir = getWritableUploadDir($config);
    if ($uploadDir === null) {
        errorResponse('Impossible de creer le dossier upload.', 500);
        return;
    }

    $allowedMimeMap = getAllowedMediaMimeMap();
    $allowedExtensions = array_values(array_unique(array_values($allowedMimeMap)));
    $uploadsUrlBase = getUploadsUrlBase($config);
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
            errorResponse(getUploadErrorMessage($errorCode), 422);
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
        $extension = resolveUploadExtension($mimeType, $originalName, $allowedMimeMap, $allowedExtensions);

        if ($extension === '') {
            foreach ($savedPaths as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            errorResponse(
                'Format media non supporte. Formats acceptes: JPG, JPEG, JFIF, PNG, WEBP, GIF, AVIF, BMP, HEIC, HEIF, TIFF, ICO, MP4, WEBM, OGG, MOV, MPEG.',
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
            $hint = is_writable($uploadDir)
                ? 'Le serveur a refuse move_uploaded_file.'
                : 'Le dossier upload n est pas accessible en ecriture.';
            errorResponse('Impossible de sauvegarder un des fichiers media. ' . $hint, 500);
            return;
        }

        @chmod($destination, 0644);
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
    if ($path === '/index.php') {
        $routeFromQuery = null;
        if (isset($_GET['route']) && is_string($_GET['route'])) {
            $routeFromQuery = (string)$_GET['route'];
        } elseif (isset($_GET['r']) && is_string($_GET['r'])) {
            $routeFromQuery = (string)$_GET['r'];
        } elseif (isset($_GET['__route']) && is_string($_GET['__route'])) {
            $routeFromQuery = (string)$_GET['__route'];
        }

        if ($routeFromQuery !== null) {
            $path = '/' . trim($routeFromQuery, '/');
        }
        $path = rtrim($path, '/') ?: '/';
    }

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

    if (in_array($path, ['/uploads', '/upload-media', '/files', '/media-store'], true) && $method === 'POST') {
        if (!requireAdminAuth()) {
            return;
        }
        handleUploadRoute($config);
        return;
    }

    if (in_array($path, ['/upload-media-json', '/files-json', '/media-store-json'], true) && $method === 'POST') {
        if (!requireAdminAuth()) {
            return;
        }
        handleUploadJsonRoute($config);
        return;
    }

    if ($path === '/health' && $method === 'GET') {
        jsonResponse([
            'data' => [
                'status' => 'ok',
                'api' => 'Groupe Prolongation',
                'time' => date('c'),
            ],
        ]);
        return;
    }

    if ($path === '/health/db' && $method === 'GET') {
        try {
            $pdo = Database::getConnection($config);
            $activeDb = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();
            $categoriesCount = (int)$pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();
            $listingsCount = (int)$pdo->query('SELECT COUNT(*) FROM listings')->fetchColumn();

            jsonResponse([
                'data' => [
                    'db_ok' => true,
                    'active_db' => $activeDb,
                    'categories' => $categoriesCount,
                    'listings' => $listingsCount,
                    'time' => date('c'),
                ],
            ]);
            return;
        } catch (PDOException $exception) {
            $publicMessage = mapPdoExceptionToPublicMessage($exception);
            if (isDebugMode($config)) {
                $errorInfo = $exception->errorInfo;
                errorResponse($publicMessage, 500, [
                    'sql_state' => (string)$exception->getCode(),
                    'driver_code' => is_array($errorInfo) && isset($errorInfo[1]) ? $errorInfo[1] : null,
                    'message' => $exception->getMessage(),
                ]);
                return;
            }
            errorResponse($publicMessage, 500);
            return;
        }
    }

    if ($path === '/uploads/diagnostics' && $method === 'GET') {
        if (!requireAdminAuth()) {
            return;
        }
        jsonResponse(['data' => getUploadDiagnostics($config)]);
        return;
    }

    if (
        preg_match('#^/(?:uploads|media)/([a-zA-Z0-9._-]+)$#', $path, $matches) === 1
        && in_array($method, ['GET', 'HEAD'], true)
    ) {
        streamUploadedMedia($config, (string)$matches[1], $method === 'HEAD');
        return;
    }

    $pdo = Database::getConnection($config);

    if ($path === '/stats' && $method === 'GET') {
        if (!requireAdminAuth()) {
            return;
        }

        jsonResponse([
            'data' => fetchAdminStats($pdo),
        ]);
        return;
    }

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
             (title, description, price, category_id, fuel, transmission, interior_color, exterior_color, delivery, export_available, status, mileage, year, negotiable, phone, city, item_state, price_currency, location, images)
             VALUES
             (:title, :description, :price, :category_id, :fuel, :transmission, :interior_color, :exterior_color, :delivery, :export_available, :status, :mileage, :year, :negotiable, :phone, :city, :item_state, :price_currency, :location, :images)'
        );
        bindValue($stmt, ':title', $cleanData['title']);
        bindValue($stmt, ':description', $cleanData['description']);
        bindValue($stmt, ':price', $cleanData['price']);
        bindValue($stmt, ':category_id', $cleanData['category_id']);
        bindValue($stmt, ':fuel', $cleanData['fuel']);
        bindValue($stmt, ':transmission', $cleanData['transmission']);
        bindValue($stmt, ':interior_color', $cleanData['interior_color']);
        bindValue($stmt, ':exterior_color', $cleanData['exterior_color']);
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
                'interior_color',
                'exterior_color',
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
    $publicMessage = mapPdoExceptionToPublicMessage($exception);
    if (isDebugMode($config)) {
        $errorInfo = $exception->errorInfo;
        errorResponse($publicMessage, 500, [
            'sql_state' => (string) $sqlState,
            'driver_code' => is_array($errorInfo) && isset($errorInfo[1]) ? $errorInfo[1] : null,
            'message' => $exception->getMessage(),
        ]);
        return;
    }
    errorResponse($publicMessage, 500);
} catch (Throwable $exception) {
    if (isDebugMode($config)) {
        errorResponse('Erreur interne du serveur.', 500, [
            'message' => $exception->getMessage(),
        ]);
        return;
    }
    errorResponse('Erreur interne du serveur.', 500);
}
