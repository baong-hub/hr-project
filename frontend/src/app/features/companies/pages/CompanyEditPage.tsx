import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { companiesService } from '../../../core/services/companies.service';
import { authService } from '../../../core/services/auth.service';
import styles from './CompanyEditPage.module.scss';
import { FormField } from '../../../shared/components/form-field/FormField';
import { IndustrySelect } from '../../../shared/components/search/IndustrySelect';

export const CompanyEditPage: React.FC = () => {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (!companyId) {
      setError(t('companies.empty_title', 'Tài khoản của bạn chưa được liên kết với bất kỳ doanh nghiệp nào.'));
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
          setName(companyData.name || '');
          setLogoUrl(companyData.logoUrl || '');
          setBannerUrl(companyData.bannerUrl || '');
          setDescription(companyData.description || '');
          setWebsite(companyData.website || '');
          setSizeRange(companyData.sizeRange || '');
          setIndustry(companyData.industry || '');
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
          setError(response.data.error?.message || t('companies.empty_title', 'Không thể lấy thông tin doanh nghiệp.'));
        }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || t('common.fail', 'Có lỗi xảy ra khi tải thông tin doanh nghiệp.'));
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId, t]);

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
      alert(t('companies.label_company_name', 'Tên doanh nghiệp không được để trống.'));
      return;
    }
    if (!sizeRange) {
      alert(t('companies.label_size_range', 'Vui lòng chọn quy mô nhân sự.'));
      return;
    }
    if (!industry) {
      alert(t('companies.label_industry', 'Vui lòng chọn ngành nghề chính.'));
      return;
    }

    const validAddresses = addresses.filter((a) => a.trim() !== '');
    if (validAddresses.length === 0) {
      alert(t('companies.label_office_addresses', 'Vui lòng nhập ít nhất một địa điểm văn phòng.'));
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
        addressList: validAddresses.join('\n'),
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
        alert(t('common.update_success', 'Cập nhật thông tin trang doanh nghiệp thành công!'));
        navigate(`/companies/${companyId}`);
      } else {
        setError(response.data.error?.message || t('common.fail', 'Có lỗi xảy ra khi lưu.'));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || t('common.fail', 'Không thể lưu thông tin doanh nghiệp.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        {t('common.loading', 'Đang tải biểu mẫu chỉnh sửa...')}
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1>{t('companies.edit_title', 'Cập Nhật Trang Doanh Nghiệp')}</h1>
          <p>
            {t('companies.edit_subtitle', 'Xây dựng và nâng cao hình ảnh thương hiệu tuyển dụng của công ty bạn trên hệ thống.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(companyId ? `/companies/${companyId}` : '/companies')}
          className={styles.btnCancel}
        >
          {t('common.cancel', 'Hủy bỏ')}
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* CARD 1: BRAND IMAGES */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {t('companies.card_brand_images', '🖼️ Hình ảnh thương hiệu')}
          </h3>
          <div className={styles.fieldGroupVertical}>
            <div>
              <FormField
                label={t('companies.label_logo_url', 'Đường dẫn Logo công ty')}
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              {logoUrl && (
                <div className={styles.logoPreviewRow}>
                  <span className={styles.previewLabel}>{t('common.show', 'Xem trước Logo')}:</span>
                  <img src={logoUrl} alt="Logo Preview" className={styles.logoImg} onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
              )}
            </div>

            <div>
              <FormField
                label={t('companies.label_banner_url', 'Đường dẫn Ảnh bìa (Banner)')}
                placeholder="https://example.com/banner.jpg"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
              />
              {bannerUrl && (
                <div className={styles.bannerPreviewBox}>
                  <span className={styles.previewLabel}>{t('common.show', 'Xem trước Banner')}:</span>
                  <img src={bannerUrl} alt="Banner Preview" className={styles.bannerImg} onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: GENERAL INFO */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {t('companies.card_general_info', 'ℹ️ Thông tin chung')}
          </h3>
          <div className={styles.fieldGroupGrid}>
            <div className={styles.colSpanFull}>
              <FormField
                label={t('companies.label_company_name', 'Tên doanh nghiệp')}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <FormField
                label={t('companies.label_size_range', 'Quy mô nhân sự')}
                required
                control="select"
                value={sizeRange}
                onChange={(e) => setSizeRange(e.target.value)}
                options={[
                  { value: '', label: t('common.select_empty', '-- Chọn quy mô --') },
                  ...sizeRanges.map((sz) => ({
                    value: sz,
                    label: `${sz} ${t('common.records', 'nhân viên')}`
                  }))
                ]}
              />
            </div>

            <div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {t('companies.label_industry', 'Ngành nghề chính')} <span className={styles.requiredStar}>*</span>
                </label>
                <IndustrySelect
                  inlineDisplay
                  value={industry}
                  placeholder={t('common.select_empty', '-- Chọn ngành nghề --')}
                  onChange={(_code, item) => setIndustry(item ? item.name : _code)}
                />
              </div>
            </div>

            <div className={styles.colSpanFull}>
              <FormField
                label={t('companies.label_website', 'Link Website')}
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: DESCRIPTION & LOCATIONS */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            {t('companies.card_desc_locations', '📝 Mô tả & Địa điểm')}
          </h3>
          <div className={styles.fieldGroupVertical}>
            <FormField
              label={t('companies.label_description', 'Giới thiệu chi tiết doanh nghiệp')}
              control="textarea"
              rows={6}
              placeholder={t('companies.label_description', 'Mô tả chi tiết về lịch sử thành lập, văn hóa doanh nghiệp...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Branch offices */}
            <div>
              <label className={styles.label}>
                {t('companies.label_office_addresses', '📍 Danh sách địa chỉ văn phòng')} <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.fieldGroupVertical}>
                {addresses.map((addr, idx) => (
                  <div key={idx} className={styles.addressRow}>
                    <input
                      type="text"
                      placeholder={`Văn phòng chi nhánh ${idx + 1}`}
                      value={addr}
                      onChange={(e) => handleAddressChange(idx, e.target.value)}
                      className={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => removeAddress(idx)}
                      className={styles.btnDeleteAddress}
                    >
                      {t('common.delete', 'Xóa')}
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addAddress}
                className={styles.btnAddAddress}
              >
                {t('companies.btn_add_address', '+ Thêm địa điểm')}
              </button>
            </div>
          </div>
        </div>

        {/* CARD 4: EMPLOYER BRANDING & CAREERS PORTAL */}
        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.cardTitle}>
              {t('companies.card_branding_portal', '🌟 Thương hiệu & Cổng Tuyển Dụng')}
            </h3>
            {companyId && (
              <a 
                href={`/companies/${companyId}/careers`} 
                target="_blank" 
                rel="noreferrer"
                className={styles.careersLink}
              >
                🚀 {t('companies.btn_explore_careers', 'Xem Cổng Tuyển Dụng Thực Tế')} ↗
              </a>
            )}
          </div>

          <div className={styles.fieldGroupVertical}>
            <FormField
              label={t('companies.label_video_url', '🎥 Video giới thiệu văn hóa công ty (YouTube / MP4 URL)')}
              placeholder="Ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />

            <FormField
              label={t('companies.label_office_gallery', '🖼️ Hình ảnh văn phòng & Môi trường làm việc (Mỗi dòng một link URL ảnh)')}
              control="textarea"
              rows={4}
              placeholder="https://example.com/office-1.jpg&#10;https://example.com/pantry-2.jpg&#10;https://example.com/teambuilding.jpg"
              value={officeGallery}
              onChange={(e) => setOfficeGallery(e.target.value)}
            />

            <FormField
              label={t('companies.label_benefits', '🎁 Lợi ích & Chế độ đãi ngộ bổ sung (Benefits)')}
              control="textarea"
              rows={3}
              placeholder="Ví dụ: Thưởng tháng 13, Gói bảo hiểm sức khỏe Bảo Việt, Khám sức khỏe định kỳ, Du lịch 5 sao..."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
            />
          </div>
        </div>

        {/* Form Action Footer */}
        <div className={styles.formFooter}>
          <button
            type="submit"
            disabled={saving}
            className={styles.btnSubmit}
          >
            {saving ? t('companies.saving_company', 'Đang lưu thông tin...') : t('companies.btn_save_company', 'Lưu thông tin trang')}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CompanyEditPage;
