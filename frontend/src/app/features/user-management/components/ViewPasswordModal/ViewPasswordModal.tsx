import { useEffect, useState } from 'react';
import { Modal } from '../../../../shared/ui/Modal/Modal';
import { Button } from '../../../../shared/ui/Button/Button';
import { userService } from '../../services/user.service';
import styles from '../UserFormModal/UserFormModal.module.scss'; // Re-use styles
import { Eye, EyeOff, Copy } from 'lucide-react';

interface ViewPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  username?: string;
}

export const ViewPasswordModal = ({ isOpen, onClose, userId, username }: ViewPasswordModalProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPlain, setShowPlain] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchPassword = async () => {
        setLoading(true);
        setError('');
        setNoData(false);
        try {
          const response = await userService.getPassword(userId);
          if (response.success) {
            if (response.data) {
              setPassword(response.data);
            } else {
              setNoData(true);
              setPassword('');
            }
          } else {
            setError(response.error?.message || 'Có lỗi xảy ra khi lấy mật khẩu');
          }
        } catch (err) {
          setError('Lỗi kết nối máy chủ');
        } finally {
          setLoading(false);
        }
      };
      fetchPassword();
    } else {
      setPassword('');
      setNoData(false);
    }
  }, [isOpen, userId]);

  const handleCopy = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      alert('Đã sao chép mật khẩu');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Xem mật khẩu - ${username}`}
      width="400px"
    >
      <div className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.centerText}>Đang tải mật khẩu...</div>
        ) : noData ? (
          <div className={styles.warningCard}>
            <strong>Chưa có dữ liệu mật khẩu.</strong><br />
            Tài khoản này được tạo trước khi có tính năng đồng bộ mật khẩu. 
            Hãy <strong>đặt lại mật khẩu</strong> cho tài khoản này để hệ thống lưu lại mật khẩu mới.
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label>Mật khẩu hiện tại</label>
            <div className={styles.passwordRow}>
              <input 
                type={showPlain ? "text" : "password"} 
                value={password} 
                readOnly
              />
              <Button type="button" onClick={() => setShowPlain(!showPlain)} variant="secondary">
                {showPlain ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              <Button type="button" onClick={handleCopy} variant="outline" disabled={!password}>
                <Copy size={16} />
              </Button>
            </div>
          </div>
        )}

        <div className={`${styles.actions} ${styles.marginTopMd}`}>
          <Button type="button" onClick={onClose} variant="secondary">Đóng</Button>
        </div>
      </div>
    </Modal>
  );
};

