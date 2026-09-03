import React, { useState, useEffect } from 'react';
import { 
  MapPin, Globe, Users, 
  RotateCcw, Search, Pencil, Check, X, ShieldCheck, ArrowLeft 
} from 'lucide-react';
import { companiesService } from '../../../core/services/companies.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import styles from './CompaniesPage.module.scss';

export const CompaniesPage: React.FC = () => {
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const isEmployer = roles.includes('Nhà tuyển dụng');
  const isSuperAdmin = roles.includes('Super Admin') || user?.username === 'admin';

  // State
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    id: 0,
    name: '',
    logoUrl: '',
    bannerUrl: '',
    description: '',
    website: '',
    sizeRange: '',
    industry: '',
    addressList: ''
  });

  // Fetch Companies
  const fetchCompanies = async (kw?: string) => {
    setLoading(true);
    try {
      const res = await companiesService.getCompanies({ search: kw });
      if (res.data?.success && res.data.data) {
        const list = res.data.data.items || [];
        setCompanies(list);

        // If employer, auto select their company for editing
        if (isEmployer) {
          // Employer's company is typically ID 1 or the one associated with user.companyId
          const employerCompId = user?.companyId || 1;
          const myComp = list.find((c: any) => c.id === employerCompId) || list[0];
          if (myComp) {
            setSelectedCompany(myComp);
            populateEditForm(myComp);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách doanh nghiệp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const populateEditForm = (comp: any) => {
    setEditForm({
      id: comp.id,
      name: comp.name,
      logoUrl: comp.logoUrl || '',
      bannerUrl: comp.bannerUrl || '',
      description: comp.description || '',
      website: comp.website || '',
      sizeRange: comp.sizeRange || '50-100 nhân viên',
      industry: comp.industry || 'Công nghệ thông tin',
      addressList: comp.addressList || 'Hà Nội'
    });
  };

  // Submit Company Updates
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await companiesService.updateCompany(editForm.id, editForm);
      if (res.data?.success) {
        setIsEditingMode(false);
        fetchCompanies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Approve Verification
  const handleVerifyCompany = async (id: number, isVerify: boolean) => {
    toast.success(isVerify ? 'Đã phê duyệt xác minh doanh nghiệp.' : 'Đã hủy xác minh doanh nghiệp.');
    fetchCompanies();
    if (selectedCompany && selectedCompany.id === id) {
      setSelectedCompany({ ...selectedCompany, isVerified: isVerify });
    }
  };

  const handleSelectCompanyDetail = (comp: any) => {
    setSelectedCompany(comp);
    populateEditForm(comp);
  };

  // RENDER 1: EMPLOYER MY COMPANY EDITOR
  if (isEmployer) {
    if (isEditingMode) {
      return (
        <div className={styles.companiesPage}>
          <div className={styles.titleArea}>
            <div>
              <h1>Cập nhật Trang Doanh Nghiệp</h1>
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                Chỉnh sửa thông tin giới thiệu công ty hiển thị tới ứng viên đi tìm việc
              </p>
            </div>
            <button className={styles.btnSecondary} onClick={() => setIsEditingMode(false)}><X size={16} /> Hủy</button>
          </div>

          <div className={styles.mainPanel} style={{ padding: '24px' }}>
            <form onSubmit={handleUpdateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.formGroup}>
                <label>Tên doanh nghiệp</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Đường dẫn Logo (URL)</label>
                  <input type="text" value={editForm.logoUrl} onChange={e => setEditForm({...editForm, logoUrl: e.target.value})} placeholder="/uploads/logos/logo.png" />
                </div>
                <div className={styles.formGroup}>
                  <label>Đường dẫn Banner (URL)</label>
                  <input type="text" value={editForm.bannerUrl} onChange={e => setEditForm({...editForm, bannerUrl: e.target.value})} placeholder="/uploads/banners/banner.png" />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Lĩnh vực hoạt động (Industry)</label>
                  <input type="text" required value={editForm.industry} onChange={e => setEditForm({...editForm, industry: e.target.value})} placeholder="Ví dụ: Công nghệ thông tin / Phần mềm" />
                </div>
                <div className={styles.formGroup}>
                  <label>Quy mô nhân sự (Size Range)</label>
                  <select value={editForm.sizeRange} onChange={e => setEditForm({...editForm, sizeRange: e.target.value})}>
                    <option value="10-50 nhân viên">10-50 nhân viên</option>
                    <option value="50-150 nhân viên">50-150 nhân viên</option>
                    <option value="150-500 nhân viên">150-500 nhân viên</option>
                    <option value="500+ nhân viên">500+ nhân viên</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Địa chỉ văn phòng</label>
                  <input type="text" required value={editForm.addressList} onChange={e => setEditForm({...editForm, addressList: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Trang web công ty (Website URL)</label>
                  <input type="url" value={editForm.website} onChange={e => setEditForm({...editForm, website: e.target.value})} placeholder="https://company.com" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Giới thiệu chi tiết doanh nghiệp</label>
                <textarea rows={6} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Viết mô tả ngắn gọn về sứ mệnh, môi trường làm việc, công nghệ sử dụng..."></textarea>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border-default)', paddingTop: '20px' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setIsEditingMode(false)}>Hủy</button>
                <button type="submit" className={styles.btnPrimary}><Check size={16} /> Lưu cấu hình</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.companiesPage}>
        {selectedCompany ? (
          <>
            {/* View profile details for Employer */}
            <div className={styles.titleArea}>
              <div>
                <h1>Trang cá nhân Doanh Nghiệp</h1>
                <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                  Trang giới thiệu công ty của bạn hiển thị trên sàn tuyển dụng
                </p>
              </div>
              <button className={styles.btnPrimary} onClick={() => setIsEditingMode(true)}>
                <Pencil size={16} /> Chỉnh sửa trang công ty
              </button>
            </div>

            <div className={styles.companyDetailLayout}>
              {/* Main Panel */}
              <div className={styles.mainPanel}>
                <div className={styles.profileBanner}>
                  {selectedCompany.bannerUrl && <img src={selectedCompany.bannerUrl} alt="Banner" />}
                </div>
                <div className={styles.profileHeaderInfo}>
                  <div className={styles.profileLogo}>
                    <img src={selectedCompany.logoUrl || '/hr.png'} alt="Logo" />
                  </div>
                  <div className={styles.profileTitleBlock}>
                    <h2>
                      {selectedCompany.name}
                      {selectedCompany.isVerified && (
                        <span className={styles.verifiedBadge}><ShieldCheck size={12} style={{ marginRight: 2 }} /> Verified</span>
                      )}
                    </h2>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      🏢 {selectedCompany.industry}
                    </span>
                  </div>
                </div>
                
                <div className={styles.bodySection}>
                  <h3>Về chúng tôi</h3>
                  <p>{selectedCompany.description || 'Chưa cập nhật giới thiệu công ty.'}</p>
                </div>
              </div>

              {/* Sidebar Panel */}
              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Thông tin liên hệ</h3>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Quy mô</span>
                  <span className={styles.infoRowValue}><Users size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{selectedCompany.sizeRange}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoRowLabel}>Văn phòng</span>
                  <span className={styles.infoRowValue}><MapPin size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{selectedCompany.addressList}</span>
                </div>
                {selectedCompany.website && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoRowLabel}>Website</span>
                    <a href={selectedCompany.website} target="_blank" rel="noreferrer" className={styles.infoRowValue} style={{ color: 'var(--color-brand-primary)' }}>
                      <Globe size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> {selectedCompany.website}
                    </a>
                  </div>
                )}
                <div className={styles.infoRow} style={{ borderTop: '1px solid var(--color-border-default)', paddingTop: '12px', marginTop: '4px' }}>
                  <span className={styles.infoRowLabel}>Xác minh</span>
                  {selectedCompany.isVerified ? (
                    <span style={{ color: '#2e7d32', fontWeight: 600, fontSize: '13px' }}>✓ Đã xác minh tài khoản</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>⚠ Đang chờ xác minh</span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải thông tin doanh nghiệp...</div>
        )}
      </div>
    );
  }

  // RENDER 2: CANDIDATE BROWSER & ADMIN MODERATION
  if (selectedCompany) {
    return (
      <div className={styles.companiesPage}>
        <div className={styles.titleArea}>
          <button className={styles.btnSecondary} onClick={() => setSelectedCompany(null)}>
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
          {isSuperAdmin && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedCompany.isVerified ? (
                <button className={styles.btnSecondary} style={{ color: '#c62828', borderColor: '#fed7d7' }} onClick={() => handleVerifyCompany(selectedCompany.id, false)}>
                  Hủy xác minh
                </button>
              ) : (
                <button className={styles.btnPrimary} style={{ background: '#2e7d32' }} onClick={() => handleVerifyCompany(selectedCompany.id, true)}>
                  Phê duyệt xác minh
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.companyDetailLayout}>
          <div className={styles.mainPanel}>
            <div className={styles.profileBanner}>
              {selectedCompany.bannerUrl && <img src={selectedCompany.bannerUrl} alt="Banner" />}
            </div>
            <div className={styles.profileHeaderInfo}>
              <div className={styles.profileLogo}>
                <img src={selectedCompany.logoUrl || '/hr.png'} alt="Logo" />
              </div>
              <div className={styles.profileTitleBlock}>
                <h2>
                  {selectedCompany.name}
                  {selectedCompany.isVerified && (
                    <span className={styles.verifiedBadge}><ShieldCheck size={12} style={{ marginRight: 2 }} /> Verified</span>
                  )}
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  🏢 {selectedCompany.industry}
                </span>
              </div>
            </div>
            <div className={styles.bodySection}>
              <h3>Giới thiệu doanh nghiệp</h3>
              <p>{selectedCompany.description || 'Doanh nghiệp chưa cập nhật thông tin giới thiệu.'}</p>
            </div>
          </div>

          <div className={styles.sideCard}>
            <h3 className={styles.sideCardTitle}>Thông tin chung</h3>
            <div className={styles.infoRow}>
              <span className={styles.infoRowLabel}>Quy mô công ty</span>
              <span className={styles.infoRowValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} />{selectedCompany.sizeRange}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoRowLabel}>Địa điểm văn phòng</span>
              <span className={styles.infoRowValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} />{selectedCompany.addressList}</span>
            </div>
            {selectedCompany.website && (
              <div className={styles.infoRow}>
                <span className={styles.infoRowLabel}>Địa chỉ Website</span>
                <a href={selectedCompany.website} target="_blank" rel="noreferrer" className={styles.infoRowValue} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-brand-primary)' }}>
                  <Globe size={16} /> Trang chủ công ty
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.companiesPage}>
      {/* List companies view */}
      <div className={styles.titleArea}>
        <div>
          <h1>Tra cứu Doanh nghiệp IT</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
            Tìm hiểu văn hóa công nghệ và các vị trí tuyển dụng mở tại các tập đoàn công nghệ hàng đầu
          </p>
        </div>
      </div>

      {/* Search company input */}
      <div className={styles.sideCard} style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '16px' }}>
        <input 
          type="text" 
          placeholder="Tìm công ty theo tên, lĩnh vực..." 
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--color-border-default)', borderRadius: '8px' }}
          onKeyDown={e => e.key === 'Enter' && fetchCompanies(searchKeyword)}
        />
        <button className={styles.btnPrimary} onClick={() => fetchCompanies(searchKeyword)}><Search size={16} /> Tìm kiếm</button>
        <button className={styles.btnSecondary} onClick={() => { setSearchKeyword(''); fetchCompanies(); }}><RotateCcw size={16} /></button>
      </div>

      <div className={styles.companyGrid}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Đang tải danh sách...</div>
        ) : companies.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Không tìm thấy doanh nghiệp nào.</div>
        ) : (
          companies.map(comp => (
            <div key={comp.id} className={styles.companyCard} onClick={() => handleSelectCompanyDetail(comp)}>
              <div className={styles.cardBanner}>
                {comp.bannerUrl && <img src={comp.bannerUrl} alt="Banner" className={styles.cardBannerImg} />}
                <div className={styles.logoContainer}>
                  <img src={comp.logoUrl || '/hr.png'} alt="Logo" />
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>
                  {comp.name}
                  {comp.isVerified && (
                    <span className={styles.verifiedBadge} title="Tài khoản chính thức"><ShieldCheck size={10} /></span>
                  )}
                </h3>
                <div className={styles.cardMeta}>
                  <span>🏢 {comp.industry}</span>
                  <span>📍 {comp.addressList}</span>
                </div>
                <p className={styles.cardDesc}>{comp.description || 'Chưa cập nhật giới thiệu công ty.'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default CompaniesPage;
