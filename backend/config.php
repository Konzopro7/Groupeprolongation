<?php

declare(strict_types=1);

return [
    'db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_NAME') ?: 'groupeprolongation',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: '',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'contact_email' => getenv('CONTACT_EMAIL') ?: 'contact@groupeprolongation.com',
        'allowed_origin' => getenv('ALLOWED_ORIGIN') ?: '*',
        'timezone' => 'America/Toronto',
        'debug' => getenv('APP_DEBUG') ?: false,
        'uploads_dir' => getenv('UPLOADS_DIR') ?: '',
        'uploads_url_base' => getenv('UPLOADS_URL_BASE') ?: '/api/uploads',
        'max_upload_size' => (int)(getenv('MAX_UPLOAD_SIZE') ?: 25 * 1024 * 1024),
        'max_upload_files' => (int)(getenv('MAX_UPLOAD_FILES') ?: 20),
        'admin_username' => getenv('ADMIN_USERNAME') ?: 'admin',
        'admin_password_hash' => getenv('ADMIN_PASSWORD_HASH') ?: '$2y$10$7aPDRo6owdj6bV6om.Uji.Leg5rkla/0Legpy2irwzTCvOJznGLpK',
        'admin_password' => getenv('ADMIN_PASSWORD') ?: '',
        'session_name' => getenv('SESSION_NAME') ?: 'gp_admin_session',
    ],
];
