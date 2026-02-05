# Qing R2 Cloudy (WanQing's R2 Drive)

一个基于 **Next.js 15** + **Cloudflare Pages Functions** + **R2 Bucket Binding** 的轻量云盘。

- 站点：**任何人都可以访问**，查看桶内文件、预览、下载、复制分享链接
- 上传：点击右上角“上传”后需要管理员账号密码
- 分享链接：默认 **24 小时有效**（通过 token 签发）

## ✨ 功能特性

- 📂 文件管理：文件夹层级浏览、面包屑导航
- 👀 在线预览：图片 / 音视频 / PDF（支持 Range）/ Office（微软在线预览）
- ⬇️ 下载：任何人都可下载
- 🔗 分享：复制一个 **24 小时有效**的下载链接（无需登录）
- 🚀 上传：
  - 小文件：单次上传
  - 大文件：分片上传（约 70MiB/片）
- 🔐 管理员登录：仅用于“上传”功能鉴权（站点浏览/下载不需要登录）

## 🛠️ 部署到 Cloudflare Pages

### 1) Fork 仓库并创建 Pages 项目

Cloudflare Dashboard → Pages → 创建项目 → 连接 GitHub → 选择你的 fork。

### 2) 构建配置

- Framework preset：`Next.js`
- Build command：`npm run pages:build`
- Build output directory：`.vercel/output/static`
- Compatibility flags：添加 `nodejs_compat`（建议生产/预览都加）

### 3) 绑定 R2 存储桶（必须）

Pages → Settings → Functions → R2 Bucket Bindings：

- Variable name：`BUCKET`（必须是这个名字）
- 选择你的 R2 bucket

### 4) 环境变量（上传鉴权 / 建议）

Pages → Settings → Environment variables：

| 变量名 | 类型建议 | 说明 |
|---|---|---|
| `ADMIN_USERNAME` | Text | 管理员账号（用于上传登录） |
| `ADMIN_PASSWORD` | Secret | 管理员密码（用于上传登录） |
| `ADMIN_TOKEN_SECRET` | Secret（可选） | 分享/预览/上传链接 token 的签名密钥；不设置时会回退使用 `ADMIN_PASSWORD` |
| `PUBLIC_R2_BASE_URL` | Text（可选） | R2 公共访问基础 URL（自定义域名或 `r2.dev`），启用后“下载”按钮会直连 R2（更快、浏览器可显示总大小） |

> 说明：本项目通过 **R2 Binding** 直接访问桶，不需要 `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`Account ID`，也不需要给桶配置 CORS。

## 本地开发

```bash
npm install
npm run dev
```

> 本项目核心能力依赖 Pages 的 R2 Binding；本地开发时需要自行模拟/注入环境。

## ✅ 常见问题

### 1) 能打开页面，但看不到文件列表
- 检查是否绑定了 `BUCKET`（Pages → Settings → Functions → R2 Bucket Bindings）

### 2) 分享链接有效期是多久？
- 默认 **24 小时**（由服务端签发 token 决定）

## 📄 License

MIT
