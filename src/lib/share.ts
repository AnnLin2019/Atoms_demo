// 自包含分享链接:把生成应用的完整 HTML 压缩进 URL,由 /view 路由独立渲染,
// 免后端即可得到一个真正可访问、可分享的链接。
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

/** 把完整 HTML 应用压缩成 URL 安全的字符串 */
export function encodeApp(html: string): string {
  return compressToEncodedURIComponent(html)
}

/** 从 URL 参数还原应用 HTML;解析失败返回 null */
export function decodeApp(encoded: string): string | null {
  if (!encoded) return null
  try {
    return decompressFromEncodedURIComponent(encoded) || null
  } catch {
    return null
  }
}

/** 生成绝对、自包含、可分享的访问链接(内嵌应用完整代码,无需登录) */
export function buildShareLink(html: string): string {
  const base = typeof location !== 'undefined' ? location.origin + location.pathname : ''
  return base + '#/view/' + encodeApp(html)
}