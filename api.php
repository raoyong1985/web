<?php
require_once 'common.php';
header("Content-Type: application/json");
$action = $_GET['action'] ?? '';
try {
    if ($action === 'folders') {
        $dir = GALLERY_ROOT;
        if (!is_dir($dir)) { throw new Exception('相册根目录不存在: ' . $dir); }
        $cacheFile = getFoldersCacheFile();
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 3600)) { readfile($cacheFile); exit; }
        $folders = [];
        $files = scandir($dir);
        if ($files === false) { throw new Exception('无法扫描目录: ' . $dir); }
        foreach ($files as $entry) {
            $fullPath = $dir . $entry;
            if ($entry !== '.' && $entry !== '..' && is_dir($fullPath)) {
                $folders[] = cleanUtf8($entry);
            }
        }
        natsort($folders);
        $allFolders = array_values($folders);
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $total = count($folders);
        $totalPages = ceil($total / $limit);
        $start = ($page - 1) * $limit;
        $paginatedFolders = array_slice($folders, $start, $limit);
        $result = json_encode(['folders' => array_values($paginatedFolders), 'all_folders' => $allFolders, 'total_pages' => $totalPages]);
        file_put_contents($cacheFile, $result);
        echo $result;
        exit;
    }
    if ($action === 'images') {
        $folder = getRequestedFolder();
        $dir = GALLERY_ROOT . $folder;
        $cacheFile = getCacheFilePath($folder);
        if (file_exists($cacheFile)) { $cacheTime = filemtime($cacheFile); if (time() - $cacheTime < 3600) { readfile($cacheFile); exit; } }
        $images = getGalleryImages($dir);
        $total = count($images);
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 999;
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $start = ($page - 1) * $limit;
        $paginatedImages = array_slice($images, $start, $limit);
        $result = json_encode(['images' => $paginatedImages, 'total_pages' => ceil($total / $limit)]);
        file_put_contents($cacheFile, $result);
        echo $result;
        exit;
    }
    throw new Exception('无效的API请求');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
