'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 左侧 Logo 和导航链接 */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2.5 text-[1.375rem] font-bold text-blue-600 dark:text-blue-400">
	                <Image
	                  src="/icons/logo.png"
	                  alt="Logo"
	                  width={40}
	                  height={40}
	                  className="h-11 w-12 shrink-0"
	                  priority
	                />
                <span className="leading-none">WanQing&apos;s R2 Drive</span>
              </Link>
            </div>
          </div>

          {/* 右侧功能区 */}
          <div className="hidden sm:flex items-center space-x-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("navigate-home"))}
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
              title="回到首页"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-sm font-medium">首页</span>
            </button>
            <a href="https://qinghub.top" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="我的博客">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span className="text-sm font-medium">我的博客</span>
            </a>
            <a href="https://qinghub.top/about/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="关于页面">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">关于页面</span>
            </a>
            <a
              href="https://r2admin.qinghub.top/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="R2 Admin"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth={1.5} />
                <path d="M4 10h16" strokeWidth={1.5} strokeLinecap="round" />
                <circle cx="8.5" cy="15" r="0.9" fill="currentColor" stroke="none" />
                <circle cx="11.5" cy="15" r="0.9" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-sm font-medium">R2 Admin</span>
            </a>
            <a href="mailto:wangqing176176@gmail.com" className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="电子邮件">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">电子邮件</span>
            </a>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("trigger-upload"))}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              上传
            </button>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">打开菜单</span>
              {/* 汉堡图标 / 关闭图标 */}
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单面板 */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="pt-2 pb-3 space-y-1">
            <button
              className="w-full text-left border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("navigate-home"));
                setIsMobileMenuOpen(false);
              }}
            >
              首页
            </button>
            <a
              href="https://qinghub.top"
              target="_blank" rel="noopener noreferrer"
              className="border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              我的博客
            </a>
            <a
              href="https://qinghub.top/about/"
              target="_blank" rel="noopener noreferrer"
              className="border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              关于页面
            </a>
            <a
              href="https://r2admin.qinghub.top/"
              target="_blank" rel="noopener noreferrer"
              className="border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              R2 Admin
            </a>
            <a
              href="mailto:wangqing176176@gmail.com"
              className="border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              电子邮件
            </a>
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center px-4" onClick={() => setIsMobileMenuOpen(false)}>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent("trigger-upload"))}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                上传文件
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
