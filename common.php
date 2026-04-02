<?php
/**
 * 公共常量配置 & 工具函数
 * 
 * 优化记录：
 * - 配置集中管理（GALLERY_ROOT / CACHE_TTL / ALLOWED_EXTS）
 * - cleanUtf8 替换为 PHP 5.4+ 的 mb_convert_encoding + iconv 降级
 * - 增加目录遍历防护（basename 过滤）
 */

// ==============================================
// 配置集中管理
// ==============================================
if (!defined('GALLERY_ROOT')) {
    $galleryRoot = '/volume2/photo/名模图片合集/';
    if (!is_dir($galleryRoot)) { $galleryRoot = __DIR__ . '/img/'; }
    define('GALLERY_ROOT', rtrim($galleryRoot, '/') . '/');
}

// 缓存时间（秒）
if (!defined('CACHE_TTL')) { define('CACHE_TTL', 3600); }

// 允许的图片扩展名
if (!defined('ALLOWED_EXTS')) { define('ALLOWED_EXTS', ['jpg','jpeg','png','gif','webp','bmp','tiff']); }

if (!defined('CACHE_DIR')) { define('CACHE_DIR', __DIR__ . '/cache/'); }
if (!file_exists(CACHE_DIR)) { @mkdir(CACHE_DIR, 0755, true); }

/**
 * UTF-8 字符串清理（PHP 5.4+ 兼容版本）
 * 替换了原来 50 行的手动 UTF-8 字节解析，用 mb_convert_encoding + iconv 替代
 */
if (!function_exists('cleanUtf8')) {
    function cleanUtf8($str): string {
        if ($str === '') return '';
        // 方式1: mb_convert_encoding（PHP 5.4+）
        if (function_exists('mb_convert_encoding')) {
            $clean = mb_convert_encoding($str, 'UTF-8', 'UTF-8');
            if ($clean !== false && strlen($clean) > 0) return $clean;
        }
        // 方式2: iconv 降级
        if (function_exists('iconv')) {
            $r = @iconv('UTF-8', 'UTF-8//IGNORE', $str);
            if ($r !== false) return $r;
        }
        // 方式3: 最小兼容的字节过滤
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $str) ?: '?';
    }
}

if (!function_exists('getRequestedFolder')) {
    function getRequestedFolder(): string {
        $f = $_GET['folder'] ?? '';
        if (empty($f)) die('相册名称无效');
        // basename 防止 ../../../ 目录遍历
        $base = basename($f);
        if ($base === '' || $base === '.' || $base === '..') die('相册名称无效');
        return $base;
    }
}

if (!function_exists('getGalleryImages')) {
    function getGalleryImages($dir): array {
        if (substr($dir,-1) !== '/') $dir .= '/';
        if (!is_dir($dir)) die('相册目录不存在: '.htmlspecialchars($dir));
        $images = [];
        $files = scandir($dir);
        if ($files === false) die('无法扫描目录: '.htmlspecialchars($dir));
        $allowed = ALLOWED_EXTS; // 使用配置常量
        foreach ($files as $f) {
            if ($f === '.' || $f === '..') continue;
            if (!is_file($dir.$f)) continue;
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            if (in_array($ext, $allowed, true)) $images[] = cleanUtf8($f);
        }
        if (empty($images)) die('该文件夹没有图片');
        natsort($images);
        return array_values($images);
    }
}

if (!function_exists('getCacheFilePath')) {
    function getCacheFilePath($f): string {
        return CACHE_DIR . md5($f) . '.json';
    }
}

if (!function_exists('getFoldersCacheFile')) {
    function getFoldersCacheFile(): string {
        return CACHE_DIR . 'folders.json';
    }
}

/**
 * 发送 JSON 响应（统一格式）
 */
if (!function_exists('jsonResponse')) {
    function jsonResponse($data, int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
