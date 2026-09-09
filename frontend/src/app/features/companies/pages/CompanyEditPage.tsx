import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { companiesService } from '../../../core/services/companies.service';
import { authService } from '../../../core/services/auth.service';

export const CompanyEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine Company ID
  const currentUser = authService.getUser();
  const queryCompanyId = searchParams.get('companyId');
  const companyId = queryCompanyId ? Number(queryCompanyId) : currentUser?.companyId;

  // Form State
  const [name, setName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [sizeRange, setSizeRange] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [addresses, setAddresses] = useState<string[]>(['']);
  
  // Employer Branding States
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [officeGallery, setOfficeGallery] = useState<string>('');
  const [benefits, setBenefits] = useState<string>('');
  const [cultureHighlights, setCultureHighlights] = useState<string>('');
  const [companyFaqs, setCompanyFaqs] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sizeRanges = ['10-50', '50-100', '100-500', '500-1000', '1000+'];
  const industries = [
    'Công nghệ thông tin',
    'Tài chính / Ngân hàng',
    'Marketing / Quảng cáo',
    'Y tế / Sức khỏe',
    'Giáo dục / Đào tạo',
    'Bán lẻ / Tiêu dùng',
    'Khác',
  ];

  useEffect(() => {
    if (!companyId) {
      setError('Tài khoản của bạn chưa được liên kết với bất kỳ doanh nghiệp nào.');
      setLoading(false);
      return;
    }

    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await companiesService.getCompanyById(companyId);
        
        if (response.data.success && response.data.data) {
          const companyData = response.data.data;
          setName(companyData.name);
          setLogoUrl(companyData.logoUrl || '');
          setBannerUrl(companyData.bannerUrl || '');
          setDescription(companyData.description || '');
          setWebsite(companyData.website || '');
          setSizeRange(companyData.sizeRange);
          setIndustry(companyData.industry);
          setVideoUrl(companyData.videoUrl || '');
          if (companyData.officeGallery) {
            try {
              const parsed = JSON.parse(companyData.officeGallery);
              setOfficeGallery(Array.isArray(parsed) ? parsed.join('\n') : companyData.officeGallery);
            } catch {
              setOfficeGallery(companyData.officeGallery);
            }
          }
          setBenefits(companyData.benefits || '');
          setCultureHighlights(companyData.cultureHighlights || '');
          setCompanyFaqs(companyData.companyFaqs || '');
          
          if (companyData.address) {
            setAddresses(companyData.address.split('\n'));
          } else {
            setAddresses(['']);
          }
        } else {
          setError(response.data.error?.message || 'Không thể lấy thông tin doanh nghiệp.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Có lỗi xảy ra khi tải thông tin doanh nghiệp.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  const handleAddressChange = (index: number, value: string) => {
    const updated = [...addresses];
    updated[index] = value;
    setAddresses(updated);
  };

  const addAddress = () => {
    setAddresses([...addresses, '']);
  };

  const removeAddress = (index: number) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((_, i) => i !== index));
    } else {
      setAddresses(['']);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    // Validate
    if (!name.trim()) {
      alert('Tên doanh nghiệp không được để trống.');
      return;
    }
    if (!sizeRange) {
      alert('Vui lòng chọn quy mô nhân sự.');
      return;
    }
    if (!industry) {
      alert('Vui lòng chọn ngành nghề chính.');
      return;
    }

    const validAddresses = addresses.filter((a) => a.trim() !== '');
    if (validAddresses.length === 0) {
      alert('Vui lòng nhập ít nhất một địa điểm văn phòng.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updateData = {
        name: name.trim(),
        logoUrl: logoUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        sizeRange,
        industry,
        addressList: validAddresses.join('\n'), // joining list back for API
        benefits: benefits.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        officeGallery: officeGallery.trim() 
          ? JSON.stringify(officeGallery.split('\n').map(s => s.trim()).filter(Boolean)) 
          : undefined,
        cultureHighlights: cultureHighlights.trim() || undefined,
        companyFaqs: companyFaqs.trim() || undefined
      };

      const response = await companiesService.updateCompany(companyId, updateData);
      if (response.data.success) {
        alert('Cập nhật thông tin trang doanh nghiệp thành công!');
        navigate(`/companies/${companyId}`);
      } else {
        setError(response.data.error?.message || 'Có lỗi xảy ra khi lưu.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Không thể lưu thông tin doanh nghiệp.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-12) 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{
          border: '4px solid var(--color-border-default)',
          borderTop: '4px solid var(--color-brand-primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto var(--space-4)'
        }} />
        Đang tải biểu mẫu chỉnh sửa...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-6) var(--space-4) var(--space-12)', textAlign: 'left' }}>
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', margin: '0 0 var(--space-1)' }}>Cập Nhật Trang Doanh Nghiệp</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Xây dựng và nâng cao hình ảnh thương hiệu tuyển dụng của công ty bạn trên hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(companyId ? `/companies/${companyId}` : '/companies')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 'var(--font-weight-medium)',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          Hủy bỏ
        </button>
      </div>

      {error && (
        <div style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-danger)',
          marginBottom: 'var(--space-6)'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* CARD 1: BRAND IMAGES */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--space-6)'
        }}>
          <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--space-2)' }}>
            🖼️ Hình ảnh thương hiệu
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                Đường dẫn Logo công ty
              </label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box'
                }}
              />
              {logoUrl && (
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Xem trước Logo:</span>
                  <img src={logoUrl} alt="Logo Preview" style={{ width: '40px', height: '40px', objectFit: 'contain', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-sm)' }} onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                Đường dẫn Ảnh bìa (Banner)
              </label>
              <input
                type="text"
                placeholder="https://example.com/banner.jpg"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box'
                }}
              />
              {bannerUrl && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)' }}>Xem trước Banner:</span>
                  <div style={{ width: '100%', height: '80px', backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-default)' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: GENERAL INFO */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--space-6)'
        }}>
          <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--space-2)' }}>
            ℹ️ Thông tin chung
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                Tên doanh nghiệp <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                Quy mô nhân sự <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                value={sizeRange}
                onChange={(e) => setSizeRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  backgroundColor: 'var(--color-bg-card)',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Chọn quy mô --</option>
                {sizeRanges.map((sz) => (
                  <option key={sz} value={sz}>{sz} nhân viên</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                Ngành nghề chính <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  backgroundColor: 'var(--color-bg-card)',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Chọn ngành nghề --</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                Link Website
              </label>
              <input
                type="text"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: DESCRIPTION & LOCATIONS */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--space-6)'
        }}>
          <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--space-2)' }}>
            📝 Mô tả & Địa điểm
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                Giới thiệu chi tiết doanh nghiệp
              </label>
              <textarea
                placeholder="Mô tả chi tiết về lịch sử thành lập, văn hóa doanh nghiệp..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Branch offices */}
            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                📍 Danh sách địa chỉ văn phòng <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {addresses.map((addr, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      type="text"
                      placeholder={`Văn phòng chi nhánh ${idx + 1}`}
                      value={addr}
                      onChange={(e) => handleAddressChange(idx, e.target.value)}
                      style={{
                        flexGrow: 1,
                        padding: '10px 12px',
                        border: '1px solid var(--color-border-strong)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-base)',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeAddress(idx)}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--color-danger-bg)',
                        color: 'var(--color-danger)',
                        border: '1px solid var(--color-danger)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addAddress}
                style={{
                  marginTop: 'var(--space-3)',
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-brand-primary-soft)',
                  color: 'var(--color-brand-primary-dark)',
                  border: '1px solid var(--color-brand-primary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 'var(--font-weight-medium)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                + Thêm địa điểm
              </button>
            </div>
          </div>
        </div>

        {/* CARD 4: EMPLOYER BRANDING & CAREERS PORTAL */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-sm)',
          padding: 'var(--space-6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-default)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
              🌟 Thương hiệu & Cổng Tuyển Dụng (Employer Branding & Careers Portal)
            </h3>
            {companyId && (
              <a 
                href={`/companies/${companyId}/careers`} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
              >
                🚀 Xem Cổng Tuyển Dụng Thực Tế ↗
              </a>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                🎥 Video giới thiệu văn hóa công ty (YouTube / MP4 URL)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Video xuất hiện trang trọng ở mục Tiêu điểm văn hóa giúp tăng 40-60% tỷ lệ nộp đơn.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                🖼️ Hình ảnh văn phòng & Môi trường làm việc (Mỗi dòng một link URL ảnh)
              </label>
              <textarea
                placeholder="https://example.com/office-1.jpg&#10;https://example.com/pantry-2.jpg&#10;https://example.com/teambuilding.jpg"
                value={officeGallery}
                onChange={(e) => setOfficeGallery(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Hình ảnh không gian làm việc thực tế, góc pantry, phòng họp sáng tạo và hoạt động teambuilding.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                🎁 Lợi ích & Chế độ đãi ngộ bổ sung (Benefits)
              </label>
              <textarea
                placeholder="Ví dụ: Thưởng tháng 13, Gói bảo hiểm sức khỏe Bảo Việt, Khám sức khỏe định kỳ, Du lịch 5 sao..."
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 32px',
              backgroundColor: 'var(--color-brand-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 'var(--font-weight-bold)',
              fontSize: 'var(--font-size-base)',
              boxShadow: 'var(--shadow-md)',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Đang lưu thông tin...' : 'Lưu thông tin trang'}
          </button>
        </div>
      </form>
    </div>
  );
};
