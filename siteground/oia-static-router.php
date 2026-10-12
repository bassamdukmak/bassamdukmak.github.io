<?php
/**
 * Plugin Name: OIA Redesign Router
 * Description: Serves the approved static redesign for informational pages while WordPress keeps forms, accounts, payments, and admin routes.
 */

defined('ABSPATH') || exit;

add_action('template_redirect', static function (): void {
    if (is_admin() || wp_doing_ajax() || wp_is_json_request() || is_feed()) {
        return;
    }

    ob_start(static function (string $html): string {
        return str_replace(
            [
                '<a href="/2025-26-calendar/">Calendar</a>',
                '<a href="/2025-26-program-cost/">Tuition Info</a>',
                '<a href="/2025-admission/">Admission Process</a>',
                '<a href="https://oiacademy.org/2025-26-calendar/">Calendar</a>',
                '<a href="https://oiacademy.org/2025-26-program-cost/">Tuition Info</a>',
                '<a href="https://oiacademy.org/2025-admission/">Admission Process</a>',
                'href="https://oiacademy.org/admission"',
                'href="/admission"',
                'http://oiacademy.org/wp-content/uploads/',
                'for the 2024-2025, please fill out the interest form below.',
                'classes for the 2024-2025 school year.',
                'payment schedule for this year 2024-2025.',
            ],
            [
                '<a href="/2026-2027-calendar/">Calendar</a>',
                '<a href="/2026-2027-program-cost/">Tuition Info</a>',
                '<a href="/2026-2027-admission-process/">Admission Process</a>',
                '<a href="https://oiacademy.org/2026-2027-calendar/">Calendar</a>',
                '<a href="https://oiacademy.org/2026-2027-program-cost/">Tuition Info</a>',
                '<a href="https://oiacademy.org/2026-2027-admission-process/">Admission Process</a>',
                'href="https://oiacademy.org/2026-2027-admission-process/"',
                'href="/2026-2027-admission-process/"',
                'https://oiacademy.org/wp-content/uploads/',
                'for the 2026-2027 school year, please fill out the interest form below.',
                'classes for the 2026-2027 school year.',
                'payment schedule for the 2026-2027 school year.',
            ],
            $html,
        );
    });
}, -200);

add_action('template_redirect', static function (): void {
    if (is_admin() || wp_doing_ajax() || wp_is_json_request() || is_feed() || is_preview()) {
        return;
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method !== 'GET' && $method !== 'HEAD') {
        return;
    }

    $path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $normalized = '/' . trim($path, '/') . '/';
    $redirects = [
        '/admission/' => '/2026-2027-admission-process/',
        '/enrollment/' => '/registration/',
        '/password-reset/' => '/lost-password/',
    ];
    if (isset($redirects[$normalized])) {
        wp_safe_redirect(home_url($redirects[$normalized]), 301);
        exit;
    }
    $base = WP_CONTENT_DIR . '/oia-redesign/release-20260831-2/';

    $asset_prefix = '/wp-content/oia-redesign/';
    if (str_starts_with($path, $asset_prefix)) {
        $relative = ltrim(substr($path, strlen($asset_prefix)), '/');
        $file = realpath($base . $relative);
        $root = realpath($base);
        if ($file && $root && str_starts_with($file, $root . DIRECTORY_SEPARATOR) && is_file($file)) {
            $types = wp_get_mime_types();
            $type = str_ends_with($file, '.mjs') ? 'text/javascript' : (wp_check_filetype($file, $types)['type'] ?: 'application/octet-stream');
            status_header(200);
            header('Content-Type: ' . $type);
            header('Content-Length: ' . filesize($file));
            if ($method === 'GET') {
                readfile($file);
            }
            exit;
        }
        return;
    }

    $path = '/' . trim($path, '/') . '/';
    if ($path === '//') {
        $path = '/';
    }

    $routes = [
        '/',
        '/189-2/',
        '/2025-26-calendar/',
        '/2025-26-program-cost/',
        '/2025-admission/',
        '/2026-2027-admission-process/',
        '/2026-2027-calendar/',
        '/2026-2027-program-cost/',
        '/board/',
        '/calendar/',
        '/edchoice-at-oia/',
        '/edchoice-how-to-apply/',
        '/faq/',
        '/gallery/',
        '/newsletter/',
        '/life-at-oia/',
        '/jumua-volunteer/',
        '/ourteam/',
        '/school-supply-list/',
        '/student-handbook/',
        '/student-life/',
        '/uniform/',
        '/waitlist-policy/',
        '/welcome/',
    ];

    if (!in_array($path, $routes, true)) {
        return;
    }

    $relative = $path === '/' ? 'index.html' : trim($path, '/') . '/index.html';
    $file = $base . $relative;
    if (!is_file($file)) {
        return;
    }

    status_header(200);
    header('Content-Type: text/html; charset=UTF-8');
    header('X-OIA-Redesign: static');
    if ($method === 'GET') {
        readfile($file);
    }
    exit;
}, -100);
