import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User, GetUsersParams } from '../../models/user.model';
import { userService } from '../../services/user.service';
import { Button } from '../../../../shared/ui/Button/Button';
import { UserFormModal } from '../../components/UserFormModal/UserFormModal';
import { UserResetPasswordModal } from '../../components/UserResetPasswordModal/UserResetPasswordModal';
import { ViewPasswordModal } from '../../components/ViewPasswordModal/ViewPasswordModal';
import { ActiveSessionsModal } from '../../components/ActiveSessionsModal/ActiveSessionsModal';
import { Edit, Key, Trash2, UserPlus, RefreshCw, ShieldAlert, Monitor, Eye } from 'lucide-react';
import styles from './UserManagementPage.module.scss';

export const UserManagementPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<GetUsersParams>({ page: 1, pageSize: 20, keyword: '' });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [isViewPasswordOpen, setIsViewPasswordOpen] = useState(false);
  const [isActiveSessionsOpen, setIsActiveSessionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [targetSessionUserId, setTargetSessionUserId] = useState<number | undefined>(undefined);
  const [targetSessionUserName, setTargetSessionUserName] = useState<string | undefined>(undefined);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll(params);
      if (response.success) {
        setUsers(response.data.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [params]);

  const handleAdd = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = async (user: User) => {
    setLoading(true);
    try {
      const response = await userService.getById(user.id);
      if (response.success) {
        setSelectedUser(response.data);
        setIsFormOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPass = (user: User) => {
    setSelectedUser(user);
    setIsResetPassOpen(true);
  };

  const handleViewPassword = (user: User) => {
    setSelectedUser(user);
    setIsViewPasswordOpen(true);
  };

  const handleOpenUserSessions = (user?: User) => {
    if (user) {
      setTargetSessionUserId(user.id);
      setTargetSessionUserName(user.fullName || user.username);
    } else {
      setTargetSessionUserId(undefined);
      setTargetSessionUserName(undefined);
    }
    setIsActiveSessionsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('user.disable_confirm') || 'Bạn có chắc chắn muốn vô hiệu hóa tài khoản này?')) {
      const response = await userService.delete(id);
      if (response.success) {
        loadUsers();
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>{t('sidebar.module_user') || 'Quản lý tài khoản'}</h2>
          <p>{t('user.subtitle') || 'Danh sách nhân viên sử dụng hệ thống'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={() => handleOpenUserSessions()} icon={<ShieldAlert size={18} />}>
            Giám sát phiên đăng nhập
          </Button>
          <Button onClick={handleAdd} icon={<UserPlus size={18} />}>{t('user.add') || 'Thêm tài khoản'}</Button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <input 
            type="text" 
            placeholder={t('user.search_placeholder') || 'Tìm kiếm tài khoản, họ tên...'} 
            value={params.keyword}
            onChange={(e) => setParams({...params, keyword: e.target.value, page: 1})}
          />
        </div>
        <Button variant="secondary" onClick={loadUsers} icon={<RefreshCw size={18} />}>{t('common.refresh') || 'Làm mới'}</Button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>{t('common.loading') || 'Đang tải dữ liệu...'}</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('user.username') || 'Tên đăng nhập'}</th>
                  <th>{t('user.fullName') || 'Họ và tên'}</th>
                  <th>Máy nhánh SIP</th>
                  <th>{t('user.accountType') || 'Loại'}</th>
                  <th>{t('user.role') || 'Vai trò'}</th>
                  <th>Phòng ban CRM</th>
                  <th>{t('user.site') || 'Chi nhánh'}</th>
                  <th>{t('common.status') || 'Trạng thái'}</th>
                  <th style={{ textAlign: 'right' }}>{t('common.actions') || 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => (
                  <tr key={u.id} className={!u.isActive ? styles.inactiveRow : ''}>
                    <td className={styles.username}>{u.username}</td>
                    <td className={styles.fullName}>{u.fullName}</td>
                    <td>{u.sipUsername ? <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0284c7' }}>{u.sipUsername}</span> : <span style={{ color: '#94a3b8' }}>--</span>}</td>
                    <td>
                      <span className={`${styles.badge} ${u.accountType === 'Admin' ? styles.admin : styles.user}`}>
                        {u.accountType}
                      </span>
                    </td>
                    <td>
                      {u.roles && u.roles.length > 0 ? (
                        <span style={{ fontWeight: 500, color: '#334155' }}>{u.roles.join(', ')}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>--</span>
                      )}
                    </td>
                    <td>
                      {u.departmentName ? (
                        <span style={{ fontWeight: 500, color: '#334155' }}>{u.departmentName}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>--</span>
                      )}
                    </td>
                    <td>{u.siteName}</td>
                    <td>
                      <span className={`${styles.status} ${u.isActive ? styles.active : styles.inactive}`}>
                        {u.isActive ? (t('user.active') || 'Đang hoạt động') : (t('user.inactive') || 'Đã khóa')}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button onClick={() => handleOpenUserSessions(u)} title="Giám sát phiên & Đăng xuất từ xa"><Monitor size={16} /></button>
                      <button onClick={() => handleViewPassword(u)} title="Xem mật khẩu"><Eye size={16} /></button>
                      <button onClick={() => handleEdit(u)} title={t('common.edit') || 'Sửa thông tin'}><Edit size={16} /></button>
                      <button onClick={() => handleResetPass(u)} title={t('user.reset_password') || 'Đặt lại mật khẩu'}><Key size={16} /></button>
                      <button onClick={() => handleDelete(u.id)} title={t('user.disable') || 'Vô hiệu hóa'} className={styles.deleteBtn}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>{t('user.empty') || 'Không có dữ liệu người dùng'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={loadUsers} 
        user={selectedUser} 
      />
      
      <UserResetPasswordModal 
        isOpen={isResetPassOpen} 
        onClose={() => setIsResetPassOpen(false)} 
        userId={selectedUser?.id} 
        username={selectedUser?.username}
      />
      
      <ViewPasswordModal
        isOpen={isViewPasswordOpen}
        onClose={() => setIsViewPasswordOpen(false)}
        userId={selectedUser?.id}
        username={selectedUser?.username}
      />

      <ActiveSessionsModal
        isOpen={isActiveSessionsOpen}
        onClose={() => setIsActiveSessionsOpen(false)}
        userId={targetSessionUserId}
        userName={targetSessionUserName}
      />
    </div>
  );
};
