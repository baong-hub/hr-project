import React from 'react';
import { DataScope, PermissionLevel, type PermissionTreeNode } from '../../../core/models/user-role.model';
import { Icon } from '../Icon/Icon';
import DataScopeSelector from '../DataScopeSelector/DataScopeSelector';
import styles from './PermissionTreeCheckbox.module.scss';

interface PermissionTreeCheckboxProps {
  tree: PermissionTreeNode[];
  selectedPermissions: Map<number, DataScope>;
  onChange: (newSelection: Map<number, DataScope>) => void;
  readOnly?: boolean;
}

const PermissionTreeCheckbox: React.FC<PermissionTreeCheckboxProps> = ({
  tree,
  selectedPermissions,
  onChange,
  readOnly = false,
}) => {
  // Helper to check if level matches
  const isLevel = (node: PermissionTreeNode, level: PermissionLevel): boolean => {
    // Handle both numeric and string levels from API
    if (typeof node.level === 'number') return node.level === level;
    if (typeof node.level === 'string') {
      const levelStr = String(node.level).toUpperCase();
      if (level === PermissionLevel.MENU) return levelStr === 'MENU' || levelStr === '1';
      if (level === PermissionLevel.MODULE) return levelStr === 'MODULE' || levelStr === '2';
      if (level === PermissionLevel.ACTION) return levelStr === 'ACTION' || levelStr === '3';
    }
    return false;
  };

  // Helper to get all descendant Action IDs
  const getAllActionIds = (node: PermissionTreeNode): number[] => {
    if (isLevel(node, PermissionLevel.ACTION)) {
      return [Number(node.id)];
    }
    if (!node.children || node.children.length === 0) {
      return [];
    }
    return node.children.flatMap(child => getAllActionIds(child));
  };

  const handleToggle = (node: PermissionTreeNode, checked: boolean) => {
    if (readOnly) return;
    
    const newSelection = new Map<number, DataScope>(selectedPermissions);
    const actionIds = getAllActionIds(node);

    if (actionIds.length === 0) return;

    actionIds.forEach(id => {
      const numericId = Number(id);
      if (checked) {
        if (!newSelection.has(numericId)) {
          newSelection.set(numericId, DataScope.SITE);
        }
      } else {
        newSelection.delete(numericId);
      }
    });

    onChange(newSelection);
  };

  const handleScopeChange = (permissionId: number, scope: DataScope) => {
    if (readOnly) return;
    const newSelection = new Map<number, DataScope>(selectedPermissions);
    newSelection.set(Number(permissionId), scope);
    onChange(newSelection);
  };

  const handleParentScopeChange = (node: PermissionTreeNode, scope: DataScope) => {
    if (readOnly) return;
    const newSelection = new Map<number, DataScope>(selectedPermissions);
    const actionIds = getAllActionIds(node);
    
    actionIds.forEach(id => {
      const numericId = Number(id);
      if (newSelection.has(numericId)) {
        newSelection.set(numericId, scope);
      }
    });
    
    onChange(newSelection);
  };

  const getCommonScope = (node: PermissionTreeNode): DataScope => {
    const actionIds = getAllActionIds(node);
    const scopes = actionIds
      .map(id => selectedPermissions.get(Number(id)))
      .filter(s => s !== undefined) as DataScope[];
      
    if (scopes.length === 0) return DataScope.SITE;
    
    // Lấy scope cao nhất (giá trị số nhỏ nhất: ALL: 1 < SITE: 2 < OWN: 3)
    return Math.min(...scopes) as DataScope;
  };

  const getStatus = (node: PermissionTreeNode) => {
    const actionIds = getAllActionIds(node);
    if (actionIds.length === 0) return 'unchecked';

    const selectedCount = actionIds.filter(id => selectedPermissions.has(Number(id))).length;

    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === actionIds.length) return 'checked';
    return 'indeterminate';
  };

  const renderNode = (node: PermissionTreeNode, depth: number = 0, path: string = '') => {
    const currentPath = path ? `${path}-${node.id}` : `${node.id}`;
    const nodeKey = `${node.level}-${currentPath}`;
    const status = getStatus(node);
    const isAction = isLevel(node, PermissionLevel.ACTION);
    const hasSelectedChildren = status !== 'unchecked';

    return (
      <div key={nodeKey} className={styles.node} style={{ marginLeft: depth * 24 }}>
        <div className={styles.nodeHeader}>
          <div className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              id={`perm-input-${nodeKey}`}
              checked={status === 'checked'}
              ref={el => {
                if (el) el.indeterminate = status === 'indeterminate';
              }}
              onChange={() => handleToggle(node, status !== 'checked')}
              disabled={readOnly}
            />
            <label htmlFor={`perm-input-${nodeKey}`}>
              {node.icon && <Icon name={node.icon} size={16} className={styles.icon} />}
              <span className={styles.name}>{node.name}</span>
              {isAction && <span className={styles.code}>({node.code})</span>}
            </label>
          </div>

          {((isAction && selectedPermissions.has(Number(node.id))) || (!isAction && hasSelectedChildren)) && (
            <div className={styles.scopeSelector}>
              <DataScopeSelector
                value={isAction ? selectedPermissions.get(Number(node.id))! : getCommonScope(node)}
                onChange={(scope) => isAction 
                  ? handleScopeChange(Number(node.id), scope) 
                  : handleParentScopeChange(node, scope)
                }
                disabled={readOnly}
              />
            </div>
          )}
        </div>

        {node.children && node.children.length > 0 && (
          <div className={styles.children}>
            {node.children.map((child) => renderNode(child, depth + 1, nodeKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.treeContainer}>
      {tree.map((node, index) => renderNode(node, 0, `root-${index}`))}
    </div>
  );
};

export default PermissionTreeCheckbox;
