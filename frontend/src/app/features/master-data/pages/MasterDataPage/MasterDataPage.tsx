import { useState, useEffect, useMemo } from 'react';
import { masterDataService, type MasterDataItem } from '../../services/master-data.service';
import { Database, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './MasterDataPage.module.scss';

const CATEGORY_TYPES = [
  { key: 'Industry', label: 'Ngành nghề' },
  { key: 'Level', label: 'Cấp bậc' },
  { key: 'JobType', label: 'Loại hình công việc' },
  { key: 'WorkForm', label: 'Hình thức làm việc' },
  { key: 'SalaryRange', label: 'Mức lương' },
  { key: 'Location', label: 'Địa điểm' }
];

interface FormData {
  type: string;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: FormData = { type: '', code: '', name: '', description: '', sortOrder: 0, isActive: true };

export const MasterDataPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [activeType, setActiveType] = useState('Industry');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await masterDataService.getAll();
      if (res.data?.success) setItems(res.data.data || []);
    } catch (err) {
      console.error('Failed to load master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return items
      .filter(i => i.type === activeType)
      .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));
  }, [items, activeType, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...defaultForm, type: activeType });
    setShowModal(true);
  };

  const openEdit = (item: MasterDataItem) => {
    setEditingId(item.id);
    setForm({ type: item.type, code: item.code, name: item.name, description: item.description || '', sortOrder: item.sortOrder, isActive: item.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await masterDataService.update(editingId, form);
      } else {
        await masterDataService.create(form);
      }
      setShowModal(false);
      await fetchData();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await masterDataService.delete(id);
      await fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1><Database size={24} /> {t('sidebar.module_master_data', 'Danh mục dùng chung')}</h1>
      </div>

      <div className={styles.tabs}>
        {CATEGORY_TYPES.map(ct => (
          <button
            key={ct.key}
            className={`${styles.tab} ${activeType === ct.key ? styles.tabActive : ''}`}
            onClick={() => { setActiveType(ct.key); setSearch(''); }}
          >
            {ct.label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className={styles.searchInput}
            style={{ paddingLeft: 32 }}
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.btnAdd} onClick={openAdd}>
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Không có dữ liệu</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>Mô tả</th>
              <th>Thứ tự</th>
              <th>Trạng thái</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td><strong>{item.code}</strong></td>
                <td>{item.name}</td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.description || '—'}</td>
                <td>{item.sortOrder}</td>
                <td>
                  <span className={`${styles.badge} ${item.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                    {item.isActive ? 'Hoạt động' : 'Ẩn'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.btnIcon} onClick={() => openEdit(item)} title="Sửa">
                      <Pencil size={15} />
                    </button>
                    <button className={`${styles.btnIcon} ${styles.btnIconDanger}`} onClick={() => handleDelete(item.id)} title="Xóa">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
            <div className={styles.formGroup}>
              <label>Loại danh mục</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {CATEGORY_TYPES.map(ct => <option key={ct.key} value={ct.key}>{ct.label}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Mã</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: IT, FULLTIME..." />
            </div>
            <div className={styles.formGroup}>
              <label>Tên</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tên danh mục" />
            </div>
            <div className={styles.formGroup}>
              <label>Mô tả</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả (tùy chọn)" />
            </div>
            <div className={styles.formGroup}>
              <label>Thứ tự sắp xếp</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            {editingId && (
              <div className={styles.formGroup}>
                <label>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ marginRight: 8, width: 'auto' }} />
                  Hoạt động
                </label>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
              <button className={styles.btnSave} onClick={handleSave} disabled={saving || !form.code || !form.name}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
