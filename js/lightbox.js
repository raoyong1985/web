/**
 * 灯箱（图片查看器）脚本
 * 
 * 功能：
 * - 全屏展示图片，支持键盘/滚轮/触摸导航
 * - 自动播放幻灯片（5秒间隔）
 * - 细节模式：双击放大3倍，可拖拽平移查看
 * - 支持触摸手势（移动端适配）
 */

// ==========================================
// 全局变量
// ==========================================
let currentImages = [];               // 当前相册的所有图片文件名
let currentIndex = 0;                 // 当前显示图片的索引
let autoPlayTimer = null;             // 自动播放计时器
const AUTO_PLAY_INTERVAL = 5000;      // 自动播放间隔（5秒）
let isDetailMode = false;             // 是否处于细节放大模式
let isDragging = false;               // 是否正在拖拽图片
let startX, startY;                   // 拖拽起始坐标
let translateX = 0, translateY = 0;   // 图片当前平移距离
let startTranslateX = 0, startTranslateY = 0; // 拖拽开始时的平移值
const scaleFactor = 3;                // 细节模式放大倍数
let isMouseOverImage = false;         // 鼠标是否悬停在图片上

// ==========================================
// 初始化
// ==========================================
document.addEventListener('DOMContentLoaded', initLightbox);
document.addEventListener('keydown', handleKeyDown);

function initLightbox() {
    const lightboxImg = document.getElementById('lightbox-img');
    const imageContainer = document.getElementById('image-container');
    
    // 图片点击 → 下一张
    lightboxImg.addEventListener('click', handleImageClick);
    // 鼠标悬停状态跟踪（悬停时不触发点击导航）
    lightboxImg.addEventListener('mouseover', () => isMouseOverImage = true);
    lightboxImg.addEventListener('mouseout', () => isMouseOverImage = false);
    // 双击切换细节放大模式
    lightboxImg.addEventListener('dblclick', toggleDetailMode);
    
    // 右键菜单 → 退出细节模式
    lightboxImg.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (isDetailMode) exitDetailMode();
    });
    
    // 滚轮导航（上/下滚切换图片）
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    // 鼠标拖拽事件
    imageContainer.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', dragImage);
    document.addEventListener('mouseup', stopDragging);
    
    // 触摸事件（移动端适配）
    imageContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
    
    // 用户交互时重置自动播放计时器
    document.addEventListener('mousemove', resetAutoPlayTimer);
    document.addEventListener('keydown', resetAutoPlayTimer);
    document.addEventListener('click', resetAutoPlayTimer);

    // === 上下滑动翻页（移动端） ===
    let swipeStartY = 0, swipeDeltaY = 0, isSwiping = false;
    const SWIPE_THRESHOLD = 50;
    const lightbox = document.getElementById('lightbox');

    lightbox.addEventListener('touchstart', function(e) {
        if (isDetailMode) return;
        if (e.touches.length !== 1) return;
        swipeStartY = e.touches[0].clientY;
        swipeDeltaY = 0;
        isSwiping = true;
        lightboxImg.style.transition = 'none';
    }, { passive: true });

    lightbox.addEventListener('touchmove', function(e) {
        if (!isSwiping || isDetailMode) return;
        swipeDeltaY = e.touches[0].clientY - swipeStartY;
        // 阻止浏览器下拉刷新
        e.preventDefault();
        const damped = swipeDeltaY * 0.6;
        lightboxImg.style.transform = `translateY(${damped}px)`;
    }, { passive: false });

    lightbox.addEventListener('touchend', function() {
        if (!isSwiping || isDetailMode) return;
        lightboxImg.style.transition = 'transform 0.3s ease';
        if (Math.abs(swipeDeltaY) > SWIPE_THRESHOLD) {
            const goNext = swipeDeltaY < 0;
            lightboxImg.style.transform = `translateY(${goNext ? -100 : 100}vh)`;
            setTimeout(function() {
                lightboxImg.style.transition = 'none';
                lightboxImg.style.transform = '';
                navigate(goNext ? 1 : -1);
                requestAnimationFrame(function() {
                    lightboxImg.style.transition = '';
                });
            }, 300);
        } else {
            lightboxImg.style.transform = '';
        }
        isSwiping = false;
        swipeDeltaY = 0;
    }, { passive: true });

    // 加载图片数据
    loadImages();
}

// ==========================================
// 事件处理
// ==========================================

/**
 * 处理图片点击事件
 * 细节模式或鼠标悬停时不处理（避免误触导航）
 */
function handleImageClick(e) {
    if (isDetailMode || isMouseOverImage) {
        e.stopPropagation();
        return;
    }
    navigate(1); // 点击图片切换到下一张
}

/**
 * 滚轮事件处理
 * 向上滚 = 上一张，向下滚 = 下一张
 */
function handleWheel(e) {
    if (document.getElementById('lightbox').style.display !== 'flex') return;
    if (isDetailMode) return; // 细节模式下不拦截滚轮（用于平移）
    
    e.preventDefault();
    
    if (e.deltaY < 0) {
        navigate(-1); // 向上滚 → 上一张
    } else if (e.deltaY > 0) {
        navigate(1);  // 向下滚 → 下一张
    }
}

// ==========================================
// 细节模式（放大查看）
// ==========================================

/** 切换细节模式 */
function toggleDetailMode(e) {
    isDetailMode ? exitDetailMode() : enterDetailMode(e);
}

/**
 * 进入细节模式
 * 放大3倍，点击位置成为视图中心
 */
function enterDetailMode(e) {
    isDetailMode = true;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    // 放大时加载原图
    const origPath = `/folders/${encodeURIComponent(galleryData.folder)}/${currentImages[currentIndex]}`;
    if (!lightboxImg.src.endsWith(currentImages[currentIndex])) {
        lightboxImg.src = origPath;
    }

    lightbox.classList.add('detail-mode');
    
    // 计算图片中心位置
    const rect = lightboxImg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 获取点击坐标
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // 计算平移偏移量，使点击位置居中
    if (clientX && clientY) {
        const offsetX = clientX - centerX;
        const offsetY = clientY - centerY;
        
        translateX = -offsetX * (scaleFactor - 1);
        translateY = -offsetY * (scaleFactor - 1);
    }
    
    applyTransform();
    
    // 隐藏导航按钮
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.style.display = 'none';
    });
    
    // 停止自动播放
    stopAutoPlayTimer();
}

/**
 * 应用 CSS 变换（缩放 + 平移）
 */
function applyTransform() {
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.style.transform = `scale(${scaleFactor}) translate(${translateX}px, ${translateY}px)`;
    lightboxImg.style.transformOrigin = 'center center';
}

/** 退出细节模式，恢复正常显示 */
function exitDetailMode() {
    isDetailMode = false;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    lightbox.classList.remove('detail-mode');
    lightboxImg.style.transform = '';
    lightboxImg.style.transformOrigin = 'center center';
    
    // 重置平移值
    translateX = 0;
    translateY = 0;
    
    // 恢复导航按钮
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.style.display = 'block';
    });
    
    // 重启自动播放
    startAutoPlayTimer();
}

// ==========================================
// 拖拽平移（细节模式下）
// ==========================================

/** 开始拖拽 */
function startDragging(e) {
    if (!isDetailMode) return;
    
    isDragging = true;
    const imageContainer = document.getElementById('image-container');
    
    startX = e.clientX;
    startY = e.clientY;
    startTranslateX = translateX;
    startTranslateY = translateY;
    
    imageContainer.style.cursor = 'grabbing';
    e.preventDefault();
}

/** 拖拽中 */
function dragImage(e) {
    if (!isDragging || !isDetailMode) return;
    
    // 计算偏移量并更新平移
    translateX = startTranslateX + (e.clientX - startX);
    translateY = startTranslateY + (e.clientY - startY);
    
    applyTransform();
}

/** 停止拖拽 */
function stopDragging() {
    isDragging = false;
    const imageContainer = document.getElementById('image-container');
    
    if (isDetailMode) {
        imageContainer.style.cursor = 'grab';
    }
}

// ==========================================
// 触摸事件（移动端适配）
// ==========================================

/** 触摸开始 */
function handleTouchStart(e) {
    if (!isDetailMode) return;
    
    if (e.touches.length === 1) {
        // 单指拖拽
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTranslateX = translateX;
        startTranslateY = translateY;
        e.preventDefault();
    } else if (e.touches.length === 2) {
        // 双指缩放（预留接口，暂未实现）
        e.preventDefault();
    }
}

/** 触摸移动 */
function handleTouchMove(e) {
    if (!isDetailMode || !isDragging) return;
    
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        translateX = startTranslateX + (touch.clientX - startX);
        translateY = startTranslateY + (touch.clientY - startY);
        applyTransform();
        e.preventDefault();
    } else if (e.touches.length === 2) {
        e.preventDefault();
    }
}

/** 触摸结束 */
function handleTouchEnd(e) {
    isDragging = false;
}

// ==========================================
// 自动播放
// ==========================================

/** 启动自动播放计时器 */
function startAutoPlayTimer() {
    if (document.getElementById('lightbox').style.display !== 'flex' || isDetailMode) {
        return;
    }
    
    stopAutoPlayTimer(); // 确保只有一个计时器运行
    
    autoPlayTimer = setTimeout(() => {
        navigate(1); // 自动切换到下一张
        startAutoPlayTimer(); // 递归持续播放
    }, AUTO_PLAY_INTERVAL);
}

/** 重置自动播放（用户交互时调用） */
function resetAutoPlayTimer() {
    stopAutoPlayTimer();
    startAutoPlayTimer();
}

/** 停止自动播放 */
function stopAutoPlayTimer() {
    if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
    }
}

/**
 * 更新自动播放指示器（底部小圆点）
 * 高亮当前图片对应的圆点
 */
function updateAutoPlayIndicator() {
    const indicator = document.getElementById('autoplay-indicator');
    if (!indicator) return;
    
    indicator.innerHTML = '';
    
    if (autoPlayTimer && !isDetailMode) {
        for (let i = 0; i < currentImages.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'autoplay-dot';
            if (i === currentIndex) {
                dot.classList.add('active');
            }
            indicator.appendChild(dot);
        }
    }
}

// ==========================================
// 图片加载与导航
// ==========================================

/**
 * 从API加载当前相册的图片列表
 */
async function loadImages() {
    try {
        const response = await fetch(`api.php?action=images&folder=${encodeURIComponent(galleryData.folder)}`);
        
        if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
        
        const data = await response.json();
        if (!data?.images?.length) {
            alert('该文件夹下没有图片！');
            return;
        }

        currentImages = data.images;
        
        // 根据URL参数定位初始图片
        currentIndex = currentImages.indexOf(galleryData.image) || 0;
        if (currentIndex === -1) currentIndex = 0;
        
        // 显示灯箱，禁止背景滚动
        document.getElementById('lightbox').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        updateLightboxImage();
        startAutoPlayTimer();
        updateAutoPlayIndicator();
        preloadAdjacentImages();
    } catch (error) {
        console.error('加载图片失败:', error);
        alert('加载图片失败，请稍后重试');
    }
}

/**
 * 更新灯箱中显示的图片
 * 使用 Image 对象预加载，加载完成后再更新DOM
 */
function updateLightboxImage() {
    const imagePath = `/folders/${encodeURIComponent(galleryData.folder)}/${currentImages[currentIndex]}`;
    const lightboxImg = document.getElementById('lightbox-img');
    const backgroundImg = document.getElementById('background-img');

    const img = new Image();
    img.onload = function() {
        lightboxImg.src = imagePath;
        backgroundImg.style.backgroundImage = `url('${imagePath}')`;
        
        if (isDetailMode) {
            exitDetailMode();
        }
        
        updateAutoPlayIndicator();
    };
    img.src = imagePath;
}

/** 预加载相邻图片 */
function preloadAdjacentImages() {
    const count = currentImages.length;
    const folder = encodeURIComponent(galleryData.folder);
    [1, -1, 2, -2, 3, -3].forEach(function(d) {
        const idx = (currentIndex + d + count) % count;
        const img = new Image();
        img.src = `/folders/${folder}/${currentImages[idx]}`;
    });
}

/**
 * 图片导航（上一张/下一张）
 * @param {number} direction - 方向：-1 = 上一张，1 = 下一张
 */
function navigate(direction) {
    currentIndex = (currentIndex + direction + currentImages.length) % currentImages.length;
    updateLightboxImage();
    resetAutoPlayTimer();
    updateAutoPlayIndicator();
}

/** 关闭灯箱，返回上一页 */
function closeLightbox() {
    stopAutoPlayTimer();
    window.history.back();
}

// ==========================================
// 键盘快捷键
// ==========================================

function handleKeyDown(e) {
    if (document.getElementById('lightbox').style.display !== 'flex') return;
    if (isDetailMode) return; // 细节模式下不处理键盘导航
    
    switch(e.key) {
        case 'ArrowLeft': 
            navigate(-1); // ← 上一张
            resetAutoPlayTimer();
            break;
        case 'ArrowRight': 
            navigate(1);  // → 下一张
            resetAutoPlayTimer();
            break;
        case 'Escape': 
            closeLightbox(); // Esc 关闭
            break;
    }
}
