import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../core/services/api.service';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './UserRoleListPage.module.scss';

// Reusing user model but with role names
interface UserWithRoles {
  id: number;
  username: string;
  fullName: string | null;
  siteName: string;
  roles: string[];
  roleIds: number[];
}

const UserRoleListPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // For now, reuse the common user list but we might need a specific endpoint later
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Gán quyền nhân viên</h1>
          <p>Quản lý vai trò được gán cho từng nhân viên trong hệ thống</p>
        </div>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Chi nhánh</th>
                  <th>Vai trò hiện tại</th>
                  <th style={{ width: 120 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
                        <div>
                          <div className={styles.fullName}>{user.fullName || user.username}</div>
                          <div className={styles.username}>@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.siteName}</td>
                    <td>
                      <div className={styles.roleBadges}>
                        {user.roles?.map(role => (
                          <span key={role} className={styles.roleBadge}>{role}</span>
                        )) || <span className={styles.noRole}>Chưa gán vai trò</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/user-roles/users/${user.id}/roles`)}>
                          <Icon name="Shield" size={14} />
                          Gán vai trò
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/user-roles/users/${user.id}/permissions`)}>
                          <Icon name="UserCheck" size={14} />
                          Quyền trực tiếp
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRoleListPage;
