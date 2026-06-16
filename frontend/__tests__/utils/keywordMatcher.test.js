import { describe, it, expect } from 'vitest';
import { matchKeywords, getHighlightRanges, stripKeywords } from '../../src/utils/keywordMatcher';

describe('keywordMatcher', () => {
  describe('matchKeywords', () => {
    it('KM-01: 匹配日期关键词 明天', () => {
      const result = matchKeywords('明天开会');
      expect(result.date).toBeTruthy();
    });

    it('KM-02: 匹配状态关键词 买', () => {
      const result = matchKeywords('买牛奶');
      expect(result.status).toBe('todo');
    });

    it('KM-03: 匹配优先级关键词 紧急', () => {
      const result = matchKeywords('紧急任务');
      expect(result.priority).toBe('urgent');
    });

    it('KM-04: 匹配提醒关键词', () => {
      const result = matchKeywords('提醒我明天开会');
      expect(result.remind).toBe(true);
      expect(result.status).toBe('todo'); // 提醒默认待办
    });

    it('KM-05: 匹配自定义分类', () => {
      const categories = [{ name: '工作', color: '#ef4444' }, { name: '学习', color: '#3b82f6' }];
      const result = matchKeywords('工作项目计划', categories);
      expect(result.category).toBe('工作');
    });

    it('KM-06: 无匹配返回默认值', () => {
      const result = matchKeywords('普通文本');
      expect(result.date).toBeNull();
      expect(result.status).toBeNull();
      expect(result.priority).toBeNull();
      expect(result.remind).toBe(false);
      expect(result.category).toBeNull();
    });
  });

  describe('getHighlightRanges', () => {
    it('KM-07: 返回高亮位置信息', () => {
      const ranges = getHighlightRanges('明天紧急开会', [{ name: '工作', color: '#ef4444' }]);
      expect(ranges.length).toBeGreaterThan(0);
      expect(ranges.some(r => r.type === 'date')).toBe(true);
      expect(ranges.some(r => r.type === 'priority')).toBe(true);
    });
  });

  describe('stripKeywords', () => {
    it('KM-08: 去除已匹配的关键词', () => {
      const keywords = matchKeywords('明天提醒我买牛奶');
      const cleaned = stripKeywords('明天提醒我买牛奶', keywords);
      expect(cleaned).not.toContain('明天');
      expect(cleaned).not.toContain('提醒');
    });
  });
});
