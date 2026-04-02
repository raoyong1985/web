<?php
/**
 * 首页 / 相册详情页
 * 
 * 两种模式：
 *   - 无 folder 参数：显示所有相册文件夹的封面列表（首页）
 *   - 有 folder 参数：显示该相册内的所有图片缩略图（详情页）
 */

require_once 'common.php';

header("Content-Type: text/html; charset=utf-8");

// ==========================================
// 相册详情模式：显示某个文件夹内的图片
// ==========================================
if (isset($_GET['folder'])) {
    $folderName = getRequestedFolder();
    $dir = GALLERY_ROOT . $folderName;
    $images = getGalleryImages($dir);
    ?>
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>浮光掠影 - 本地艺术相册</title>
        <link rel="icon" href="data:,">
        <link rel="stylesheet" href="css/gallery.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    </head>
    <body>
        <!-- 顶部导航栏 -->
        <nav class="navbar">
            <div class="logo">ArtGallery</div>
            <div class="back-btn" onclick="window.history.back()" style="margin-left: auto; margin-right: 20px;">
                <i class="fas fa-arrow-left"></i>
            </div>
        </nav>
        
        <!-- 相册标题 -->
        <h1 class="section-title"><?= htmlspecialchars($folderName) ?></h1>
        
        <!-- 图片网格 -->
        <div class="container">
            <div class="gallery-container">
                <style>
                .card .img-error { position:absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#1e1e21; color:#666; font-size:13px; }
                .card a { position:relative; display:block; }
                </style>
                <?php foreach ($images as $img): ?>
                    <div class="card">
                        <!-- 点击缩略图进入灯箱查看大图 -->
                        <a href="lightbox.php?folder=<?= urlencode($folderName) ?>&image=<?= urlencode($img) ?>">
                            <img src="/folders/<?= urlencode($folderName) ?>/<?= urlencode($img) ?>"
                                 alt="<?= htmlspecialchars($img) ?>" loading="lazy"
                                 onerror="this.style.display='none';this.parentNode.querySelector('.img-error').style.display='flex'">
                            <span class="img-error" style="display:none">加载失败</span>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <div class="footer">
            <p>© 2025 ArtGallery | 本地艺术相册展示</p>
        </div>
        
        <script>
            // 按 Escape 键返回上一页
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') window.history.back();
            });
        </script>
    </body>
    </html>
    <?php
    exit;
}

// ==========================================
// 首页模式：显示所有相册文件夹
// ==========================================
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>浮光掠影 - 本地艺术相册</title>
    <link rel="icon" href="data:,">
    <link rel="stylesheet" href="css/gallery.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- 页面加载动画 -->
    <div class="loading-container" id="loading">
        <div class="loading"></div>
    </div>
    
    <!-- 顶部导航栏 -->
    <nav class="navbar">
        <div class="navbar-left">
            <div class="logo">ArtGallery</div>
        </div>
        
        <!-- 搜索框 -->
        <div class="search-box-container">
            <div class="search-box">
                <i class="fas fa-search search-icon"></i>
                <input type="text" placeholder="搜索相册...">
                <i class="fas fa-times clear-search"></i>
            </div>
        </div>
    </nav>
    
    <!-- 主内容区 -->
    <div class="container">
        <h1 class="section-title">浮光掠影 - 本地艺术相册</h1>
        <!-- 相册文件夹网格，由 JS 动态渲染 -->
        <div class="gallery-container" id="folders"></div>
        <!-- 分页容器（已隐藏，使用无限滚动代替） -->
        <div class="pagination" id="pagination"></div>
    </div>
    
    <div class="footer">
        <p>© 2025 ArtGallery | 本地艺术相册展示</p>
    </div>
    
    <script src="js/gallery.js"></script>
</body>
</html>
