<?php
/**
 * RESTful API 端点
 * 
 * GET api.php?action=folders  - 获取文件夹列表
 * GET api.php?action=images  - 获取某文件夹图片列表
 * 
 * 优化记录：
 * - 统一 JSON 响应格式
 * - 使用 CACHE_TTL 常量
 * - 增加 CORS 支持
 */

require_once 'common.php';

// 允许同源 AJAX 请求
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => '仅支持 GET 请求'], 405);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    if ($action === 'folders') {
        $dir = GALLERY_ROOT;
        if (!is_dir($dir)) {
            throw new Exception('相册根目录不存在: ' . $dir);
        }
        
        $cacheFile = getFoldersCacheFile();
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < CACHE_TTL)) {
            readfile($cacheFile);
            exit;
        }
        
        $folders = [];
        $files = scandir($dir);
        if ($files === false) {
            throw new Exception('无法扫描目录: ' . $dir);
        }
        
        foreach ($files as $entry) {
            $fullPath = $dir . $entry;
            if ($entry !== '.' && $entry !== '..' && is_dir($fullPath)) {
                $folders[] = cleanUtf8($entry);
            }
        }
        
        natsort($folders);
        $allFolders = array_values($folders);
        
        $limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 100)) : 30;
        $page = max(1, (int)($_GET['page'] ?? 1));
        $total = count($allFolders);
        $totalPages = (int)ceil($total / $limit) ?: 1;
        $start = ($page - 1) * $limit;
        $paginatedFolders = array_slice($allFolders, $start, $limit);
        
        $result = json_encode([
            'folders' => $paginatedFolders,
            'all_folders' => $allFolders,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        file_put_contents($cacheFile, $result);
        echo $result;
        exit;
    }
    
    if ($action === 'images') {
        $folder = getRequestedFolder();
        $dir = GALLERY_ROOT . $folder;
        $cacheFile = getCacheFilePath($folder);
        
        if (file_exists($cacheFile)) {
            $cacheTime = filemtime($cacheFile);
            if (time() - $cacheTime < CACHE_TTL) {
                readfile($cacheFile);
                exit;
            }
        }
        
        $images = getGalleryImages($dir);
        $total = count($images);
        $limit = isset($_GET['limit']) ? max(1, min((int)$_GET['limit'], 999)) : 999;
        $page = max(1, (int)($_GET['page'] ?? 1));
        $start = ($page - 1) * $limit;
        $paginatedImages = array_slice($images, $start, $limit);
        
        $result = json_encode([
            'images' => $paginatedImages,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => (int)ceil($total / $limit) ?: 1
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        file_put_contents($cacheFile, $result);
        echo $result;
        exit;
    }
    
    // 新增 action: count - 统计文件夹数量（用于首页预显示）
    if ($action === 'count') {
        $folder = getRequestedFolder();
        $dir = GALLERY_ROOT . $folder;
        $images = getGalleryImages($dir);
        echo json_encode(['count' => count($images)], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    throw new Exception('无效的 API 请求，支持 action: folders / images / count');
    
} catch (Exception $e) {
    jsonResponse(['error' => $e->getMessage()], 500);
}
