const TAG_REGEX = /(?:^|\s)#([\w一-鿿][\w一-鿿-]*)/g;

export function parseTags(content) {
  const tags = [];
  let match;
  while ((match = TAG_REGEX.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return [...new Set(tags)];
}

export function extractFirstLine(content) {
  if (!content) return '';
  const lines = content.split('\n').filter(line => line.trim());
  return lines[0] || '';
}

export function getContentPreview(content, maxLength = 100) {
  if (!content) return '';
  const cleaned = content
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + '...';
}
