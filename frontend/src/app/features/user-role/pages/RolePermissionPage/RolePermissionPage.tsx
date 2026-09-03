import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataScope, parseDataScope, type PermissionTreeNode, type RoleDetail } from '../../../../core/models/user-role.model';
import { userRoleService } from '../../../../core/services/user-role.service';
import PermissionTreeCheckbox from '../../../../shared/ui/PermissionTreeCheckbox/PermissionTreeCheckbox';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './RolePermissionPage.module.scss';

const RolePermissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roleId = Number(id);

  const [role, setRole] = useState<RoleDetail | null>(null);
  const [tree, setTree] = useState<PermissionTreeNode[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Map<number, DataScope>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [roleRes, treeRes] = await Promise.all([
          userRoleService.getRoleById(roleId),
          userRoleService.getPermissionTree(),
        ]);

        if (roleRes.success && roleRes.data) {
          setRole(roleRes.data);
          const selection = new Map<number, DataScope>();
          roleRes.data.permissions.forEach(p => {
            selection.set(Number(p.permissionId), parseDataScope(p.dataScope));
          });
          setSelectedPermissions(selection);
        }

        if (treeRes.success && treeRes.data) {
          setTree(treeRes.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roleId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissions = Array.from(selectedPermissions.entries()).map(([id, scope]) => ({
        permissionId: id,
        dataScope: scope,
      }));
      const response = await userRoleService.assignPermissions(roleId, permissions);
      if (response.success) {
        alert('Lưu phân quyền thành công');
        navigate(`/user-roles/roles/${roleId}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!role) return <div className={styles.error}>Không tìm thấy vai trò.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={styles.backBtn} onClick={() => navigate(`/user-roles/roles/${roleId}`)}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1>Phân quyền vai trò</h1>
            <p>Thiết lập quyền hạn cho: <strong>{role.name}</strong></p>
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate(`/user-roles/roles/${roleId}`)}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving || role.isSystem}>
            <Icon name="Save" size={18} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.infoCard}>
          <Icon name="Info" size={20} className={styles.infoIcon} />
          <p>
            Chọn các chức năng và phạm vi dữ liệu tương ứng. 
            <strong> Toàn công ty</strong>: Xem toàn bộ dữ liệu. 
            <strong> Theo site</strong>: Chỉ dữ liệu thuộc chi nhánh. 
            <strong> Cá nhân</strong>: Chỉ dữ liệu do bản thân tạo.
          </p>
        </div>

        <div className={styles.treeWrapper}>
          <PermissionTreeCheckbox
            tree={tree}
            selectedPermissions={selectedPermissions}
            onChange={setSelectedPermissions}
            readOnly={role.isSystem}
          />
        </div>
      </div>
    </div>
  );
};

export default RolePermissionPage;
