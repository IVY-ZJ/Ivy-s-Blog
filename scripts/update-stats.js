#!/usr/bin/env node
/**
 * update-stats.js — 自动同步 about.html 的「文章数 / 资源数」统计。
 *
 * 计数口径（与 writing-guide 规范保持一致）：
 *   - 文章数  = assets/js/posts-data.js 中 POSTS 数组的条目数（全站文章单一信源）
 *   - 资源数  = resources.html 中 class="resource reveal" 的卡片数量
 *
 * 用法：
 *   node scripts/update-stats.js
 *
 * 改 about.html 后，这两个数字会被自动回填，无需手改。
 * about.html 中需保留锚点注释：
 *   <!--STAT-POSTS--> 与 <!--STAT-RESOURCES-->
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_DATA = path.join(ROOT, "assets", "js", "posts-data.js");
const RESOURCES = path.join(ROOT, "resources.html");
const ABOUT = path.join(ROOT, "about.html");

function countPosts() {
  const src = fs.readFileSync(POSTS_DATA, "utf8");
  // 统计 POSTS 数组里的 slug: 条目数（每条文章/资料都登记了 slug）
  const matches = src.match(/^\s*slug:\s*"/gm);
  return matches ? matches.length : 0;
}

function countResources() {
  const src = fs.readFileSync(RESOURCES, "utf8");
  const matches = src.match(/class="resource reveal"/g);
  return matches ? matches.length : 0;
}

function updateAbout(posts, resources) {
  let html = fs.readFileSync(ABOUT, "utf8");

  const before = {
    posts: (html.match(/<!--STAT-POSTS-->(\d+)<!--\/STAT-POSTS-->/) || [])[1],
    resources: (html.match(/<!--STAT-RESOURCES-->(\d+)<!--\/STAT-RESOURCES-->/) || [])[1],
  };

  html = html.replace(
    /(<!--STAT-POSTS-->)(\d+)(<!--\/STAT-POSTS-->)/,
    `$1${posts}$3`
  );
  html = html.replace(
    /(<!--STAT-RESOURCES-->)(\d+)(<!--\/STAT-RESOURCES-->)/,
    `$1${resources}$3`
  );

  fs.writeFileSync(ABOUT, html, "utf8");

  console.log(
    `[update-stats] 文章数 ${before.posts ?? "?"} → ${posts}，` +
      `资源数 ${before.resources ?? "?"} → ${resources}`
  );
}

const posts = countPosts();
const resources = countResources();
updateAbout(posts, resources);
console.log(`[update-stats] about.html 统计已更新：文章 ${posts} 篇，资源 ${resources} 份。`);
