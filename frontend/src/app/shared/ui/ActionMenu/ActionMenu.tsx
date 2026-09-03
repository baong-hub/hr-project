import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './ActionMenu.module.scss';

export interface ActionMenuItem {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  triggerIcon?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items, triggerIcon = 'MoreVertical' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button 
        className={`${styles.trigger} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Thao tác"
      >
        <Icon name={triggerIcon as any} size={18} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider && <div className={styles.divider} />}
              <button
                className={`${styles.menuItem} ${item.variant === 'danger' ? styles.danger : ''}`}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
              >
                <Icon name={item.icon as any} size={16} />
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
