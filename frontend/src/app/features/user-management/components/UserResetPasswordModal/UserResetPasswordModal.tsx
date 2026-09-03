import React, { useState } from 'react';
import { Modal } from '../../../../shared/ui/Modal/Modal';
import { Button } from '../../../../shared/ui/Button/Button';
import { userService } from '../../services/user.service';
import styles from '../UserFormModal/UserFormModal.module.scss'; // Re-use styles

interface UserResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  username?: string;
}

export const UserResetPasswordModal = ({ isOpen, onClose, userId, username }: UserResetPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const response = await userService.resetPassword(userId, newPassword);
      if (response.success) {
        onClose();
        setNewPassword('');
        alert('Đã khôi phục mật khẩu thành công');
      } else {
        setError(response.error?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Khôi phục mật khẩu - ${username}`}
      width="400px"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <label>Mật khẩu mới</label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            placeholder="Nhập mật khẩu mới..."
            required 
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" onClick={onClose} variant="secondary">Hủy</Button>
          <Button type="submit" loading={loading}>Cập nhật</Button>
        </div>
      </form>
    </Modal>
  );
};
