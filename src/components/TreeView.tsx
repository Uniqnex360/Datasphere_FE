import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { useState } from 'react';

export interface TreeNode {
  id: string;
  label: string;
  tag?: string;
  children?: TreeNode[];
  data?: any;
}

interface TreeViewProps {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (id: string, data?: any) => void;
  onDrop?: (draggedId: string, targetId: string) => void;
}

export default function TreeView({ nodes, selectedId, onSelect, onDrop }: TreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId && onDrop) {
      onDrop(draggedId, targetId);
    }
    setDraggedId(null);
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const isDragging = draggedId === node.id;

    return (
      <div key={node.id} className={isDragging ? 'opacity-50' : ''}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.id)}
          onClick={() => onSelect(node.id, node.data)}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          <div className="flex items-center gap-1 flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-600" />
                ) : (
                  <ChevronRight size={16} className="text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <GripVertical size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-medium">{node.label}</span>
            {node.tag && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {node.tag}
              </span>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children!.map((child) => renderNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return <div className="space-y-0.5">{nodes.map((node) => renderNode(node))}</div>;
}
