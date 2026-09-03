import { useState, useEffect } from 'react';
import { userSettingService } from '../../services/user-setting.service';
import { Settings, Server, Wrench, Shield, Save, CheckCircle, RefreshCw, PhoneCall } from 'lucide-react';
import styles from './SystemSettingsPage.module.scss';

interface ConfigItem {
  id: number;
  configKey: string;
  configValue: string;
  group?: string;
  description?: string;
  updatedAt: string;
}

interface ConfigGroup {
  groupName: string;
  items: ConfigItem[];
}

export const SystemSettingsPage = () => {
  const [groups, setGroups] = useState<ConfigGroup[]>([]);
  const [activeGroupName, setActiveGroupName] = useState<string>('System');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await userSettingService.getSystemConfigsGrouped();
      if (response.data.success && response.data.data) {
        const fetchedGroups = response.data.data;
        setGroups(fetchedGroups);

        const initialForm: Record<string, string> = {};
        fetchedGroups.forEach(g => {
          g.items.forEach(item => {
            initialForm[item.configKey] = item.configValue ?? '';
          });
        });
        setFormData(initialForm);

        if (fetchedGroups.length > 0 && !fetchedGroups.some(g => g.groupName === activeGroupName)) {
          setActiveGroupName(fetchedGroups[0].groupName);
        }
      }
    } catch (err) {
      console.error('Failed to load system configs:', err);
      setMessage({ type: 'error', text: 'Không thể tải danh sách cấu hình hệ thống.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const activeGroup = groups.find(g => g.groupName === activeGroupName);

  const handleSave = async () => {
    if (!activeGroup) return;
    setSaving(true);
    setMessage(null);

    try {
      const itemsToUpdate = activeGroup.items.map(item => ({
        configKey: item.configKey,
        configValue: formData[item.configKey] ?? ''
      }));

      const response = await userSettingService.updateSystemConfigs(itemsToUpdate);
      if (response.data.success && response.data.data) {
        // Cập nhật lại localStorage systemConfigs lập tức
        const currentLocalStorage = localStorage.getItem('systemConfigs');
        let existingMap = currentLocalStorage ? JSON.parse(currentLocalStorage) : {};
        const updatedMap = { ...existingMap, ...response.data.data };
        localStorage.setItem('systemConfigs', JSON.stringify(updatedMap));

        setMessage({ type: 'success', text: `Lưu cấu hình nhóm "${activeGroupName}" thành công!` });
        await fetchConfigs();
      } else {
        setMessage({ type: 'error', text: response.data.error?.message || 'Lưu cấu hình thất bại.' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: 'Đã xảy ra lỗi khi lưu cấu hình.' });
    } finally {
      setSaving(false);
    }
  };

  const getGroupIcon = (name: string) => {
    switch (name.toUpperCase()) {
      case 'SYSTEM': return <Settings size={18} />;
      case 'SMTP': return <Server size={18} />;
      case 'CALLCENTER': return <PhoneCall size={18} />;
      case 'BUSINESS': return <Wrench size={18} />;
      default: return <Shield size={18} />;
    }
  };

  const renderFieldInput = (item: ConfigItem) => {
    const key = item.configKey;
    const value = formData[key] ?? '';

    // Specialized renderers for System group
    if (key === 'system.timezone') {
      return (
        <select value={value} onChange={e => handleChange(key, e.target.value)}>
          <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
          <option value="UTC">UTC (GMT+0)</option>
          <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
          <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
          <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
        </select>
      );
    }

    if (key === 'system.date_format') {
      return (
        <select value={value} onChange={e => handleChange(key, e.target.value)}>
          <option value="DD/MM/YYYY">DD/MM/YYYY (Ví dụ: 31/12/2026)</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY (Ví dụ: 12/31/2026)</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD (Ví dụ: 2026-12-31)</option>
        </select>
      );
    }

    if (key === 'system.datetime_format') {
      return (
        <select value={value} onChange={e => handleChange(key, e.target.value)}>
          <option value="DD/MM/YYYY HH:mm">DD/MM/YYYY HH:mm (31/12/2026 14:30)</option>
          <option value="MM/DD/YYYY HH:mm">MM/DD/YYYY HH:mm (12/31/2026 14:30)</option>
          <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm (2026-12-31 14:30)</option>
        </select>
      );
    }

    if (key === 'system.time_format') {
      return (
        <select value={value} onChange={e => handleChange(key, e.target.value)}>
          <option value="HH:mm">HH:mm (24 giờ, Ví dụ: 14:30)</option>
          <option value="hh:mm A">hh:mm A (12 giờ, Ví dụ: 02:30 PM)</option>
        </select>
      );
    }

    if (key === 'smtp.enable_ssl' || key === 'callcenter.auto_close_popup' || key === 'callcenter.enable_wrap_up' || key === 'callcenter.enable_missed_call_task' || key === 'callcenter.enable_recall_reminder' || key === 'callcenter.enable_pitel_webhook') {
      return (
        <select value={value} onChange={e => handleChange(key, e.target.value)}>
          <option value="true">Bật (True)</option>
          <option value="false">Tắt (False)</option>
        </select>
      );
    }

    if (key === 'callcenter.fallback_routing_strategy') {
      return (
        <select value={value} onChange={e => handleChange(key, e.target.value)}>
          <option value="RoundRobin">Xoay vòng (RoundRobin)</option>
          <option value="Queue">Hàng đợi (Queue)</option>
          <option value="Extension">Máy nhánh (Extension)</option>
        </select>
      );
    }

    if (key === 'smtp.password' || key === 'callcenter.pitel_secret_key' || key === 'callcenter.api_key') {
      return (
        <input
          type="password"
          value={value}
          onChange={e => handleChange(key, e.target.value)}
          placeholder={`Nhập ${item.description || item.configKey}...`}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={e => handleChange(key, e.target.value)}
        placeholder={`Nhập ${item.description || item.configKey}...`}
      />
    );
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RefreshCw className="animate-spin" size={20} />
          <span>Đang tải cấu hình hệ thống...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cấu hình Hệ thống</h1>
          <p className={styles.subtitle}>Quản lý và điều chỉnh các thông số thiết lập toàn hệ thống CRM</p>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}
        >
          {message.type === 'success' && <CheckCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className={styles.contentLayout}>
        <div className={styles.groupList}>
          {groups.map(group => {
            const isActive = group.groupName === activeGroupName;
            return (
              <button
                key={group.groupName}
                type="button"
                className={`${styles.groupCard} ${isActive ? styles.active : ''}`}
                onClick={() => setActiveGroupName(group.groupName)}
              >
                <div className={styles.groupInfo}>
                  {getGroupIcon(group.groupName)}
                  <span className={styles.groupTitle}>{group.groupName}</span>
                </div>
                <span className={styles.countBadge}>{group.items.length} mục</span>
              </button>
            );
          })}
        </div>

        <div className={styles.detailPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Chi tiết Cấu hình — Nhóm {activeGroupName}</span>
          </div>

          {activeGroup ? (
            <>
              <div className={styles.formGrid}>
                {activeGroup.items.map(item => (
                  <div key={item.configKey} className={styles.fieldGroup}>
                    <label style={{ display: 'block', marginBottom: 6 }}>
                      {item.configKey === 'system.company_email_domain' ? (
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>
                          Cho phép sử dụng đuôi mail của công ty để thực hiện login vào hệ thống
                        </div>
                      ) : (
                        item.description || item.configKey
                      )}
                    </label>
                    <span className={styles.description}>Key: {item.configKey}</span>
                    {renderFieldInput(item)}
                  </div>
                ))}
              </div>

              <div className={styles.actionFooter}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 500,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
                </button>
              </div>
            </>
          ) : (
            <div>Vui lòng chọn một nhóm cấu hình.</div>
          )}
        </div>
      </div>
    </div>
  );
};
