import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const ctx = getRequestContext();
  const env = ctx?.env;
  
  // 检查绑定是否存在
  if (!env || !env.BUCKET) {
    console.error('BUCKET binding not found');
    // 返回空数组而不是报错，避免前端崩溃，方便调试
    return NextResponse.json([]); 
  }

  try {
    // 列出存储桶中的所有文件
    const listed = await env.BUCKET.list();
    
    // 将扁平的文件列表转换为树形结构 (Folder/File)
    const tree = buildTree(listed.objects);
    
    return NextResponse.json(tree);
  } catch (e: any) {
    console.error('Error listing R2 bucket:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 辅助函数：构建树形结构
function buildTree(objects: any[]) {
  const root: any[] = [];
  const map = new Map();

  objects.forEach((obj) => {
    const parts = obj.key.split('/'); // 按 / 分割路径
    let currentPath = '';

    parts.forEach((part: string, index: number) => {
      const isLast = index === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!map.has(currentPath)) {
        const item = {
          name: part,
          // 如果是文件，尝试获取类型，否则默认为 folder
          type: isLast ? (obj.httpMetadata?.contentType || 'file') : 'folder',
          size: isLast ? obj.size : 0,
          lastModified: obj.uploaded.toISOString(),
          // 这里暂时用 key 作为 url，前端会配合自定义域名使用
          url: isLast ? `/${obj.key}` : undefined, 
          children: isLast ? undefined : []
        };
        
        map.set(currentPath, item);

        if (parentPath) {
          const parent = map.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(item);
          }
        } else {
          root.push(item);
        }
      }
    });
  });

  return root;
}