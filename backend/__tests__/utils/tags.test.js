import { describe, it, expect } from 'vitest';
import { extractTags } from '../../src/utils/tags.js';

describe('tags.js', () => {
  it('TG-01: 提取 #标签', () => {
    expect(extractTags('今天 #工作 完成了')).toEqual(['工作']);
  });

  it('TG-02: 提取多个标签并转为小写', () => {
    const result = extractTags('#Hello #World #Hello');
    expect(result).toEqual(['hello', 'world']);
  });

  it('TG-03: 无标签文本返回空数组', () => {
    expect(extractTags('普通文本没有标签')).toEqual([]);
  });

  it('TG-04: 空字符串返回空数组', () => {
    expect(extractTags('')).toEqual([]);
  });

  it('TG-05: 中英文混合标签', () => {
    const result = extractTags('#中文 #english');
    expect(result).toContain('中文');
    expect(result).toContain('english');
  });

  it('TG-06: 连字符标签', () => {
    const result = extractTags('#my-tag #tag-1');
    expect(result).toContain('my-tag');
    expect(result).toContain('tag-1');
  });

  it('TG-07: 重复标签去重', () => {
    const result = extractTags('#Tag #tag #TAG');
    expect(result).toEqual(['tag']);
  });

  it('TG-08: 非标签的 #（如编号）不提取', () => {
    // "编号#123" 由于 # 前没有空格/行首，应不匹配
    const result = extractTags('编号#123');
    expect(result).toEqual([]);
  });
});
