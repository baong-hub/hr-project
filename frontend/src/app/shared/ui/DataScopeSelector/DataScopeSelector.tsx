import React from 'react';
import { DataScope } from '../../../core/models/user-role.model';

interface DataScopeSelectorProps {
  value: DataScope;
  onChange: (value: DataScope) => void;
  disabled?: boolean;
}

const DataScopeSelector: React.FC<DataScopeSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <select
      className="form-select form-select-sm"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as DataScope)}
      disabled={disabled}
      style={{ width: 'auto', display: 'inline-block' }}
    >
      <option value={DataScope.ALL}>Toàn công ty</option>
      <option value={DataScope.SITE}>Theo site</option>
      <option value={DataScope.DEPARTMENT_TREE}>Phòng ban & cấp dưới</option>
      <option value={DataScope.DEPARTMENT}>Phòng ban trực tiếp</option>
      <option value={DataScope.OWN}>Cá nhân</option>
    </select>
  );
};

export default DataScopeSelector;
