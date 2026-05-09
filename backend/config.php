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
        'allowed_origin' => getenv('ALLOWED_ORIGIN') ?: 'https://groupeprolongation.com',
        'allowed_origins' => getenv('ALLOWED_ORIGINS') ?: 'https://www.groupeprolongation.com,http://localhost:5173,http://127.0.0.1:5173',
        'timezone' => 'America/Toronto',
        'debug' => getenv('APP_DEBUG') ?: false,
        'uploads_dir' => getenv('UPLOADS_DIR') ?: '',
        'uploads_url_base' => getenv('UPLOADS_URL_BASE') ?: '/api/media',
        'max_upload_size' => (int)(getenv('MAX_UPLOAD_SIZE') ?: 25 * 1024 * 1024),
        'max_upload_files' => (int)(getenv('MAX_UPLOAD_FILES') ?: 20),
        'admin_username' => getenv('ADMIN_USERNAME') ?: 'admin',
        'admin_password_hash' => getenv('ADMIN_PASSWORD_HASH') ?: '$2y$10$7aPDRo6owdj6bV6om.Uji.Leg5rkla/0Legpy2irwzTCvOJznGLpK',
        'admin_password' => getenv('ADMIN_PASSWORD') ?: '',
        'session_name' => getenv('SESSION_NAME') ?: 'gp_admin_session',
        'session_ttl_seconds' => (int)(getenv('SESSION_TTL_SECONDS') ?: 7200),
        'login_rate_limit_attempts' => (int)(getenv('LOGIN_RATE_LIMIT_ATTEMPTS') ?: 8),
        'login_rate_limit_window_seconds' => (int)(getenv('LOGIN_RATE_LIMIT_WINDOW_SECONDS') ?: 900),
        'admin_write_rate_limit_attempts' => (int)(getenv('ADMIN_WRITE_RATE_LIMIT_ATTEMPTS') ?: 120),
        'admin_write_rate_limit_window_seconds' => (int)(getenv('ADMIN_WRITE_RATE_LIMIT_WINDOW_SECONDS') ?: 600),
        'contact_rate_limit_attempts' => (int)(getenv('CONTACT_RATE_LIMIT_ATTEMPTS') ?: 20),
        'contact_rate_limit_window_seconds' => (int)(getenv('CONTACT_RATE_LIMIT_WINDOW_SECONDS') ?: 3600),
    ],
];
