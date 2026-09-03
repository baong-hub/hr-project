import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RoleListItem } from '../../../../core/models/user-role.model';
import { userRoleService } from '../../../../core/services/user-role.service';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import { ActionMenu, type ActionMenuItem } from '../../../../shared/ui/ActionMenu/ActionMenu';
import { authService } from '../../../../core/services/auth.service';
import styles from './RoleListPage.module.scss';

const RoleListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await userRoleService.getRoles({ search });
      if (response.success && response.data) {
        setRoles(response.data.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [search]);

  const currentUser = authService.getUser();
  const currentUserLevel = currentUser?.minRoleLevel ?? 5;

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa vai trò "${name}"?`)) {
      try {
        const res = await userRoleService.deleteRole(id);
        if (res.success) {
          fetchRoles();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getRoleActions = (role: RoleListItem): ActionMenuItem[] => {
    const isHigherRank = role.level < currentUserLevel;
    const isSystemRole = role.id === 1; // Super Admin is protected

    const actions: ActionMenuItem[] = [];

    // Only allow editing roles at or below user's own rank
    if (!isHigherRank && !isSystemRole) {
      actions.push({
        label: 'Sửa thông tin',
        icon: 'Edit',
        onClick: () => navigate(`/user-roles/roles/${role.id}/edit`)
      });
      actions.push({
        label: 'Phân quyền',
        icon: 'Shield',
        onClick: () => navigate(`/user-roles/roles/${role.id}/permissions`)
      });
    }

    actions.push({
      label: 'Gán nhân viên',
      icon: 'UserPlus',
      onClick: () => navigate(`/user-roles/roles/${role.id}/assign`)
    });

    if (!isHigherRank && !isSystemRole) {
      actions.push({
        label: 'Xóa',
        icon: 'Trash2',
        variant: 'danger',
        divider: true,
        onClick: () => handleDelete(role.id, role.name)
      });
    }

    return actions;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>{t('sidebar.module_user_role') || 'Danh sách vai trò'}</h1>
          <p>{t('user_role.subtitle') || 'Quản lý các nhóm quyền và gán cho nhân viên'}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate('/reports/permission-by-role')}>
            <Icon name="ShieldCheck" size={18} />
            Quyền theo vai trò
          </Button>
          <Button variant="secondary" onClick={() => navigate('/reports/permission-by-user')}>
            <Icon name="UserCheck" size={18} />
            Quyền theo người dùng
          </Button>
          <Button onClick={() => navigate('/user-roles/roles/new')}>
            <Icon name="Plus" size={18} />
            {t('user_role.add_role') || 'Thêm vai trò'}
          </Button>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Icon name="Search" size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={t('user_role.search_placeholder') || 'Tìm kiếm vai trò...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRoles()}
          />
        </div>
        <Button variant="secondary" onClick={fetchRoles}>{t('common.refresh') || 'Làm mới'}</Button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>{t('common.loading') || 'Đang tải...'}</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('user_role.role_name') || 'Tên vai trò'}</th>
                  <th>{t('user_role.level') || 'Cấp độ'}</th>
                  <th>{t('user_role.description') || 'Mô tả'}</th>
                  <th>{t('user_role.staff_count') || 'Nhân viên'}</th>
                  <th>{t('user_role.perm_count') || 'Số quyền'}</th>
                  <th>{t('common.status') || 'Trạng thái'}</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} onClick={() => navigate(`/user-roles/roles/${role.id}`)}>
                    <td className={styles.roleName}>{role.name}</td>
                    <td>
                      <span className={styles.levelBadge} data-level={role.level}>
                        {role.levelName || `Cấp ${role.level}`}
                      </span>
                    </td>
                    <td className={styles.roleDesc}>{role.description}</td>
                    <td>{role.userCount}</td>
                    <td>{role.permissionCount}</td>
                    <td>
                      <span className={`${styles.badge} ${role.isActive ? styles.active : styles.inactive}`}>
                        {role.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={getRoleActions(role)} />
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={7} className={styles.empty}>Chưa có vai trò nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleListPage;
