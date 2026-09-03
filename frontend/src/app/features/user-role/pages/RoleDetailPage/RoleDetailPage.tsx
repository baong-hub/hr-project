import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RoleDetail, RoleChangeLog } from '../../../../core/models/user-role.model';
import { userRoleService } from '../../../../core/services/user-role.service';
import { Button } from '../../../../shared/ui/Button/Button';
import { Icon } from '../../../../shared/ui/Icon/Icon';
import styles from './RoleDetailPage.module.scss';

const RoleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roleId = Number(id);

  const [role, setRole] = useState<RoleDetail | null>(null);
  const [logs, setLogs] = useState<RoleChangeLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        const [roleRes, logsRes] = await Promise.all([
          userRoleService.getRoleById(roleId),
          userRoleService.getRoleLogs(roleId),
        ]);
        if (roleRes.success && roleRes.data) setRole(roleRes.data);
        if (logsRes.success && logsRes.data) setLogs(logsRes.data);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [roleId]);

  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (!role) return <div className={styles.error}>Không tìm thấy vai trò.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={styles.backBtn} onClick={() => navigate('/user-roles/roles')}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1>Chi tiết vai trò: {role.name}</h1>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate(`/user-roles/roles/${roleId}/edit`)} disabled={role.isSystem}>
            <Icon name="Edit" size={18} />
            Sửa thông tin
          </Button>
          <Button onClick={() => navigate(`/user-roles/roles/${roleId}/permissions`)} disabled={role.isSystem}>
            <Icon name="Shield" size={18} />
            Phân quyền
          </Button>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.section}>
            <h3>Thông tin chung</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Cấp độ</label>
                <p><strong>{role.levelName || `Cấp ${role.level}`}</strong> (Mức {role.level})</p>
              </div>
              <div className={styles.infoItem}>
                <label>Mô tả</label>
                <p>{role.description || 'Không có mô tả'}</p>
              </div>
              <div className={styles.infoItem}>
                <label>Trạng thái</label>
                <span className={`${styles.badge} ${role.isActive ? styles.active : styles.inactive}`}>
                  {role.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Ngày tạo</label>
                <p>{new Date(role.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Quyền hạn hiện tại ({role.permissions.length})</h3>
            <div className={styles.permList}>
              {[...role.permissions]
                .sort((a, b) => {
                  const modA = a.permissionCode.split(':')[0] || '';
                  const modB = b.permissionCode.split(':')[0] || '';
                  if (modA !== modB) return modA.localeCompare(modB);
                  return a.permissionId - b.permissionId;
                })
                .map(p => (
                  <div key={p.permissionId} className={styles.permItem}>
                    <span className={styles.permCode}>{p.permissionCode}</span>
                    <span className={styles.permScope}>
                      {p.dataScope.toString() === '1' || p.dataScope.toString() === 'ALL' ? 'Toàn công ty' : 
                       p.dataScope.toString() === '2' || p.dataScope.toString() === 'SITE' ? 'Theo site' : 
                       'Cá nhân'}
                    </span>
                  </div>
                ))}
              {role.permissions.length === 0 && <p className={styles.empty}>Chưa được phân quyền.</p>}
            </div>
          </section>
        </div>

        <div className={styles.sidebar}>
          <section className={styles.section}>
            <h3>Lịch sử thay đổi</h3>
            <div className={styles.logTimeline}>
              {logs.map(log => (
                <div key={log.id} className={styles.logItem}>
                  <div className={styles.logDot}></div>
                  <div className={styles.logContent}>
                    <div className={styles.logHeader}>
                      <span className={styles.logAction}>{log.action}</span>
                      <span className={styles.logTime}>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.logUser}>bởi @{log.username}</div>
                    {log.newValue && <div className={styles.logValue}>Mới: {log.newValue}</div>}
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p className={styles.empty}>Chưa có lịch sử.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RoleDetailPage;
