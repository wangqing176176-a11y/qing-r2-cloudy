"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type FileItem = {
  name: string;
  url?: string;
  type: string;
  size?: number;
  lastModified: string;
  children?: FileItem[];
};

// 辅助函数：替换域名为自定义域名
const getCustomUrl = (url?: string) => {
  if (!url) return "";
  try {
    // 如果是完整 URL，尝试替换 hostname
    const urlObj = new URL(url.startsWith("http") ? url : `https://r2cloud.qinghub.top${url}`);
    return urlObj.toString();
  } catch {
    // 如果是相对路径，直接拼接
    if (url.startsWith("/")) {
      return `https://r2cloud.qinghub.top${url}`;
    }
    return url;
  }
};

const getFileIconSvg = (type: string) => {
  if (type === "folder") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-yellow-400" fill="currentColor">
        <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
      </svg>
    );
  }
  if (type.startsWith("image/")) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-purple-500" fill="currentColor">
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type.startsWith("video/")) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-500" fill="currentColor">
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
      </svg>
    );
  }
  if (type === "application/pdf") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-red-500" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    );
  }
  if (type.includes("sheet") || type.includes("excel")) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-green-600" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    );
  }
  if (type.includes("presentation") || type.includes("powerpoint")) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-orange-500" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    );
  }
  // Word 判断放在 Excel 和 PPT 之后，防止误判
  if (type.includes("word") || type.includes("document")) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-blue-600" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
        <text x="8" y="18" fontSize="6" fill="white" fontWeight="bold">W</text>
      </svg>
    );
  }
  if (type.includes("zip") || type.includes("compressed") || type.includes("tar") || type.includes("rar")) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-gray-500" fill="currentColor">
        <path fillRule="evenodd" d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6Zm1.5 1.5a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5ZM6 9.75A.75.75 0 0 1 6.75 9h1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-1.5Zm.75 3.75a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5Z" clipRule="evenodd" />
      </svg>
    );
  }
  // 默认问号图标
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-gray-400" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.271 1.513 3.374 0 4.646l-2.114 1.84a.75.75 0 0 1-1.004-1.114l2.114-1.84c.89-.777.89-2.096 0-2.803Zm-4.243 9.045a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
    </svg>
  );
};

const getFileMeta = (type: string) => {
  if (type === "folder") {
    return { label: "文件夹", tone: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
  }
  if (type.startsWith("image/")) {
    return { label: "图片", tone: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" };
  }
  if (type.startsWith("video/")) {
    return { label: "视频", tone: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" };
  }
  if (type === "application/pdf") {
    return { label: "PDF", tone: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
  }
  if (type.includes("sheet") || type.includes("excel")) {
    return { label: "Excel", tone: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  }
  if (type.includes("presentation") || type.includes("powerpoint")) {
    return { label: "PPT", tone: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
  }
  if (type.includes("word") || type.includes("document")) {
    return { label: "Word", tone: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
  }
  if (type.includes("zip") || type.includes("compressed") || type.includes("tar") || type.includes("rar")) {
    return { label: "压缩包", tone: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
  }
  return { label: "未知", tone: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
};

const formatSize = (size?: number) => {
  if (size === undefined || size === null) return "-";
  if (size > 1024 * 1024) return (size / 1024 / 1024).toFixed(2) + " MB";
  if (size > 1024) return (size / 1024).toFixed(2) + " KB";
  return size + " B";
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

type FlatNode = {
  item: FileItem;
  parentPath: string[];
  fullPath: string[];
};

const flattenTree = (nodes: FileItem[], parentPath: string[] = []): FlatNode[] => {
  const out: FlatNode[] = [];
  for (const node of nodes) {
    const fullPath = [...parentPath, node.name];
    out.push({ item: node, parentPath, fullPath });
    if (node.type === "folder" && node.children?.length) {
      out.push(...flattenTree(node.children, fullPath));
    }
  }
  return out;
};

const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const Home: React.FC = () => {
  const [rootFiles, setRootFiles] = useState<FileItem[]>([]);
  const [currentFiles, setCurrentFiles] = useState<FileItem[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/files", { cache: "no-store" });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API请求失败: ${res.status} ${text.slice(0, 100)}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("返回数据格式错误，应为数组");
      }
      setRootFiles(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setNotice(`加载失败: ${message}`);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // 新增：提示信息 3 秒后自动消失，提升体验
  useEffect(() => {
    if (notice) {
      // 如果是错误信息，不自动消失，方便调试
      if (notice.includes("失败") || notice.includes("Error")) {
        return;
      }
      const timer = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  useEffect(() => {
    let files = rootFiles;
    for (const folder of path) {
      const found = files.find((f) => f.type === "folder" && f.name === folder);
      if (found && found.children) {
        files = found.children;
      } else {
        files = [];
        break;
      }
    }
    setCurrentFiles(files);
  }, [path, rootFiles]);

  const keyword = search.trim();
  const keywordLower = keyword.toLowerCase();
  const searchResults = useMemo(() => {
    if (!keywordLower) return null;
    const flat = flattenTree(rootFiles);
    return flat.filter((node) => node.item.name.toLowerCase().includes(keywordLower));
  }, [keywordLower, rootFiles]);

  const visibleNodes = useMemo<FlatNode[]>(() => {
    if (searchResults) return searchResults;
    return currentFiles.map((file) => ({
      item: file,
      parentPath: path,
      fullPath: [...path, file.name],
    }));
  }, [currentFiles, path, searchResults]);

  const handleCopy = (url: string) => {
    copyToClipboard(url);
    setCopied(url);
    setNotice("链接已复制成功 ✅");
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePreview = (file: FileItem) => {
    if (file.type === "folder") return;
    if (!file.url) {
      setNotice("当前文件没有可访问的 URL，无法预览。请先配置真实的 R2 链接。");
      return;
    }
    setPreview(file);
  };

  const handleClosePreview = () => setPreview(null);

  const handleEnterFolder = (folder: FileItem) => {
    setPath([...path, folder.name]);
  };

  const handleBreadcrumbClick = (idx: number) => {
    setPath(path.slice(0, idx + 1));
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setNotice(
      "当前项目尚未配置 R2 上传接口。请先配置后端签名/分片上传流程。"
    );
    event.target.value = "";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        
        {/* 顶部工具栏：面包屑 + 搜索 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* 面包屑导航 */}
          <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
            <button 
              onClick={() => setPath([])}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              根目录
            </button>
            {path.map((p, idx) => (
              <div key={idx} className="flex items-center">
                <svg className="h-5 w-5 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    idx === path.length - 1 ? "text-gray-900 dark:text-white font-semibold" : ""
                  }`}
                >
                  {p}
                </button>
              </div>
            ))}
          </nav>

          {/* 搜索框 */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.2-4.2" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
              placeholder="搜索文件..."
            />
          </div>
        </div>

        {/* 文件列表区域 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* 列表表头 */}
          <div className="hidden md:grid grid-cols-[minmax(0,3fr)_1fr_1fr_1.5fr] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div>文件名</div>
            <div>修改时间</div>
            <div>大小</div>
            <div className="text-right">操作</div>
          </div>

          {visibleNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
              <svg className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">暂无文件</p>
              <p className="text-sm mt-1">当前目录下没有文件或文件夹</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {visibleNodes.map((node) => {
                const file = node.item;
                const meta = getFileMeta(file.type);
                const isFolder = file.type === "folder";
                const customUrl = getCustomUrl(file.url);

                return (
                  <div
                    key={`${node.fullPath.join("/")}:${file.type}`}
                    className="group flex items-center justify-between gap-3 px-4 py-3 md:grid md:grid-cols-[minmax(0,3fr)_1fr_1fr_1.5fr] md:gap-4 md:px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                    onClick={() => {
                      if (searchResults && isFolder) {
                        setPath(node.fullPath);
                        setSearch("");
                        return;
                      }
                      if (isFolder) handleEnterFolder(file);
                      else handlePreview(file);
                    }}
                  >
                    {/* 文件名列 */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIconSvg(file.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {file.name}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${meta.tone}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        {/* 移动端显示的额外信息 */}
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 md:hidden">
                          <span>{formatDate(file.lastModified)}</span>
                          <span className="text-gray-300 dark:text-gray-700">|</span>
                          <span>{formatSize(file.size)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 修改时间 */}
                    <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(file.lastModified)}
                    </div>

                    {/* 大小 */}
                    <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400">
                      {formatSize(file.size)}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-end gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {file.type !== "folder" && customUrl && (
                        <>
                          <button
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              copied === customUrl 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-transparent scale-105" 
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 hover:shadow-sm"
                            }`}
                            onClick={() => handleCopy(customUrl)}
                            title="复制直链"
                          >
                            <LinkIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">复制直链</span>
                          </button>
                          <a
                            href={customUrl}
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                            onClick={() => setNotice("正在拉起下载... 🚀")}
                            title="下载"
                          >
                            <DownloadIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">下载</span>
                          </a>
                        </>
                      )}
                      {file.type === "folder" && (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部版权栏 */}
        <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>© {new Date().getFullYear()} WanQing&apos;s R2 Drive.</span>
            
            <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
            
            <div className="flex items-center gap-1">
              <span>Designed by</span>
              <a 
                href="https://qinghub.top" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                WanQing
              </a>
            </div>
            
            <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-gray-700"></div>

            <div className="flex items-center gap-1">
              <span>Assisted by</span>
              <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                Gemini AI
              </span>
            </div>

            <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-gray-700"></div>

            <a
              href="https://github.com/wangqing176176-a11y"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </footer>
      </div>

      {/* 预览模态框 */}
      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClosePreview}
        >
          <div
            className="relative w-full max-w-6xl h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            {/* 模态框头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={preview.name}>
                  {preview.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(preview.lastModified)} · {formatSize(preview.size)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getCustomUrl(preview.url) && (
                  <>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200"
                      onClick={() => handleCopy(getCustomUrl(preview.url)!)}
                    >
                      <LinkIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">复制直链</span>
                    </button>
                    <a
                      href={getCustomUrl(preview.url)}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                      onClick={() => setNotice("正在拉起下载... 🚀")}
                    >
                      <DownloadIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">下载</span>
                    </a>
                  </>
                )}
                <button
                  className="ml-2 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={handleClosePreview}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 预览内容区域 */}
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-black flex items-center justify-center p-4">
              {preview.type.startsWith("image/") && (
                <img
                  src={getCustomUrl(preview.url) || ""}
                  alt={preview.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
              {preview.type.startsWith("video/") && (
                <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-black border border-gray-800">
                  <video
                    src={getCustomUrl(preview.url) || ""}
                    controls
                    className="w-full h-full"
                  />
                </div>
              )}
              {preview.type === "application/pdf" && (
                <iframe
                  src={getCustomUrl(preview.url) || ""}
                  className="w-full h-full bg-white rounded-lg shadow-lg"
                  title="PDF Preview"
                />
              )}
              {(preview.type.includes("word") || preview.type.includes("document") || preview.type.includes("sheet") || preview.type.includes("excel") || preview.type.includes("presentation") || preview.type.includes("powerpoint")) && (
                <iframe
                  src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
                    getCustomUrl(preview.url) || ""
                  )}`}
                  className="w-full h-full bg-white"
                  title="Office Preview"
                />
              )}
              {!preview.type.startsWith("image/") &&
                !preview.type.startsWith("video/") &&
                preview.type !== "application/pdf" &&
                !preview.type.includes("word") &&
                !preview.type.includes("document") &&
                !preview.type.includes("sheet") &&
                !preview.type.includes("excel") &&
                !preview.type.includes("presentation") &&
                !preview.type.includes("powerpoint") && (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <div className="h-24 w-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      {getFileIconSvg(preview.type)}
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">无法预览此文件</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">此文件类型暂不支持在线预览，请下载后查看。</p>
                    <a
                      href={getCustomUrl(preview.url)}
                      download
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                      onClick={() => setNotice("正在拉起下载... 🚀")}
                    >
                      <DownloadIcon className="h-5 w-5" />
                      下载文件
                    </a>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-fade-in-up">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-200">{notice}</span>
            <button
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              onClick={() => setNotice(null)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* 隐藏的文件上传 Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
};

export default Home;
