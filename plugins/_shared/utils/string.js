/**
 * 字符串工具
 */

export function truncate(str, length = 100, suffix = '...') {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
}

export function highlight(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

export function extractTags(text) {
  const matches = text.match(/#[\w\u4e00-\u9fa5]+/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}
