import { describe, it, expect } from 'vitest';
import { parseTags, extractFirstLine, getContentPreview } from '../../src/utils/tags';

describe('tags utils', () => {
  it('TA-01: 从文本中提取 #tag', () => {
    const tags = parseTags('今天 #工作 开会 #项目 #工作');
    expect(tags).toEqual(['工作', '项目']);
  });

  it('TA-02: 提取中文标签', () => {
    const tags = parseTags('测试 #标签 #中文标签 #tag');
    expect(tags).toContain('标签');
    expect(tags).toContain('中文标签');
    expect(tags).toContain('tag');
  });

  it('TA-03: 无标签返回空数组', () => {
    expect(parseTags('普通文本')).toEqual([]);
  });

  it('TA-04: extractFirstLine 返回第一行内容', () => {
    expect(extractFirstLine('第一行\n\n第二行')).toBe('第一行');
  });

  it('TA-05: extractFirstLine 空内容返回空字符串', () => {
    expect(extractFirstLine('')).toBe('');
  });

  it('TA-06: getContentPreview 截取预览文本', () => {
    expect(getContentPreview('这是一段很长的文本内容', 6)).toBe('这是一段很长...');
  });

  it('TA-07: getContentPreview 清除 markdown 标记', () => {
    const result = getContentPreview('**加粗**和[链接](http://a.com)');
    expect(result).not.toContain('**');
    expect(result).not.toContain('http://');
  });

  it('TA-08: getContentPreview 空内容返回空字符串', () => {
    expect(getContentPreview('')).toBe('');
  });
});
