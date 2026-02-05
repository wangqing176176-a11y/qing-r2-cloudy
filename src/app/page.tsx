"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

type FileItem = {
  name: string;
  key?: string;
  url?: string; // resolved via /api/download -> /api/object (tokenized)
  type: string;
  size?: number;
  lastModified: string;
  children?: FileItem[];
};

const triggerBrowserDownload = (url: string, filename?: string) => {
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.target = "_self";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const buildDownloadRequestUrl = (key: string, filename?: string, download?: boolean, direct?: boolean) => {
  const params = new URLSearchParams();
  params.set("key", key);
  if (download) params.set("download", "1");
  if (filename) params.set("filename", filename);
  if (direct) params.set("direct", "1");
  return `/api/download?${params.toString()}`;
};

const getFileIconSvg = (name: string, type: string) => {
  const lowerName = name.toLowerCase();

  if (type === "folder") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-yellow-400" fill="currentColor">
        <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
      </svg>
    );
  }
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-purple-500" fill="currentColor">
        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
      </svg>
    );
  }
  if (type.startsWith("video/") || /\.(mp4|webm|ogg|mov|mkv|avi|m4v)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-500" fill="currentColor">
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
      </svg>
    );
  }
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-cyan-500" fill="currentColor">
        <path d="M21 3L9 5.5v10.03a3.5 3.5 0 1 0 2 3V8.41l8-1.66v7.78a3.5 3.5 0 1 0 2 3V3z" />
      </svg>
    );
  }
  if (type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-red-500" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    );
  }
  if (type.includes("sheet") || type.includes("excel") || /\.(xlsx|xls|csv)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-green-600" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    );
  }
  if (type.includes("presentation") || type.includes("powerpoint") || /\.(pptx|ppt)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-orange-500" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    );
  }
  // Word 判断放在 Excel 和 PPT 之后，防止误判
  if (type.includes("word") || type.includes("document") || /\.(docx|doc)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-blue-600" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
        <text x="8" y="18" fontSize="6" fill="white" fontWeight="bold">W</text>
      </svg>
    );
  }
  if (type.includes("zip") || type.includes("compressed") || /\.(zip|rar|7z|tar|gz|bz2)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-gray-500" fill="currentColor">
        <path fillRule="evenodd" d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6Zm1.5 1.5a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5ZM6 9.75A.75.75 0 0 1 6.75 9h1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-1.5Zm.75 3.75a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5Z" clipRule="evenodd" />
      </svg>
    );
  }
  // 代码文件
  if (/\.(html|css|js|jsx|ts|tsx|json|java|py|go|c|cpp|h|cs|php|rb|sh|bat|cmd|xml|yaml|yml|sql|rs|swift|kt)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo-500" fill="currentColor">
        <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
      </svg>
    );
  }
  // 文本/Markdown
  if (type.startsWith("text/") || /\.(txt|md|markdown|log|ini|conf)$/i.test(lowerName)) {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-500" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
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

const getFileMeta = (name: string, type: string) => {
  const lowerName = name.toLowerCase();

  if (type === "folder") {
    return { label: "文件夹", tone: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
  }
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)$/i.test(lowerName)) {
    return { label: "图片", tone: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" };
  }
  if (type.startsWith("video/") || /\.(mp4|webm|ogg|mov|mkv|avi|m4v)$/i.test(lowerName)) {
    return { label: "视频", tone: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" };
  }
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(lowerName)) {
    return { label: "音频", tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" };
  }
  if (type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return { label: "PDF", tone: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
  }
  if (type.includes("sheet") || type.includes("excel") || /\.(xlsx|xls|csv)$/i.test(lowerName)) {
    return { label: "Excel", tone: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  }
  if (type.includes("presentation") || type.includes("powerpoint") || /\.(pptx|ppt)$/i.test(lowerName)) {
    return { label: "PPT", tone: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" };
  }
  if (type.includes("word") || type.includes("document") || /\.(docx|doc)$/i.test(lowerName)) {
    return { label: "Word", tone: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
  }
  if (type.includes("zip") || type.includes("compressed") || /\.(zip|rar|7z|tar|gz|bz2)$/i.test(lowerName)) {
    return { label: "压缩包", tone: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
  }
  if (/\.(html|css|js|jsx|ts|tsx|json|java|py|go|c|cpp|h|cs|php|rb|sh|bat|cmd|xml|yaml|yml|sql|rs|swift|kt)$/i.test(lowerName)) {
    return { label: "代码", tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" };
  }
  if (type.startsWith("text/") || /\.(txt|md|markdown|log|ini|conf)$/i.test(lowerName)) {
    return { label: "文本", tone: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300" };
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

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const SortIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

type UploadItem = {
  id: string;
  file: File;
  key: string;
  progress: number;
  speed: string;
  status: "pending" | "uploading" | "success" | "error" | "paused";
  error?: string;
};

type SortKey = 'name' | 'size' | 'lastModified';
type SortDirection = 'asc' | 'desc';

const Home: React.FC = () => {
  const [rootFiles, setRootFiles] = useState<FileItem[]>([]);
  const [currentFiles, setCurrentFiles] = useState<FileItem[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_username') || localStorage.getItem('r2_username');
    const storedPw = localStorage.getItem('admin_password');
    if (storedUser) setUsername(storedUser);
    if (storedPw) {
      setPassword(storedPw);
      setLoggedIn(true);
    }
  }, []);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'lastModified',
    direction: 'desc' // 默认按时间倒序（最新在前）
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRefs = useRef<Map<string, XMLHttpRequest>>(new Map());

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };
    if (!headers["content-type"] && typeof options.body === "string") headers["content-type"] = "application/json";
    if (username.trim()) headers["x-admin-username"] = username.trim();
    if (password.trim()) headers["x-admin-password"] = password.trim();
    return fetch(url, { ...options, headers, cache: "no-store" });
  };

  const handleLogin = async () => {
    try {
      setLoginError("");
      const res = await fetchWithAuth("/api/auth");
      if (res.status === 401) {
        setLoginError("账号或密码错误，请重试");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoginError(data?.error ? String(data.error) : "登录失败");
        return;
      }

      setLoggedIn(true);
      if (rememberMe) {
        localStorage.setItem('admin_username', username.trim());
        localStorage.setItem('admin_password', password.trim());
      } else {
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_password');
      }
    } catch {
      setLoginError("登录失败，请稍后重试");
    }
  };
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

  // 监听导航栏的上传按钮事件
  useEffect(() => {
    const handleTrigger = () => setShowUploadModal(true);
    window.addEventListener("trigger-upload", handleTrigger);
    return () => window.removeEventListener("trigger-upload", handleTrigger);
  }, []);

  // 监听导航栏的首页按钮事件
  useEffect(() => {
    const handleHome = () => setPath([]);
    window.addEventListener("navigate-home", handleHome);
    return () => window.removeEventListener("navigate-home", handleHome);
  }, []);

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

  // 排序逻辑
  const sortedFiles = useMemo(() => {
    const files = [...currentFiles];
    return files.sort((a, b) => {
      // 文件夹始终在最前
      const aIsFolder = a.type === 'folder';
      const bIsFolder = b.type === 'folder';
      if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;

      let comparison = 0;
      switch (sortConfig.key) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'lastModified':
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
          break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [currentFiles, sortConfig]);

  const keyword = search.trim();
  const keywordLower = keyword.toLowerCase();
  const searchResults = useMemo(() => {
    if (!keywordLower) return null;
    const flat = flattenTree(rootFiles);
    return flat.filter((node) => node.item.name.toLowerCase().includes(keywordLower));
  }, [keywordLower, rootFiles]);

  const visibleNodes = useMemo<FlatNode[]>(() => {
    if (searchResults) return searchResults;
    return sortedFiles.map((file) => ({
      item: file,
      parentPath: path,
      fullPath: [...path, file.name],
    }));
  }, [sortedFiles, path, searchResults]);

  const handleCopy = (key: string, url: string) => {
    copyToClipboard(url);
    setCopied(key);
    setNotice("链接已复制成功 ✅");
    setTimeout(() => setCopied(null), 2000);
  };

  const resolveObjectUrl = async (file: FileItem, download: boolean, opts?: { direct?: boolean }) => {
    if (!file.key) throw new Error('Missing file key');
    const res = await fetchWithAuth(buildDownloadRequestUrl(file.key, file.name, download, opts?.direct));
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok || !data.url) throw new Error(data.error || 'Failed to get url');
    return String(data.url);
  };

  const handlePreview = async (file: FileItem) => {
    if (file.type === "folder") return;
    try {
      const url = await resolveObjectUrl(file, false);
      setPreview({ ...file, url });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setNotice(`预览失败: ${msg}`);
    }
  };

  const handleClosePreview = () => setPreview(null);

  const handleEnterFolder = (folder: FileItem) => {
    setPath([...path, folder.name]);
  };

  const handleBreadcrumbClick = (idx: number) => {
    setPath(path.slice(0, idx + 1));
  };


  const MULTIPART_THRESHOLD = 70 * 1024 * 1024; // ~70MiB
  const PART_SIZE = 70 * 1024 * 1024; // ~70MiB per part

  const xhrPut = (taskId: string, url: string, body: Blob, contentType: string, onProgress: (loaded: number, total: number) => void) => {
    return new Promise<{ etag?: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRefs.current.set(taskId, xhr);

      xhr.open("PUT", url);
      if (contentType) xhr.setRequestHeader("Content-Type", contentType);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total);
      };

      xhr.onload = () => {
        xhrRefs.current.delete(taskId);
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader("ETag") ?? undefined;
          resolve({ etag: etag || undefined });
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
        }
      };

      xhr.onerror = () => {
        xhrRefs.current.delete(taskId);
        reject(new Error("网络错误"));
      };

      xhr.onabort = () => {
        xhrRefs.current.delete(taskId);
        reject(new Error("已取消"));
      };

      xhr.send(body);
    });
  };

  // 开始上传单个文件（小文件单 PUT，大文件 multipart 分片）
  const startUpload = useCallback(async (item: UploadItem) => {
    setUploadQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", error: undefined } : i)));

    const file = item.file;
    const key = item.key;

    let lastLoaded = 0;
    let lastTime = Date.now();

    const updateProgress = (loaded: number, total: number) => {
      const now = Date.now();
      const diffTime = now - lastTime;
      const percent = total > 0 ? (loaded / total) * 100 : 0;

      let speedStr = item.speed;
      if (diffTime >= 500) {
        const diffLoaded = loaded - lastLoaded;
        const speedBytes = (diffLoaded / diffTime) * 1000;
        speedStr = formatSize(speedBytes) + "/s";
        lastLoaded = loaded;
        lastTime = now;
      }

      setUploadQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, progress: percent, speed: speedStr } : it)),
      );
    };

    try {
      if (file.size < MULTIPART_THRESHOLD) {
        // single PUT via /api/upload (tokenized)
        const signRes = await fetchWithAuth("/api/upload", {
          method: "POST",
          body: JSON.stringify({ key, contentType: file.type }),
        });
        const signData = await signRes.json().catch(() => ({}));
        if (!signRes.ok || !signData.url) throw new Error(signData.error || "无法获取上传签名");

        await xhrPut(item.id, String(signData.url), file, file.type, (loaded, total) => updateProgress(loaded, total));

        setUploadQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "success", progress: 100, speed: "" } : i)));
        fetchFiles();
        return;
      }

      // multipart upload via bindings
      const createRes = await fetchWithAuth("/api/multipart", {
        method: "POST",
        body: JSON.stringify({ action: "create", key, contentType: file.type }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createData.uploadId) throw new Error(createData.error || "无法创建分片上传");

      const uploadId = String(createData.uploadId);
      const partCount = Math.ceil(file.size / PART_SIZE);
      const parts: Array<{ etag: string; partNumber: number }> = [];

      for (let partNumber = 1; partNumber <= partCount; partNumber++) {
        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(file.size, start + PART_SIZE);
        const blob = file.slice(start, end);

        const signRes = await fetchWithAuth("/api/multipart", {
          method: "POST",
          body: JSON.stringify({ action: "signPart", key, uploadId, partNumber }),
        });
        const signData = await signRes.json().catch(() => ({}));
        if (!signRes.ok || !signData.url) throw new Error(signData.error || "无法获取分片签名");

        const completed = start;
        const total = file.size;

        const res = await xhrPut(item.id, String(signData.url), blob, file.type, (loaded) => {
          updateProgress(completed + loaded, total);
        });

        if (!res.etag) throw new Error("Missing ETag");
        parts.push({ etag: res.etag, partNumber });
      }

      const completeRes = await fetchWithAuth("/api/multipart", {
        method: "POST",
        body: JSON.stringify({ action: "complete", key, uploadId, parts }),
      });
      const completeData = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok) throw new Error(completeData.error || "分片合并失败");

      setUploadQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "success", progress: 100, speed: "" } : i)));
      fetchFiles();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setUploadQueue((prev) => prev.map((i) => (i.id === item.id && i.status !== 'paused' ? { ...i, status: "error", error: message, speed: "" } : i)));
    }
  }, [fetchFiles, fetchWithAuth, loggedIn, password, username]);

  // 上传队列处理器：限制同时上传 1 个文件
  useEffect(() => {
    const uploadingCount = uploadQueue.filter(item => item.status === 'uploading').length;
    if (uploadingCount < 1) {
      const nextItem = uploadQueue.find(item => item.status === 'pending');
      if (nextItem) {
        startUpload(nextItem);
      }
    }
  }, [uploadQueue, startUpload]);

  const handlePauseUpload = (id: string) => {
    const xhr = xhrRefs.current.get(id);
    if (xhr) {
      xhr.abort();
    }
    setUploadQueue(prev => prev.map(i => i.id === id ? { ...i, status: "paused" } : i));
  };

  const handleResumeUpload = (id: string) => {
    setUploadQueue(prev => prev.map(i => i.id === id ? { ...i, status: "pending", error: undefined } : i));
  };

  const handleRemoveUpload = (id: string) => {
    const xhr = xhrRefs.current.get(id);
    if (xhr) {
      xhr.abort();
    }
    setUploadQueue(prev => prev.filter(i => i.id !== id));
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleSort = (key: SortKey, direction: SortDirection) => {
    setSortConfig({ key, direction });
    setShowSortMenu(false);
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    handleFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFiles = async (files: File[]) => {
    const prefix = path.length > 0 ? path.join("/") + "/" : "";
    
    // 添加到队列
    const newItems: UploadItem[] = files.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      key: prefix + f.name,
      progress: 0,
      speed: "0 B/s",
      status: "pending"
    }));
    
    setUploadQueue(prev => [...prev, ...newItems]);
    setShowUploadModal(true);
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors relative">

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
            {/* 排序按钮 */}
            <div className="absolute right-0 top-0 h-full flex items-center pr-2">
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="排序"
                >
                  <SortIcon className="h-4 w-4" />
                </button>
                
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20 text-sm">
                      <div className="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">排序方式</div>
                      <button onClick={() => handleSort('lastModified', 'desc')} className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${sortConfig.key === 'lastModified' && sortConfig.direction === 'desc' ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>时间 (最新)</button>
                      <button onClick={() => handleSort('lastModified', 'asc')} className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${sortConfig.key === 'lastModified' && sortConfig.direction === 'asc' ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>时间 (最早)</button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button onClick={() => handleSort('name', 'asc')} className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${sortConfig.key === 'name' && sortConfig.direction === 'asc' ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>名称 (A-Z)</button>
                      <button onClick={() => handleSort('name', 'desc')} className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${sortConfig.key === 'name' && sortConfig.direction === 'desc' ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>名称 (Z-A)</button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button onClick={() => handleSort('size', 'asc')} className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${sortConfig.key === 'size' && sortConfig.direction === 'asc' ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>大小 (小-大)</button>
                      <button onClick={() => handleSort('size', 'desc')} className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${sortConfig.key === 'size' && sortConfig.direction === 'desc' ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>大小 (大-小)</button>
                    </div>
                  </>
                )}
              </div>
            </div>

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
              className="block w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all"
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
                const meta = getFileMeta(file.name, file.type);
                const isFolder = file.type === "folder";
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
                        {getFileIconSvg(file.name, file.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {file.name}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 whitespace-nowrap ${meta.tone}`}
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
	                      {file.type !== "folder" && (
	                        <>
                          <button
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              copied === file.key 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-transparent scale-105" 
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 hover:shadow-sm"
                            }`}
                            onClick={async () => {
                            try {
                              const url = await resolveObjectUrl(file, true);
                              handleCopy(file.key || file.name, url);
                            } catch (e) {
                              const msg = e instanceof Error ? e.message : String(e);
                              setNotice(`获取分享链接失败: ${msg}`);
                            }
                          }}
                            title="复制链接"
                          >
                            <LinkIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">复制链接</span>
                          </button>
	                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                            onClick={async () => {
                              try {
                                const url = await resolveObjectUrl(file, true, { direct: true });
                                triggerBrowserDownload(url, file.name);
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : String(e);
                                setNotice(`下载失败: ${msg}`);
                              }
                            }}
                            title="下载"
                          >
                            <DownloadIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">下载</span>
                          </button>
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4"
          onClick={handleClosePreview}
        >
          <div
            className="relative w-full max-w-6xl h-[70vh] md:h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
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
                {preview.url && (
                  <>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200"
                      onClick={async () => {
                      try {
                        const url = await resolveObjectUrl(preview, true);
                        handleCopy(preview!.key || preview!.name, url);
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : String(e);
                        setNotice(`获取分享链接失败: ${msg}`);
                      }
                    }}
                    >
                      <LinkIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">复制链接</span>
                    </button>
	                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
	                      onClick={async () => {
	                        try {
	                        const url = await resolveObjectUrl(preview, true, { direct: true });
	                        triggerBrowserDownload(url, preview.name);
	                      } catch (e) {
	                        const msg = e instanceof Error ? e.message : String(e);
	                        setNotice(`下载失败: ${msg}`);
	                      }
                      }}
                    >
                      <DownloadIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">下载</span>
                    </button>
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
              {(preview.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)$/i.test(preview.name.toLowerCase())) && (
                <img
                  src={preview.url || ""}
                  alt={preview.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
	              {(preview.type.startsWith("video/") || /\.(mp4|webm|ogg|mov|mkv|avi|m4v)$/i.test(preview.name.toLowerCase())) && (
	                <div 
	                  className="relative w-full max-w-5xl aspect-video bg-black rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.3)] overflow-hidden mx-auto"
	                  style={{ maxHeight: '100%' }}
	                >
	                  <video
	                    src={preview.url || ""}
	                    controls
	                    className="w-full h-full object-contain"
	                  />
	                </div>
	              )}
              {(preview.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(preview.name.toLowerCase())) && (
                <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3L9 5.5v10.03a3.5 3.5 0 1 0 2 3V8.41l8-1.66v7.78a3.5 3.5 0 1 0 2 3V3z" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center break-all">{preview.name}</h3>
                    <audio
                      src={preview.url || ""}
                      controls
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              {preview.type === "application/pdf" && (
                <iframe
                  src={preview.url || ""}
                  className="w-full h-full bg-white rounded-lg shadow-lg"
                  title="PDF Preview"
                />
              )}
              {(preview.type.includes("word") || preview.type.includes("document") || preview.type.includes("sheet") || preview.type.includes("excel") || preview.type.includes("presentation") || preview.type.includes("powerpoint")) && (
                <iframe
                  src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
                    preview.url || ""
                  )}`}
                  className="w-full h-full bg-white"
                  title="Office Preview"
                />
              )}
              {!(preview.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff)$/i.test(preview.name.toLowerCase())) &&
                !(preview.type.startsWith("video/") || /\.(mp4|webm|ogg|mov|mkv|avi|m4v)$/i.test(preview.name.toLowerCase())) &&
                !(preview.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac|aac|wma)$/i.test(preview.name.toLowerCase())) &&
                preview.type !== "application/pdf" &&
                !preview.type.includes("word") &&
                !preview.type.includes("document") &&
                !preview.type.includes("sheet") &&
                !preview.type.includes("excel") &&
                !preview.type.includes("presentation") &&
                !preview.type.includes("powerpoint") && (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <div className="h-24 w-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      {getFileIconSvg(preview.name, preview.type)}
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">无法预览此文件</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">此文件类型暂不支持在线预览，请下载后查看。</p>
	                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
	                      onClick={async () => {
	                        try {
	                          const url = await resolveObjectUrl(preview, true, { direct: true });
	                          triggerBrowserDownload(url, preview.name);
	                        } catch (e) {
	                          const msg = e instanceof Error ? e.message : String(e);
	                          setNotice(`下载失败: ${msg}`);
	                        }
                      }}
                    >
                      <DownloadIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">下载</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* 上传对话框 */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh]">
            {/* 对话框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold">文件上传</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {!loggedIn ? (
              <div className="p-8 flex flex-col gap-6 justify-center items-center bg-white dark:bg-gray-900">
                <div className="w-full max-w-sm space-y-5">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">管理员登录</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">请验证身份以继续上传文件</p>
                  </div>

                  {loginError && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in-up">
                      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">账号</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="请输入管理员账号" 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">密码</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="请输入密码" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none group">
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all" 
                      />
                      <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">记住登录信息</span>
                    </label>
                  </div>

                  <button 
                    onClick={handleLogin}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    登录
                  </button>
                </div>
              </div>
            ) : (
            <>
            {/* 拖拽区域 */}
            <div 
              className={`mx-6 mt-6 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
                isDragging 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 mb-3">
                <UploadIcon className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                拖拽文件到此处，或 <button onClick={handleSelectFile} className="text-blue-600 hover:underline">点击选择</button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                支持多文件上传，单文件最大 5GB
              </p>
            </div>

            {/* 文件列表 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {uploadQueue.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">暂无上传任务</p>
              )}
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex-shrink-0">
                    {getFileIconSvg(item.file.name, item.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs" title={item.file.name}>{item.file.name}</span>
                      <span className="text-xs text-gray-500 font-mono">
                        {item.status === 'uploading' 
                          ? `${Math.round(item.progress)}% · ${item.speed}` 
                          : formatSize(item.file.size)}
                      </span>
                    </div>
                    
                    {/* 只有正在上传的文件显示进度条 */}
                    {item.status === 'uploading' && (
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {item.status === 'error' && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
                    {item.status === 'paused' && <p className="text-xs text-orange-500 mt-1">已暂停</p>}
                    {item.status === 'pending' && <p className="text-xs text-gray-400 mt-1">等待上传...</p>}
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    {item.status === 'success' ? (
                      <span className="text-green-500 text-sm font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        完成
                      </span>
                    ) : (
                      <>
                        {item.status === 'uploading' && (
                          <button onClick={() => handlePauseUpload(item.id)} className="text-gray-400 hover:text-orange-500 p-1" title="暂停">
                            <PauseIcon className="h-5 w-5" />
                          </button>
                        )}
                        {(item.status === 'paused' || item.status === 'error') && (
                          <button onClick={() => handleResumeUpload(item.id)} className="text-gray-400 hover:text-blue-500 p-1" title="重试/继续">
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button onClick={() => handleRemoveUpload(item.id)} className="text-gray-400 hover:text-red-500 p-1" title="取消/删除">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-fade-in-up">
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
