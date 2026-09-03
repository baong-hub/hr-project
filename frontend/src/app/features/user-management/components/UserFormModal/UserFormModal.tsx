import React, { useEffect, useState } from 'react';
import { Modal } from '../../../../shared/ui/Modal/Modal';
import { Button } from '../../../../shared/ui/Button/Button';
import type { User } from '../../models/user.model';
import { masterDataService } from '../../../../core/services/master-data.service';
import { MultiSelect } from '../../../../shared/ui/MultiSelect/MultiSelect';
import { userService } from '../../services/user.service';
import { authService } from '../../../../core/services/auth.service';
import { userRoleService } from '../../../../core/services/user-role.service';
import styles from './UserFormModal.module.scss';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user?: User; // If user is provided, it's Edit mode. Otherwise Create mode.
}

export const UserFormModal = ({ isOpen, onClose, onSave, user }: UserFormModalProps) => {
  const isEdit = !!user;
  const [formData, setFormData] = useState<any>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    accountType: 'User',
    siteId: '',
    accessibleSiteIds: [] as number[],
    roleIds: [] as number[],
    isActive: true,
  });
  const [sites, setSites] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '',
      });
      userService.getById(user.id).then(res => {
        if (res.success && res.data) {
          setFormData((prev: any) => ({
            ...prev,
            ...res.data,
            password: '',
          }));
        }
      });
    } else {
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        address: '',
        accountType: 'User',
        siteId: '',
        accessibleSiteIds: [] as number[],
        isActive: true,
      });
    }
    setError('');
    loadSites();
    loadRoles();
  }, [user, isOpen]);

  const loadRoles = async () => {
    try {
      const res = await userRoleService.getRoles({ pageSize: 100, isActive: true });
      if (res.success && res.data) {
        const currentUser = authService.getUser();
        const currentUserLevel = currentUser?.minRoleLevel ?? 5;

        // Gắn thêm thông tin isAllowed để UI xử lý
        const processedRoles = res.data.items.map((r: any) => ({
          ...r,
          isAllowed: r.level >= currentUserLevel
        }));

        setRoles(processedRoles);
      }
    } catch (e) {
      console.error('Failed to load roles', e);
    }
  };

  const loadSites = async () => {
    try {
      const res = await masterDataService.getSites();
      let allSites = res.data.data || [];

      const user = authService.getUser();
      if (user?.allowedSites && user.allowedSites.length > 0) {
        allSites = allSites.filter((s: any) => user.allowedSites.includes(s.id));
      }

      setSites(allSites);
    } catch (e) {
      console.error('Failed to load sites', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.username?.trim()) {
        setError('Vui lòng nhập Tên đăng nhập');
        setLoading(false);
        return;
      }

      if (!isEdit && !formData.password) {
        setError('Vui lòng nhập Mật khẩu');
        setLoading(false);
        return;
      }

      if (!formData.email?.trim()) {
        setError('Vui lòng nhập Email');
        setLoading(false);
        return;
      }

      if (!formData.roleIds || formData.roleIds.length === 0) {
        setError('Vui lòng chọn ít nhất một Vai trò');
        setLoading(false);
        return;
      }

      const defaultSiteId = Number(formData.siteId) || (sites.length > 0 ? sites[0].id : 1);
      const accessibleSiteIds = (formData.accessibleSiteIds && formData.accessibleSiteIds.length > 0)
        ? formData.accessibleSiteIds
        : [defaultSiteId];

      let response;
      if (isEdit) {
        response = await userService.update(user.id, {
          id: user.id,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          accountType: formData.accountType,
          siteId: defaultSiteId,
          accessibleSiteIds: accessibleSiteIds,
          roleIds: formData.roleIds,
          isActive: formData.isActive,
        });
      } else {
        response = await userService.create({
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.fullName,
          email: formData.email.trim(),
          phone: formData.phone,
          address: formData.address,
          accountType: formData.accountType,
          siteId: defaultSiteId,
          accessibleSiteIds: accessibleSiteIds,
          roleIds: formData.roleIds,
        });
      }

      if (response.success) {
        onSave();
        onClose();
      } else {
        setError(response.error?.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
      width="1000px"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        {/* Section 1: Thông tin tài khoản & Đăng nhập */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>1. Thông tin đăng nhập</h4>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Tên đăng nhập <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="username"
                value={formData.username || ''}
                onChange={handleChange}
                disabled={isEdit}
                required
                placeholder="Nhập tên đăng nhập..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mật khẩu {!isEdit && <span className={styles.required}>*</span>}</label>
              <input
                type="password"
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                required={!isEdit}
                placeholder={isEdit ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu...'}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Thông tin cá nhân */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>2. Thông tin cá nhân</h4>
          <div className={styles.row3}>
            <div className={styles.formGroup}>
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleChange}
                placeholder="Họ và tên..."
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email <span className={styles.required}>*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                required
                placeholder="example@domain.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="0912..."
              />
            </div>
          </div>
          <div className={styles.formGroup} style={{ marginTop: '8px' }}>
            <label>Địa chỉ</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              placeholder="Địa chỉ..."
            />
          </div>
        </div>

        {/* Section 3: Vai trò & Chi nhánh */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>3. Vai trò & Chi nhánh</h4>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Vai trò <span className={styles.required}>*</span></label>
              <MultiSelect
                options={roles.map(r => ({
                  id: r.id,
                  name: r.isAllowed ? r.name : `${r.name} (Cấp ${r.level} - Không được phép)`,
                  disabled: !r.isAllowed
                }))}
                selectedIds={formData.roleIds || []}
                onChange={(ids) => setFormData((prev: any) => ({ ...prev, roleIds: ids }))}
                placeholder="Chọn vai trò..."
              />
              <p className={styles.fieldHelp}>Bạn chỉ có thể gán các vai trò có cấp thấp hơn hoặc bằng cấp của bạn.</p>
            </div>

            <div className={styles.formGroup}>
              <label>Loại tài khoản</label>
              <select name="accountType" value={formData.accountType} onChange={handleChange}>
                <option value="Admin">Admin</option>
                <option value="User">Người dùng</option>
              </select>
            </div>
          </div>

          <div className={styles.row} style={{ marginTop: '8px' }}>
            <div className={styles.formGroup}>
              <label>Chi nhánh chính</label>
              <select name="siteId" value={formData.siteId} onChange={handleChange}>
                <option value="">-- Mặc định --</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Chi nhánh được truy cập</label>
              <MultiSelect
                options={sites.map(s => ({ id: s.id, name: s.name }))}
                selectedIds={formData.accessibleSiteIds || []}
                onChange={(ids) => setFormData((prev: any) => ({ ...prev, accessibleSiteIds: ids }))}
                placeholder="Chọn các chi nhánh..."
              />
            </div>
          </div>

          {isEdit && (
            <div className={styles.checkboxGroup} style={{ marginTop: '12px' }}>
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive">Kích hoạt tài khoản</label>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="button" onClick={onClose} variant="secondary">Hủy</Button>
          <Button type="submit" loading={loading}>Lưu thay đổi</Button>
        </div>
      </form>
    </Modal>
  );
};