import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataScope, parseDataScope, type PermissionTreeNode } from '../../../../core/models/user-role.model';
import { userRoleService } from '../../../../core/services/user-role.service';
import { userService } from '../../../../core/services/user.service';
import PermissionTreeCheckbox from '../../../../shared/ui/PermissionTreeCheckbox/PermissionTreeCheckbox';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './UserPermissionPage.module.scss';

const UserPermissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const [user, setUser] = useState<{ id: number; username: string; fullName: string | null } | null>(null);
  const [tree, setTree] = useState<PermissionTreeNode[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Map<number, DataScope>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, directPermsRes, treeRes] = await Promise.all([
          userService.getUserById(userId),
          userRoleService.getUserDirectPermissions(userId),
          userRoleService.getPermissionTree(),
        ]);

        if (userRes.data && userRes.data.success) {
          setUser(userRes.data.data);
        }

        if (directPermsRes.success && directPermsRes.data) {
          const selection = new Map<number, DataScope>();
          directPermsRes.data.forEach(p => {
            selection.set(Number(p.permissionId), parseDataScope(p.dataScope));
          });
          setSelectedPermissions(selection);
        }

        if (treeRes.success && treeRes.data) {
          setTree(treeRes.data);
        }
      } catch (error) {
        console.error('Failed to load user permissions data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissions = Array.from(selectedPermissions.entries()).map(([id, scope]) => ({
        permissionId: id,
        dataScope: scope,
      }));
      const response = await userRoleService.assignUserDirectPermissions(userId, permissions);
      if (response.success) {
        alert('Lưu phân quyền người dùng thành công');
        navigate('/user-roles/users');
      }
    } catch (error) {
      console.error('Failed to save user permissions:', error);
      alert('Đã xảy ra lỗi khi lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!user) return <div className={styles.error}>Không tìm thấy tài khoản người dùng.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={styles.backBtn} onClick={() => navigate('/user-roles/users')}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1>Phân quyền người dùng</h1>
            <p>Thiết lập quyền hạn trực tiếp cho: <strong>{user.fullName || user.username}</strong> (@{user.username})</p>
          </div>
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
        <div className={styles.infoCard}>
          <Icon name="Info" size={20} className={styles.infoIcon} />
          <p>
            Quyền được cấu hình tại đây là **Quyền riêng biệt** gán trực tiếp cho tài khoản này và sẽ hoạt động độc lập hoặc bổ sung vào các vai trò hiện có của người dùng.
            <br />
            <strong>Toàn công ty</strong>: Xem toàn bộ dữ liệu.
            <strong> Theo site</strong>: Chỉ dữ liệu thuộc chi nhánh.
            <strong> Cá nhân</strong>: Chỉ dữ liệu do bản thân tạo.
          </p>
        </div>

        <div className={styles.treeWrapper}>
          <PermissionTreeCheckbox
            tree={tree}
            selectedPermissions={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        </div>
      </div>
    </div>
  );
};

export default UserPermissionPage;
