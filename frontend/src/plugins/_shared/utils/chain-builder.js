/**
 * 思维链构建器 — 把扁平笔记列表组装成链状结构
 */

export function buildChain(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return [];

  // 按时间排序
  const sorted = [...notes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const nodes = sorted.map((n, idx) => ({
    id: n.id,
    type: detectNodeType(n, idx, sorted),
    title: n.title || n.content?.slice(0, 30) || '未命名',
    content: n.content,
    tags: n.tags || [],
    createdAt: n.created_at,
    parentId: n.parent_id || null,
    childIds: [],
    depth: 0,
    isBranch: false,
    isMerge: false
  }));

  // 构建父子关系 + 检测分支/合并
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  for (const node of nodes) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId);
      parent.childIds.push(node.id);
      node.depth = parent.depth + 1;
    }
  }

  // 检测分支（一个父节点有多个子节点 = 分支点）
  // 检测合并（多个子节点指向同一父节点 = 合并点）
  const childCount = new Map();
  for (const node of nodes) {
    if (node.parentId) {
      childCount.set(node.parentId, (childCount.get(node.parentId) || 0) + 1);
    }
  }
  for (const node of nodes) {
    if (childCount.get(node.id) > 1) node.isBranch = true;
  }

  // 顶层节点（无 parent）
  return nodes.filter(n => !n.parentId);
}

function detectNodeType(note, idx, allNotes) {
  if (idx === 0) return 'origin';        // 起点
  if (note.status === 'done') return 'conclusion'; // 结论
  if (note.priority === 'high' || note.priority === 'urgent') return 'action'; // 行动
  if (note.parent_id) return 'extension'; // 延伸
  return 'refinement';                    // 细化
}
