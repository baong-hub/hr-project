import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userRoleService } from '../../../../core/services/user-role.service';
import api from '../../../../core/services/api.service';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import type { RoleDetail } from '../../../../core/models/user-role.model';
import type { User } from '../../../../features/user-management/models/user.model';
import styles from './RoleUserAssignmentPage.module.scss';

const RoleUserAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roleId = Number(id);

  const [role, setRole] = useState<RoleDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roleRes, usersRes] = await Promise.all([
          userRoleService.getRoleById(roleId),
          api.get('/users?pageSize=100'),
        ]);

        if (roleRes.success && roleRes.data) {
          setRole(roleRes.data);
        }

        if (usersRes.data.success) {
          const allUsers = usersRes.data.data.items as User[];
          setUsers(allUsers);
          
          // Pre-select users who already have this role
          const initiallySelected = allUsers
            .filter(user => user.roleIds?.includes(roleId))
            .map(user => user.id);
          setSelectedUserIds(initiallySelected);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roleId]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(lowerSearch) || 
      u.fullName?.toLowerCase().includes(lowerSearch)
    );
  }, [users, searchTerm]);

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await userRoleService.assignUsers(roleId, selectedUserIds);
      if (response.success) {
        alert('Gán nhân viên thành công');
        navigate('/user-roles/roles');
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Có lỗi xảy ra khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!role) return <div className={styles.loading}>Không tìm thấy vai trò.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={styles.backBtn} onClick={() => navigate('/user-roles/roles')}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1>Gán nhân viên cho vai trò: {role.name}</h1>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/user-roles/roles')}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving} loading={saving}>
            <Icon name="Save" size={18} />
            Lưu thay đổi
          </Button>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Icon name="Search" size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhân viên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.content}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th style={{ width: 50 }}>Chọn</th>
              <th>Nhân viên</th>
              <th>Chi nhánh</th>
              <th>Vai trò hiện tại</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr 
                key={user.id} 
                className={`${styles.userRow} ${selectedUserIds.includes(user.id) ? styles.selected : ''}`}
                onClick={() => handleToggleUser(user.id)}
              >
                <td>
                  <div className={`${styles.checkbox} ${selectedUserIds.includes(user.id) ? styles.checked : ''}`}>
                    {selectedUserIds.includes(user.id) && <Icon name="Check" size={14} />}
                  </div>
                </td>
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
                  {user.roles?.join(', ') || <span style={{ color: 'var(--color-text-muted)' }}>Chưa gán</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleUserAssignmentPage;
