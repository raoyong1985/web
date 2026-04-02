<?php
/**
 * 灯箱页面（图片查看器）
 * 
 * 接收 folder 和 image 参数，展示全屏大图。
 * 支持键盘导航、自动播放、细节放大、拖拽平移等功能。
 */

require_once 'common.php';

$folderName = getRequestedFolder();
$imageName = basename($_GET['image'] ?? '');
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>浮光掠影</title>
    <link rel="stylesheet" href="css/gallery.css">
</head>
<body>
    <div id="lightbox">
        <!-- 背景模糊图层 -->
        <div id="background-img"></div>
        <!-- 图片容器 -->
        <div id="image-container">
            <img id="lightbox-img" src="" alt="查看大图">
        </div>
        <!-- 关闭按钮 -->
        <span class="close-btn" onclick="closeLightbox()">&times;</span>
        <!-- 上一张图片/下一张导航按钮 -->
        <span class="nav-btn prev-btn" onclick="navigate(-1)">❮</span>
        <span class="nav-btn next-btn" onclick="navigate(1)">❯</span>
        <!-- 自动播放进度指示器 -->
        <div id="autoplay-indicator"></div>
    </div>
    
    <!-- 将相册信息传递给 JS -->
    <script>
        const galleryData = {
            folder: <?= json_encode($folderName) ?>,
            image: <?= json_encode($imageName) ?>
        };
    </script>
    <script src="js/lampbox.js"></script>
</body>
</html>
