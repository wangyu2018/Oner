const TAG_REGEX = /(?:^|\s)#([\w一-鿿][\w一-鿿-]*)/g;

export function extractTags(content) {
  const tags = [];
  let match;
  while ((match = TAG_REGEX.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return [...new Set(tags)];
}
