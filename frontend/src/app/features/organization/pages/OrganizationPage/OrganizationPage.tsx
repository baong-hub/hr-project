import { useState, useEffect } from 'react';
import { organizationService, type DepartmentItem } from '../../services/organization.service';
import { Network, Plus, Pencil, Trash2, ChevronRight, ChevronDown, Building2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './OrganizationPage.module.scss';

interface FormData {
  code: string;
  name: string;
  description: string;
  parentId: number | null;
  managerUserId: number | null;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm: FormData = { code: '', name: '', description: '', parentId: null, managerUserId: null, sortOrder: 0, isActive: true };

export const OrganizationPage = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [allFlat, setAllFlat] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [treeRes, allRes] = await Promise.all([
        organizationService.getTree(),
        organizationService.getAll()
      ]);
      if (treeRes.data?.success) setDepartments(treeRes.data.data || []);
      if (allRes.data?.success) setAllFlat(allRes.data.data || []);
      // Expand all root nodes by default
      if (treeRes.data?.data) {
        setExpandedNodes(new Set(treeRes.data.data.map((d: DepartmentItem) => d.id)));
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAdd = (parentId?: number) => {
    setEditingId(null);
    setForm({ ...defaultForm, parentId: parentId || null });
    setShowModal(true);
  };

  const openEdit = (dept: DepartmentItem) => {
    setEditingId(dept.id);
    setForm({
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
      parentId: dept.parentId || null,
      managerUserId: dept.managerUserId || null,
      sortOrder: dept.sortOrder,
      isActive: dept.isActive
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await organizationService.update(editingId, form);
      } else {
        await organizationService.create(form);
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
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;
    try {
      await organizationService.delete(id);
      await fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const renderNode = (dept: DepartmentItem, level: number = 0) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expandedNodes.has(dept.id);
    const isRoot = level === 0;

    return (
      <div key={dept.id} className={styles.treeNode}>
        <div className={styles.nodeRow}>
          {hasChildren ? (
            <button className={styles.expandBtn} onClick={() => toggleExpand(dept.id)}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span style={{ width: 24, display: 'inline-block' }} />
          )}

          <div className={`${styles.nodeIcon} ${isRoot ? styles.nodeIconRoot : styles.nodeIconChild}`}>
            {isRoot ? <Building2 size={18} /> : <Users size={16} />}
          </div>

          <div className={styles.nodeInfo}>
            <div className={styles.nodeName}>{dept.name}</div>
            <div className={styles.nodeCode}>{dept.code}</div>
          </div>

          {dept.managerName && (
            <div className={styles.nodeManager}>
              <Users size={14} /> {dept.managerName}
            </div>
          )}

          <span className={`${styles.badge} ${dept.isActive ? styles.badgeActive : styles.badgeInactive}`}>
            {dept.isActive ? 'Hoạt động' : 'Ẩn'}
          </span>

          <div className={styles.nodeActions}>
            <button className={styles.btnIcon} onClick={() => openAdd(dept.id)} title="Thêm phòng ban con">
              <Plus size={15} />
            </button>
            <button className={styles.btnIcon} onClick={() => openEdit(dept)} title="Sửa">
              <Pencil size={15} />
            </button>
            <button className={`${styles.btnIcon} ${styles.btnIconDanger}`} onClick={() => handleDelete(dept.id)} title="Xóa">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className={styles.childrenContainer}>
            {dept.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1><Network size={24} /> {t('sidebar.module_crm_organization', 'Cơ cấu tổ chức')}</h1>
        <button className={styles.btnAdd} onClick={() => openAdd()}>
          <Plus size={16} /> Thêm phòng ban
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : departments.length === 0 ? (
        <div className={styles.empty}>Chưa có phòng ban nào. Nhấn "Thêm phòng ban" để bắt đầu.</div>
      ) : (
        <div className={styles.treeContainer}>
          {departments.map(dept => renderNode(dept))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{editingId ? 'Sửa phòng ban' : 'Thêm phòng ban mới'}</h3>
            <div className={styles.formGroup}>
              <label>Mã phòng ban</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: HR, IT, SALES..." />
            </div>
            <div className={styles.formGroup}>
              <label>Tên phòng ban</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tên phòng ban" />
            </div>
            <div className={styles.formGroup}>
              <label>Mô tả</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mô tả (tùy chọn)" />
            </div>
            <div className={styles.formGroup}>
              <label>Phòng ban cha</label>
              <select value={form.parentId ?? ''} onChange={e => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })}>
                <option value="">— Không (gốc) —</option>
                {allFlat.filter(d => d.id !== editingId).map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
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
