# NAS 相册 Web 前端

NAS 相册网站的轻量级前端，直接打开 NAS 上的相册目录查看图片。

## 功能特点

- 🎨 响应式设计，适配手机/平板/桌面
- 🔍 实时搜索文件名
- 🖼️ 灯箱浏览，点击图片全屏查看
- 📱 移动端支持上下滑动翻页
- 🌙 深色主题

## 配合使用

本项目是 **NAS 相册 Web 前端**，配合 [NASGallery Android APP](https://github.com/raoyong1985/NASGallery) 使用效果更佳：

| 项目 | 作用 |
|------|------|
| **web**（本项目） | Web 版，适合浏览器直接访问 |
| **NASGallery** | Android 客户端，适合手机/平板原生体验 |

### 典型场景

- **手机/平板**：安装 [NASGallery](https://github.com/raoyong1985/NASGallery)，获得原生 App 体验
- **电脑浏览器**：直接打开 NAS 地址即可
- **外出时**：通过内网穿透后，两端均可远程访问

## 部署

本项目部署在 NAS 上，配合 Apache/Nginx 提供服务：

```
NAS (Apache) → /volume2/web/
               ├── index.php      # 入口
               ├── router.php     # 路由
               ├── api.php        # 图片列表 API
               ├── common.php     # 公共函数
               ├── css/           # 样式
               ├── js/            # 脚本
               └── images/        # 相册图片（符号链接到 /volume2/photo/）
```

## 目录结构

```
web/
├── index.html       # 入口页面
├── router.php      # URL 路由（省略 .html）
├── api.php         # 图片列表 API
├── common.php      # 公共函数
├── css/
│   ├── gallery.css # 主样式
│   └── lightbox.css# 灯箱样式
├── js/
│   ├── gallery.js  # 主逻辑
│   └── lightbox.js# 灯箱逻辑
└── images/         # 相册目录（符号链接到实际图片路径）
```

## 配置

编辑 `api.php` 中的图片路径即可：

```php
$imagePath = '/volume2/photo/';  // NAS 上的图片目录
```
