# Qing R2 Cloudy (WanQing's R2 Drive)

!License
!Next.js
!Cloudflare

## 📖 简介 (Introduction)

**Qing R2 Cloudy** 是一个基于 **Next.js 15** 和 **Cloudflare R2** 构建的现代化个人轻量级云盘系统。

它利用 Cloudflare 强大的全球边缘网络，提供极速的文件上传与下载体验。项目完全 Serverless 化，无需购买传统服务器，部署简单，成本极低（甚至免费）。

## ✨ 功能特性 (Features)

*   **📂 文件管理**：支持文件夹层级浏览，清晰的面包屑导航。
*   **🚀 极速上传**：
    *   支持**全屏拖拽上传**。
    *   使用 **R2 预签名 URL (Presigned URL)** 技术，绕过 Cloudflare Pages 的 100MB 请求体限制，支持最大 **5GB** 单文件上传。
    *   **实时反馈**：显示精确的上传百分比和网络速度。
    *   **队列管理**：支持多文件队列，自动并发控制，支持暂停、恢复和取消。
*   **👀 在线预览**：
    *   **图片**：支持 JPG, PNG, GIF, WEBP, SVG 等主流格式。
    *   **视频**：支持 MP4, MOV, MKV 等格式，原生播放器体验，自适应 16:9 比例。
    *   **音频**：支持 MP3, WAV, OGG, FLAC 等格式，带封面预览。
    *   **文档**：支持 PDF 在线预览，以及 Word, Excel, PPT (通过微软在线服务预览)。
    *   **代码**：支持常见代码文件（JS, PY, JAVA, HTML 等）的图标识别。
*   **🔍 搜索与排序**：支持按文件名实时搜索；支持按上传时间、文件大小、名称进行升序/降序排列。
*   **🔐 安全机制**：
    *   前端管理员登录验证（防止未授权用户上传文件）。
    *   上传接口签名验证，确保只有通过验证的请求才能写入存储桶。
*   **🎨 现代化 UI**：
    *   基于 **Tailwind CSS 4** 构建，界面简洁美观。
    *   完美支持 **深色模式 (Dark Mode)**，自动跟随系统。
    *   响应式设计，完美适配桌面端和移动端。

## 🌟 项目优势 (Advantages)

1.  **Serverless 架构**：完全部署在 Cloudflare Pages 上，无需维护服务器，运维成本为零。
2.  **超低成本**：Cloudflare R2 存储拥有慷慨的免费额度（10GB 存储，海量 A/B 类操作），且**免流出流量费**。
3.  **高性能**：利用 Cloudflare 全球边缘网络，无论身在何处，访问速度都极快。
4.  **大文件支持**：通过预签名 URL 方案，轻松处理 GB 级别的大文件上传。

## 🛠️ 部署与配置 (Deployment & Configuration)

### 0. 你需要准备什么（小白版）
*   一个 **Cloudflare 账号**（免费即可）。
*   一个 **GitHub 账号**（免费即可）。
*   10 分钟左右的时间。

---

### 1. 创建 R2 存储桶（Bucket）
1. 打开 Cloudflare 控制台 → 左侧找到 **R2**。
2. 点击 **Create bucket**（创建存储桶），随便取一个名字（例如：`my-drive`）。

记下这个桶名，后面要用到：`R2_BUCKET_NAME = 你创建的桶名`

---

### 2. 配置 R2 的 CORS（非常重要，否则上传会失败）
进入你刚创建的 Bucket → **Settings** → **CORS policy**，粘贴下面这一段（新手推荐先用这个，确保能跑起来）：
    ```json
    [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["PUT", "GET", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
    ```

如果你希望更安全：后面部署成功后，把 `AllowedOrigins` 从 `*` 改成你自己的站点域名（例如：`https://xxx.pages.dev` 或你的自定义域名）。

---

### 3. （推荐）给 R2 文件绑定一个公网访问域名（用于预览/复制链接）
项目需要一个“文件访问域名”，用来直接访问图片/视频等文件（否则就无法预览，只能下载）。

在 Bucket → **Settings** → **Public Access** 里：
1. 开启 Public Access（如果有该选项）。
2. 在 **Custom Domains** 绑定一个你自己的域名（例如：`https://files.example.com`）。

记下这个域名，后面要用到：`NEXT_PUBLIC_R2_BASE_URL = 你的文件访问域名`

---

### 4. 获取 R2 的 Access Key（给程序用的“钥匙”）
Cloudflare 控制台 → R2 →（通常在右侧或设置里）找到 **Manage R2 API Tokens / Access Keys** 之类的入口：
1. 创建一个 **Access Key**（建议只授权你这个 bucket）。
2. 你会得到两项：
   - `Access Key ID`
   - `Secret Access Key`

同时你还需要你的 `Account ID`：
- Cloudflare 控制台首页右侧一般能看到 **Account ID**（或在账号设置里）

---

### 5. 一键部署到 Cloudflare Pages（不用改代码）
#### 5.1 Fork 仓库
在 GitHub 打开本项目，点击右上角 **Fork**，把仓库复制到你自己的账号下。

#### 5.2 在 Pages 创建项目
Cloudflare 控制台 → **Pages** → **Create a project** → 选择 **Connect to GitHub** → 选中你 fork 的仓库。

#### 5.3 配置构建参数（Build settings）
* **Framework preset**：`Next.js`
* **Build command**：`npm run pages:build`
* **Build output directory**：`.vercel/output/static`
* **Compatibility flags**：添加 `nodejs_compat`

#### 5.4 配置环境变量（Environment variables）
在 Pages 项目设置里添加下面这些变量（复制粘贴即可）：

| 变量名 | 是否保密 | 示例 | 说明 |
|---|---:|---|---|
| `R2_ACCOUNT_ID` | ✅ | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | ✅ | `xxxxxxxxxxxxxxxx` | R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | ✅ | `xxxxxxxxxxxxxxxxxxxxxxxx` | R2 Secret Access Key |
| `R2_BUCKET_NAME` | ❌ | `my-drive` | 你的 R2 Bucket 名称 |
| `NEXT_PUBLIC_R2_BASE_URL` | ❌ | `https://files.example.com` | 你的 R2 文件访问域名（用于预览/复制链接） |
| `NEXT_PUBLIC_ADMIN_USERNAME` | ❌ | `admin` | 管理员账号（前端校验） |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | ❌ | `change-me` | 管理员密码（前端校验） |

> 重要提醒：`NEXT_PUBLIC_*` 会出现在浏览器端（任何人都能看到）。它只用于“简单的前端挡一下”。如果你希望真正的访问控制，推荐使用 Cloudflare Access/Zero Trust 保护整个站点。

#### 5.5 绑定 R2 存储桶（必须做，否则无法列出文件）
Pages 项目设置 → **Functions** → **R2 Bucket Bindings**：
* **Variable name**：`BUCKET`（必须是这个名字）
* **R2 Bucket**：选择你创建的存储桶（要和 `R2_BUCKET_NAME` 填同一个桶）

#### 5.6 部署
保存设置后触发一次部署，等待 Pages 构建完成，打开你的站点地址即可使用。

---

## ✅ 常见问题（小白排查）
### 1) 能打开页面，但看不到文件列表
检查 Pages 里是否做了：**Functions → R2 Bucket Bindings → Variable name = `BUCKET`** 并且选择了你的 bucket。

### 2) 上传失败 / 显示网络错误
99% 是 R2 CORS 没配置好。回到 Bucket → Settings → CORS policy，先按本文的 `AllowedOrigins: ["*"]` 配好再试。

### 3) 能下载但不能预览、复制链接是空的
需要设置 `NEXT_PUBLIC_R2_BASE_URL`，并确保你的 R2 文件可以通过这个域名直接访问。

### 4) 忘记管理员密码怎么办？
到 Pages 项目设置里修改 `NEXT_PUBLIC_ADMIN_PASSWORD` 重新部署即可。

## 🤝 致谢 (Credits)

*   本项目由 **WanQing** 开发与维护。
*   特别感谢 **Gemini Code Assist** 提供全程代码辅助、架构设计与技术支持。🤖❤️

## 📄 开源协议 (License)

MIT License
