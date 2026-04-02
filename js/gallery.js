/**
 * 画廊首页脚本
 * 
 * 负责：
 * - 加载和显示相册文件夹列表
 * - 无限滚动加载更多
 * - 搜索过滤相册
 * - 封面图片预加载和容错（多路径尝试）
 */

// ==========================================
// 全局变量
// ==========================================
const ITEMS_PER_PAGE = 30;    // 每页显示的相册数量
let currentPage = 1;          // 当前页码
let totalPages = 1;           // 总页数
let allFolders = [];          // 所有文件夹列表（用于前端搜索过滤）
let isSearching = false;      // 是否处于搜索状态

// ==========================================
// 初始化
// ==========================================
document.addEventListener('DOMContentLoaded', initGallery);

function initGallery() {
    const searchInput = document.querySelector('.search-box input');
    const clearButton = document.querySelector('.clear-search');
    
    // 初始隐藏清除按钮
    clearButton.style.display = 'none';
    
    // 绑定搜索事件（防抖300ms）
    searchInput.addEventListener('input', debounce(performSearch, 300));
    clearButton.addEventListener('click', clearSearch);
    
    // 绑定无限滚动事件
    window.addEventListener('scroll', handleInfiniteScroll);
    
    // 加载第一页
    loadFolders();
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟毫秒数
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), delay);
    };
}

// ==========================================
// 数据加载
// ==========================================

/**
 * 从API加载文件夹列表
 * @param {number} page - 页码
 * @param {boolean} append - 是否追加到现有列表（无限滚动用）
 */
async function loadFolders(page = 1, append = false) {
    try {
        showLoading();
        currentPage = page;
        
        const response = await fetch(`api.php?action=folders&limit=${ITEMS_PER_PAGE}&page=${page}`);
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `HTTP错误! 状态: ${response.status}`);
        }
        
        const data = await response.json();
        totalPages = data.total_pages;
        allFolders = data.all_folders; // 保存完整列表供搜索使用
        
        renderFolders(data.folders, append);
        
        // 隐藏分页控件（使用无限滚动替代）
        document.getElementById('pagination').style.display = 'none';
        
        // 预加载下一页封面图，提升浏览体验
        if (page < totalPages) {
            preloadNextPage(page + 1);
        }
    } catch (error) {
        console.error('加载文件夹失败:', error);
        alert(`加载相册失败: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// ==========================================
// 无限滚动处理（带节流）
// ==========================================
const SCROLL_THROTTLE_MS = 300;
let lastScrollCheck = 0;

function handleInfiniteScroll() {
    if (isSearching || currentPage >= totalPages) return;
    const now = Date.now();
    if (now - lastScrollCheck < SCROLL_THROTTLE_MS) return;
    lastScrollCheck = now;
    
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        loadFolders(currentPage + 1, true);
    }
}

/**
 * 预加载下一页的封面图片
 * @param {number} nextPage - 要预加载的页码
 */
async function preloadNextPage(nextPage) {
    try {
        const response = await fetch(`api.php?action=folders&limit=${ITEMS_PER_PAGE}&page=${nextPage}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const folders = data.folders;
        
        // 为每个文件夹预加载封面图
        folders.forEach(folder => {
            const url = `/folders/${encodeURIComponent(folder)}/cover.jpg`;
            const img = new Image();
            img.src = url;
        });
    } catch (error) {
        console.log('预加载失败:', error);
    }
}

// ==========================================
// 搜索功能
// ==========================================

/**
 * 执行搜索（在所有已加载的文件夹中过滤）
 */
function performSearch() {
    const searchInput = document.querySelector('.search-box input');
    const clearButton = document.querySelector('.clear-search');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // 根据输入内容显示/隐藏清除按钮
    clearButton.style.display = searchTerm ? 'block' : 'none';
    
    if (searchTerm === '') {
        clearSearch();
        return;
    }
    
    isSearching = true;
    
    // 在所有文件夹中模糊匹配搜索词
    const filteredFolders = allFolders.filter(folder => 
        folder.toLowerCase().includes(searchTerm)
    );
    
    renderFolders(filteredFolders);
    
    // 隐藏分页
    document.getElementById('pagination').innerHTML = '';
    
    // 无结果时显示提示
    const container = document.getElementById('folders');
    if (filteredFolders.length === 0) {
        container.innerHTML = `<p class="no-results">没有找到匹配"${searchTerm}"的相册</p>`;
    }
}

/**
 * 清除搜索，恢复完整列表
 */
function clearSearch() {
    const searchInput = document.querySelector('.search-box input');
    const clearButton = document.querySelector('.clear-search');
    
    searchInput.value = '';
    isSearching = false;
    clearButton.style.display = 'none';
    
    // 重新加载第一页
    loadFolders(1);
}

// ==========================================
// 渲染
// ==========================================

/**
 * 渲染文件夹卡片到页面
 * @param {string[]} folders - 文件夹名数组
 * @param {boolean} append - 是否追加到末尾
 */
function renderFolders(folders, append = false) {
    const container = document.getElementById('folders');
    if (!append) {
        container.innerHTML = '';
    }
    
    if (folders.length === 0 && !isSearching) {
        container.innerHTML = '<p class="no-results">没有找到匹配的相册</p>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    folders.forEach(folder => {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder';
        
        // 封面图路径：尝试多个常见文件名，找不到就用下一个
        const imgUrl = `/folders/${encodeURIComponent(folder)}/cover.jpg`;
        const fallbackUrl = `/folders/${encodeURIComponent(folder)}/0001.jpg`;
        const secondFallback = `/folders/${encodeURIComponent(folder)}/00001.jpg`;
        const thirdFallback = `/folders/${encodeURIComponent(folder)}/01.jpg`;
        const lastFallback = `/folders/${encodeURIComponent(folder)}/1.jpg`;
        
        // 构建卡片HTML，封面加载失败时依次尝试备选路径
        folderDiv.innerHTML = `
            <a href="index.php?folder=${encodeURIComponent(folder)}" style="display:block">
                <img src="${imgUrl}" alt="${folder}" 
                     onerror="this.onerror=null; this.src='${fallbackUrl}'; 
                              this.onerror=() => { this.src='${secondFallback}'; this.onerror=() => { this.src='${thirdFallback}'; this.onerror=() => { this.src='${lastFallback}' } } }">
            </a>
            <div class="folder-name">${folder}</div>
        `;
        
        fragment.appendChild(folderDiv);
    });
    
    container.appendChild(fragment);
}

// ==========================================
// UI 辅助
// ==========================================

/** 显示加载动画 */
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

/** 隐藏加载动画 */
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}
