import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RoleListItem } from '../../../../core/models/user-role.model';
import { userRoleService } from '../../../../core/services/user-role.service';
import { authService } from '../../../../core/services/auth.service';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './UserRoleAssignPage.module.scss';

const UserRoleAssignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, userRolesRes] = await Promise.all([
          userRoleService.getRoles({ pageSize: 100, isActive: true }),
          userRoleService.getUserRoles(userId),
        ]);

        if (rolesRes.success && rolesRes.data) {
          setRoles(rolesRes.data.items);
        }
        if (userRolesRes.success && userRolesRes.data) {
          setSelectedRoleIds(userRolesRes.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const currentUser = authService.getUser();
  const currentUserLevel = currentUser?.minRoleLevel ?? 5;

  const handleToggleRole = (roleId: number, roleLevel: number) => {
    // Cannot toggle roles with higher rank than current user
    if (roleLevel < currentUserLevel) return;

    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  const handleSave = async () => {
    if (selectedRoleIds.length === 0) {
      alert('Vui lòng chọn ít nhất một vai trò.');
      return;
    }

    setSaving(true);
    try {
      const response = await userRoleService.assignUserRoles(userId, selectedRoleIds);
      if (response.success) {
        alert('Gán vai trò thành công');
        navigate('/user-roles/users');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={styles.backBtn} onClick={() => navigate('/user-roles/users')}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1>Gán vai trò cho nhân viên</h1>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/user-roles/users')}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Icon name="Save" size={18} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.roleGrid}>
          {roles.map(role => {
            const isHigherRank = role.level < currentUserLevel;
            return (
              <div
                key={role.id}
                className={`
                  ${styles.roleCard} 
                  ${selectedRoleIds.includes(role.id) ? styles.selected : ''} 
                  ${isHigherRank ? styles.disabled : ''}
                `}
                onClick={() => handleToggleRole(role.id, role.level)}
                title={isHigherRank ? 'Bạn không có quyền quản lý vai trò này' : ''}
              >
                <div className={styles.roleInfo}>
                  <div className={styles.roleTitleLine}>
                    <h3>{role.name}</h3>
                    {isHigherRank && <Icon name="Lock" size={14} className={styles.lockIcon} />}
                  </div>
                  <p>{role.description}</p>
                  <div className={styles.roleMeta}>
                    <span className={styles.permCount}>{role.permissionCount} quyền</span>
                    <span className={styles.levelTag}>Cấp {role.level}</span>
                  </div>
                </div>
                <div className={styles.checkbox}>
                  {selectedRoleIds.includes(role.id) && <Icon name="Check" size={20} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserRoleAssignPage;
