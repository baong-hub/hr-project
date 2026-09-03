import React from 'react';
import styles from './ProductTypeBadge.module.scss';

export type ProductType = 'Service' | 'Goods' | 'Combo' | 'MemberCard' | 'Supplies';

interface ProductTypeBadgeProps {
  type: ProductType | string;
  className?: string;
}

const typeMap: Record<string, ProductType> = {
  'Service': 'Service',
  'SERVICE': 'Service',
  'Goods': 'Goods',
  'GOODS': 'Goods',
  'Combo': 'Combo',
  'COMBO': 'Combo',
  'MemberCard': 'MemberCard',
  'MEMBER_CARD': 'MemberCard',
  'Supplies': 'Supplies',
  'SUPPLIES': 'Supplies'
};

const typeConfig: Record<ProductType, { color: string; text: string }> = {
  Service: { color: 'info', text: 'DV' },
  Goods: { color: 'success', text: 'HH' },
  Combo: { color: 'purple', text: 'CB' },
  MemberCard: { color: 'warning', text: 'Thẻ' },
  Supplies: { color: 'secondary', text: 'VT' }
};

export const ProductTypeBadge: React.FC<ProductTypeBadgeProps> = ({ type, className = '' }) => {
  const normalizedType = typeMap[type] || (type as ProductType);
  const config = typeConfig[normalizedType] || { color: 'secondary', text: type };

  return (
    <span className={`${styles.badge} ${styles[config.color]} ${className}`}>
      {config.text}
    </span>
  );
};
