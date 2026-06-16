import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagChip from '../../src/components/TagChip';

describe('TagChip', () => {
  it('TC-01: 渲染标签文本和图标', () => {
    render(<TagChip tag="work" />);
    expect(screen.getByText('work')).toBeInTheDocument();
    // 验证 Hash 图标存在 (lucide-react 的 Hash 组件渲染一个 svg)
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('TC-02: onClick 回调触发', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TagChip tag="personal" onClick={onClick} />);
    const chip = screen.getByText('personal');
    await user.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('TC-03: 无 onClick 时没有 cursor-pointer', () => {
    render(<TagChip tag="work" />);
    const chip = screen.getByText('work').closest('span');
    expect(chip.className).not.toContain('cursor-pointer');
  });

  it('TC-04: 有 onClick 时显示 cursor-pointer', () => {
    render(<TagChip tag="work" onClick={() => {}} />);
    const chip = screen.getByText('work').closest('span');
    expect(chip.className).toContain('cursor-pointer');
  });

  it('TC-05: 不同 size 应用不同样式', () => {
    const { rerender } = render(<TagChip tag="test" size="xs" />);
    let chip = screen.getByText('test').closest('span');
    expect(chip.className).toContain('text-xs');
    expect(chip.className).toContain('px-1.5');

    rerender(<TagChip tag="test" size="md" />);
    chip = screen.getByText('test').closest('span');
    expect(chip.className).toContain('text-sm');
    expect(chip.className).toContain('px-2.5');
  });
});
