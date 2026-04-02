<?php
if (!defined('GALLERY_ROOT')) {
    $galleryRoot = '/volume2/photo/名模图片合集/';
    if (!is_dir($galleryRoot)) { $galleryRoot = __DIR__ . '/img/'; }
    define('GALLERY_ROOT', rtrim($galleryRoot, '/') . '/');
}
if (!defined('CACHE_DIR')) { define('CACHE_DIR', __DIR__ . '/cache/'); }
if (!file_exists(CACHE_DIR)) { @mkdir(CACHE_DIR, 0755, true); }
if (!function_exists('cleanUtf8')) {
    function cleanUtf8($str) {
        if (function_exists('iconv')) { $r = @iconv('UTF-8','UTF-8//IGNORE',$str); if($r!==false) return $r; }
        $len=strlen($str); $r=''; $i=0;
        while($i<$len){ $c=ord($str[$i]);
            if($c<0x80){$r.=$str[$i];$i++;}
            elseif(($c&0xE0)===0xC0){if($i+1<$len&&(ord($str[$i+1])&0xC0)===0x80){$r.=$str[$i].$str[$i+1];$i+=2;}else{$r.='?';$i++;}}
            elseif(($c&0xF0)===0xE0){if($i+2<$len&&(ord($str[$i+1])&0xC0)===0x80&&(ord($str[$i+2])&0xC0)===0x80){$r.=$str[$i].$str[$i+1].$str[$i+2];$i+=3;}else{$r.='?';$i++;}}
            elseif(($c&0xF8)===0xF0){if($i+3<$len&&(ord($str[$i+1])&0xC0)===0x80&&(ord($str[$i+2])&0xC0)===0x80&&(ord($str[$i+3])&0xC0)===0x80){$r.=$str[$i].$str[$i+1].$str[$i+2].$str[$i+3];$i+=4;}else{$r.='?';$i++;}}
            else{$r.='?';$i++;}
        }
        return $r;
    }
}
if (!function_exists('getRequestedFolder')) {
    function getRequestedFolder() { $f=$_GET['folder']??''; if(empty($f)) die('相册名称无效'); return basename($f); }
}
if (!function_exists('getGalleryImages')) {
    function getGalleryImages($dir) {
        if(substr($dir,-1)!=='/') $dir.='/';
        if(!is_dir($dir)) die('相册目录不存在: '.$dir);
        $images=[]; $files=scandir($dir);
        if($files===false) die('无法扫描目录: '.$dir);
        foreach($files as $f){if($f==='.'||$f==='..')continue; if(!is_file($dir.$f))continue; $ext=strtolower(pathinfo($f,PATHINFO_EXTENSION)); if(in_array($ext,['jpg','jpeg','png','gif','webp']))$images[]=cleanUtf8($f);}
        if(empty($images)) die('相册为空');
        natsort($images); return array_values($images);
    }
}
if (!function_exists('getCacheFilePath')) { function getCacheFilePath($f){return CACHE_DIR.md5($f).'.json';} }
if (!function_exists('getFoldersCacheFile')) { function getFoldersCacheFile(){return CACHE_DIR.'folders.json';} }
