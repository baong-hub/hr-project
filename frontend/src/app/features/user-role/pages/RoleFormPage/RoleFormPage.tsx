import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userRoleService } from '../../../../core/services/user-role.service';
import { authService } from '../../../../core/services/auth.service';
import type { RoleLevel } from '../../../../core/models/user-role.model';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './RoleFormPage.module.scss';

const RoleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const roleId = Number(id);

  const [formData, setFormData] = useState({
    name: '',
    level: 5, // Mặc định là Nhân viên
    description: '',
    isActive: true,
  });
  const [levels, setLevels] = useState<RoleLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = authService.getUser();
  const currentUserLevel = currentUser?.minRoleLevel ?? 5;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const levelsRes = await userRoleService.getRoleLevels();
        if (levelsRes.success) setLevels(levelsRes.data || []);

        if (isEdit) {
          const roleRes = await userRoleService.getRoleById(roleId);
          if (roleRes.success && roleRes.data) {
            setFormData({
              name: roleRes.data.name,
              level: roleRes.data.level,
              description: roleRes.data.description || '',
              isActive: roleRes.data.isActive,
            });
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await userRoleService.updateRole(roleId, formData);
        alert('Cập nhật vai trò thành công');
      } else {
        const response = await userRoleService.createRole(formData);
        if (response.success) {
          alert('Tạo vai trò thành công');
          navigate(`/user-roles/roles/${response.data}/permissions`);
          return;
        }
      }
      navigate('/user-roles/roles');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Bạn không có quyền thực hiện thao tác này');
      } else {
        setError(err.response?.data?.error?.message || 'Có lỗi xảy ra khi lưu vai trò');
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
          <button className={styles.backBtn} onClick={() => navigate('/user-roles/roles')}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1>{isEdit ? 'Sửa vai trò' : 'Thêm vai trò mới'}</h1>
        </div>
      </header>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorBanner}>
            <Icon name="AlertTriangle" size={20} />
            <span>{error}</span>
          </div>
        )}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Tên vai trò <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Nhân viên lễ tân"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Cấp độ <span className={styles.required}>*</span></label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
              required
            >
              {levels.map(lvl => (
                <option 
                  key={lvl.level} 
                  value={lvl.level}
                  disabled={lvl.level < currentUserLevel}
                >
                  {lvl.name} (Cấp {lvl.level}) {lvl.level < currentUserLevel ? '- Không được phép' : ''}
                </option>
              ))}
            </select>
            <p className={styles.fieldHelp}>Bạn chỉ có thể tạo/sửa vai trò có cấp thấp hơn hoặc bằng cấp của bạn ({currentUserLevel})</p>
          </div>

          <div className={styles.field}>
            <label>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả mục đích và phạm vi của vai trò này"
              rows={4}
            />
          </div>

          <div className={styles.fieldCheckbox}>
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive">Kích hoạt vai trò này</label>
          </div>

          <div className={styles.formActions}>
            <Button variant="secondary" type="button" onClick={() => navigate('/user-roles/roles')}>Hủy</Button>
            <Button type="submit" disabled={saving}>
              <Icon name="Save" size={18} />
              {saving ? 'Đang lưu...' : 'Lưu vai trò'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleFormPage;
