import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Download, RotateCcw, Trash2, 
  FileText, Upload, Star, Loader2, CheckCircle2,
  Eye, ExternalLink, Edit3
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cvsService } from '../../../core/services/cvs.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import styles from './CvsPage.module.scss';
import { FormField } from '../../../shared/components/form-field/FormField';
import { Modal } from '../../../shared/components/modal/Modal';

export const CvsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isEmployer = isAuthenticated && (
    roles.includes('Nhà tuyển dụng') ||
    roles.includes('Employer') ||
    userRole === 'EMPLOYER' ||
    userRole === 'Company'
  );
  const isCandidate = isAuthenticated && !isEmployer;

  // Candidate states
  const [cvs, setCvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBuilderMode, setIsBuilderMode] = useState(!isAuthenticated);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'creative'>('classic');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewCv, setPreviewCv] = useState<any | null>(null);
  const [editingCvId, setEditingCvId] = useState<number | null>(null);
  const [editingCvTitle, setEditingCvTitle] = useState<string>('');
  const cvPrintRef = useRef<HTMLDivElement>(null);

  // Candidate Profile Skills & Visibility state
  const [skillsText, setSkillsText] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');

  // CV Builder Wizard Form State
  const [cvForm, setCvForm] = useState({
    fullName: user?.fullName || 'Nguyễn Văn An',
    email: user?.email || 'an.nv@gmail.com',
    phone: user?.phone || '0987654321',
    jobTitle: 'Senior React Developer',
    summary: 'Lập trình viên Frontend có 3 năm kinh nghiệm phát triển ứng dụng React, TypeScript. Đam mê tối ưu hóa hiệu suất ứng dụng và UX/UI.',
    // Single entry for simplicity in mockup UI
    company: 'Công ty Công nghệ ABC',
    position: 'Frontend Developer',
    duration: '2023 - Nay',
    expDesc: 'Phát triển hệ thống Dashboard tuyển dụng, quản lý Leads cho dự án CRM.\nTối ưu hóa tốc độ tải trang giảm 40% bằng React.lazy và Webpack split chunks.',
    // Education
    school: 'Đại học Bách Khoa Hà Nội',
    major: 'Công nghệ thông tin',
    eduDuration: '2019 - 2023',
    // Skills
    skills: 'React, TypeScript, Node.js, Redux, HTML5, CSS3, SCSS, Git',
    cert: 'AWS Certified Cloud Practitioner, IELTS 6.5'
  });

  // Employer search state
  const [searchKeyword, setSearchKeyword] = useState('');

  // Fetch CV List
  const fetchCvs = async () => {
    if (!isAuthenticated) {
      setIsBuilderMode(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isCandidate) {
        const res = await cvsService.getCvs();
        if (res.success) {
          setCvs(res.data || []);
        }
      } else if (isEmployer) {
        const res = await cvsService.searchCandidates({ search: searchKeyword });
        if (res.success) {
          setCvs((res.data as any) || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
    
    // Sync candidate skills text if user is candidate
    if (isCandidate) {
      const u = authService.getUser();
      setSkillsText(u?.skills || 'React, TypeScript, Node.js');
      setExperienceSummary(u?.experienceSummary || '3 năm kinh nghiệm phát triển web.');
      setVisibility(u?.visibilityStatus || 'PUBLIC');
    }
  }, []);

  // Close preview modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewCv) {
        setPreviewCv(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewCv]);

  // Render CV Quick Preview Modal
  const renderPreviewModal = () => {
    if (!previewCv) return null;

    return (
      <Modal
        isOpen={Boolean(previewCv)}
        onClose={() => setPreviewCv(null)}
        size="lg"
        title={
          <div className={styles.modalHeaderTitle}>
            <FileText size={20} color="var(--color-primary)" />
            <span className={styles.previewModalCvTitle} title={previewCv.cvTitle}>
              {previewCv.cvTitle}
            </span>
            {(previewCv.isDefault || previewCv.isMain) && (
              <span className={styles.previewModalMainBadge}>
                <Star size={11} fill="currentColor" color="currentColor" /> CV chính
              </span>
            )}
          </div>
        }
        footer={
          previewCv.fileUrl ? (
            <div className={styles.modalHeaderActions}>
              <a 
                href={previewCv.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`${styles.btnSecondary} ${styles.modalActionBtnSmall}`}
                title="Mở toàn màn hình trong tab mới"
              >
                <ExternalLink size={14} />
                <span>Mở tab mới</span>
              </a>
              <a 
                href={previewCv.fileUrl} 
                download 
                className={`${styles.btnPrimary} ${styles.modalActionBtnSmall}`}
                title="Tải file về máy tính"
              >
                <Download size={14} />
                <span>Tải về</span>
              </a>
            </div>
          ) : undefined
        }
      >
        <div className={styles.modalBody}>
          {previewCv.fileUrl ? (
            <iframe 
              src={`${previewCv.fileUrl}#toolbar=1&navpanes=0`} 
              title={previewCv.cvTitle || 'CV Preview'} 
              className={styles.pdfFrame} 
            />
          ) : (
            <div className={styles.emptyPdfPreview}>
              <FileText size={48} opacity={0.6} />
              <p>Không tìm thấy đường dẫn file PDF trực tuyến.</p>
              <span>File này có thể được lưu trữ offline hoặc chưa được đồng bộ đường dẫn.</span>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // Update profile skills & visibility settings
  const handleUpdateProfileSettings = async () => {
    try {
      const res = await cvsService.updateProfile({
        skills: skillsText,
        experienceSummary,
        visibilityStatus: visibility as 'PUBLIC' | 'PRIVATE'
      });
      if (res.success) {
        toast.success('Cập nhật hồ sơ thành công.');
        // Refresh local storage user info
        await authService.getCurrentUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Set Main CV
  const handleSetMain = async (id: number) => {
    try {
      const res = await cvsService.setDefaultCv(id);
      if (res.success) {
        toast.success('Đã đặt làm CV chính thức thành công!');
        fetchCvs();
        if (previewCv && previewCv.id === id) {
          setPreviewCv({ ...previewCv, isMain: true });
        }
      } else {
        toast.error(res.error?.message || 'Không thể đặt làm CV chính.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi đặt làm CV chính.');
    }
  };

  // Delete CV
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa CV này?')) return;
    try {
      const res = await cvsService.deleteCv(id);
      if (res.success) {
        toast.success('Đã xóa CV thành công.');
        if (previewCv && previewCv.id === id) {
          setPreviewCv(null);
        }
        fetchCvs();
      } else {
        toast.error(res.error?.message || 'Không thể xóa CV.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi xóa CV.');
    }
  };

  // Mock Upload CV
  const handleMockUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập tài khoản ứng viên để tải lên hồ sơ CV.');
      navigate('/auth/login?redirect=%2Fcvs');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await cvsService.uploadCv(file.name, file);
      if (res.success) {
        toast.success('Tải lên CV thành công.');
        fetchCvs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to generate high-resolution A4 PDF
  const generateCvPdf = async (): Promise<{ blob: Blob; fileName: string }> => {
    const element = cvPrintRef.current;
    if (!element) {
      throw new Error('CV preview element not found');
    }

    const safeName = (cvForm.fullName || 'Ung_Vien').trim().replace(/[\s/\\?%*:|"<>]+/g, '_');
    const fileName = `CV_${safeName}_A4.pdf`;

    const canvas = await html2canvas(element, {
      scale: 2.5, // High DPI for crisp vector-like text
      useCORS: true,
      allowTaint: true,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-card').trim(),
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Additional pages if needed
    while (heightLeft > 5) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const blob = pdf.output('blob');
    return { blob, fileName };
  };

  // Check if CV is created with Builder
  const isBuilderCv = (cv: any) => {
    return cv.cvType === 'BUILDER' || (cv.cvTitle && cv.cvTitle.toLowerCase().includes('builder'));
  };

  // Start editing an existing Builder CV
  const handleEditBuilderCv = (cv: any) => {
    setEditingCvId(cv.id);
    setEditingCvTitle(cv.cvTitle);
    
    try {
      const savedDataStr = localStorage.getItem(`hr_cv_builder_data_${cv.id}`);
      if (savedDataStr) {
        const saved = JSON.parse(savedDataStr);
        if (saved.cvForm) setCvForm(saved.cvForm);
        if (saved.selectedTemplate) setSelectedTemplate(saved.selectedTemplate);
      } else {
        const lastGlobal = localStorage.getItem('hr_cv_builder_last');
        if (lastGlobal) {
          const saved = JSON.parse(lastGlobal);
          if (saved.cvForm) setCvForm(saved.cvForm);
          if (saved.selectedTemplate) setSelectedTemplate(saved.selectedTemplate);
        }
      }
    } catch (e) {
      console.error('Error loading CV draft:', e);
    }
    
    setIsBuilderMode(true);
    setCurrentStep(1);
  };

  // Start new builder flow
  const handleStartNewBuilder = () => {
    setEditingCvId(null);
    setEditingCvTitle('');
    setIsBuilderMode(true);
    setCurrentStep(1);
  };

  // Save CV Builder details to profile
  const handleSaveBuilderCv = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập tài khoản ứng viên để lưu trữ CV vào hệ thống.');
      navigate('/auth/login?redirect=%2Fcvs');
      return;
    }
    try {
      setIsSaving(true);
      let pdfFile: File;
      const safeName = (cvForm.fullName || 'Ung_Vien').trim().replace(/[\s/\\?%*:|"<>]+/g, '_');
      const cvTitle = editingCvId ? editingCvTitle : `CV_${safeName}_Builder.pdf`;

      if (cvPrintRef.current) {
        const { blob } = await generateCvPdf();
        pdfFile = new File([blob], cvTitle, { type: 'application/pdf' });
      } else {
        const dummyBlob = new Blob([`CV Content for ${cvForm.fullName}`], { type: 'application/pdf' });
        pdfFile = new File([dummyBlob], cvTitle, { type: 'application/pdf' });
      }

      const createRes = await cvsService.uploadCv(cvTitle, pdfFile, 'BUILDER');

      if (createRes.success) {
        const newCvId = createRes.data?.id;
        const dataToSave = JSON.stringify({ cvForm, selectedTemplate });
        localStorage.setItem('hr_cv_builder_last', dataToSave);
        if (newCvId) {
          localStorage.setItem(`hr_cv_builder_data_${newCvId}`, dataToSave);
        }

        // If editing an existing CV record, remove old record if separate ID
        if (editingCvId && newCvId && editingCvId !== newCvId) {
          await cvsService.deleteCv(editingCvId).catch(() => {});
          localStorage.removeItem(`hr_cv_builder_data_${editingCvId}`);
        }

        // Sync profile skills automatically
        await cvsService.updateProfile({
          skills: cvForm.skills,
          experienceSummary: `${cvForm.jobTitle} - ${cvForm.summary.slice(0, 80)}...`,
          visibilityStatus: 'PUBLIC'
        });
        
        toast.success(editingCvId ? 'Cập nhật và lưu CV thành công!' : 'Tạo và lưu CV thành công!');
        setIsBuilderMode(false);
        setEditingCvId(null);
        setEditingCvTitle('');
        fetchCvs();
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi lưu CV.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF file directly
  const handleDownloadPdf = async () => {
    if (!cvPrintRef.current) return;
    setIsExporting(true);
    try {
      toast.info('Đang khởi tạo bản in PDF A4 chất lượng cao...');
      const { blob, fileName } = await generateCvPdf();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Đã tải xuống file PDF A4 thành công!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Không thể xuất file PDF. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  // RENDER: CANDIDATE DASHBOARD
  if (isCandidate) {
    if (isBuilderMode) {
      return (
        <div className={styles.cvsPage}>
          {/* Header */}
          <div className={styles.builderHeader}>
            <div>
              <div className={styles.cvBuilderTitleHeader}>
                <h2>{editingCvId ? t('cvs.builder_edit_title', { title: editingCvTitle, defaultValue: `Chỉnh sửa: ${editingCvTitle}` }) : t('cvs.builder_title', 'Trình tạo CV thông minh (CV Builder)')}</h2>
                {editingCvId && (
                  <span className={styles.badgeCandidate}>
                    {t('cvs.builder_editing_badge', 'Đang chỉnh sửa')}
                  </span>
                )}
              </div>
              <p className={styles.subTextSecondary}>
                {editingCvId ? t('cvs.builder_edit_subtitle', 'Cập nhật, bổ sung thông tin và lưu lại bản thiết kế CV chuẩn A4') : t('cvs.builder_subtitle', 'Nhập thông tin cá nhân và xem trực tiếp CV mẫu chuẩn A4')}
              </p>
            </div>
            <button className={styles.btnSecondary} onClick={() => { setIsBuilderMode(false); setEditingCvId(null); setEditingCvTitle(''); }}>
              {editingCvId ? t('cvs.btn_cancel_edit', 'Hủy chỉnh sửa') : t('cvs.btn_exit', 'Thoát')}
            </button>
          </div>

          {/* Stepper Progress */}
          <div className={styles.stepper}>
            <div className={`${styles.step} ${currentStep === 1 ? styles.stepActive : currentStep > 1 ? styles.stepCompleted : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span>{t('cvs.step1', '1. Thông tin chung')}</span>
            </div>
            <div className={`${styles.step} ${currentStep === 2 ? styles.stepActive : currentStep > 2 ? styles.stepCompleted : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span>{t('cvs.step2', '2. Kinh nghiệm & Học vấn')}</span>
            </div>
            <div className={`${styles.step} ${currentStep === 3 ? styles.stepActive : currentStep > 3 ? styles.stepCompleted : ''}`}>
              <span className={styles.stepNumber}>3</span>
              <span>{t('cvs.step3', '3. Kỹ năng & Chứng chỉ')}</span>
            </div>
            <div className={`${styles.step} ${currentStep === 4 ? styles.stepActive : ''}`}>
              <span className={styles.stepNumber}>4</span>
              <span>{t('cvs.step4', '4. Mẫu & Tải về')}</span>
            </div>
          </div>

          {/* Builder Split Layout */}
          <div className={styles.builderSplitLayout}>
            {/* Left Column: Form inputs per step */}
            <div className={styles.builderFormCard}>
              {currentStep === 1 && (
                <>
                  <h3 className={styles.stepTitle}>{t('cvs.step1', 'Bước 1: Thông tin cá nhân')}</h3>
                  <FormField
                    label={t('cvs.full_name', 'Họ và tên')}
                    value={cvForm.fullName}
                    onChange={e => setCvForm({...cvForm, fullName: e.target.value})}
                  />
                  <div className={styles.formRow}>
                    <FormField
                      label={t('cvs.email', 'Email')}
                      type="email"
                      value={cvForm.email}
                      onChange={e => setCvForm({...cvForm, email: e.target.value})}
                      className={styles.flex1}
                    />
                    <FormField
                      label={t('cvs.phone', 'Số điện thoại')}
                      value={cvForm.phone}
                      onChange={e => setCvForm({...cvForm, phone: e.target.value})}
                      className={styles.flex1}
                    />
                  </div>
                  <FormField
                    label={t('cvs.job_title', 'Vị trí ứng tuyển mong muốn')}
                    value={cvForm.jobTitle}
                    onChange={e => setCvForm({...cvForm, jobTitle: e.target.value})}
                    placeholder="Ví dụ: Backend Developer"
                  />
                  <FormField
                    control="textarea"
                    label={t('cvs.summary', 'Tóm tắt năng lực (Giới thiệu bản thân)')}
                    rows={4}
                    value={cvForm.summary}
                    onChange={e => setCvForm({...cvForm, summary: e.target.value})}
                  />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h3 className={styles.stepTitle}>{t('cvs.step2', 'Bước 2: Kinh nghiệm làm việc')}</h3>
                  <FormField
                    label={t('cvs.company', 'Tên công ty')}
                    value={cvForm.company}
                    onChange={e => setCvForm({...cvForm, company: e.target.value})}
                  />
                  <div className={styles.formRow}>
                    <FormField
                      label={t('cvs.position', 'Vị trí / Chức danh')}
                      value={cvForm.position}
                      onChange={e => setCvForm({...cvForm, position: e.target.value})}
                      className={styles.flex1}
                    />
                    <FormField
                      label={t('cvs.duration', 'Thời gian (Bắt đầu - Kết thúc)')}
                      value={cvForm.duration}
                      onChange={e => setCvForm({...cvForm, duration: e.target.value})}
                      placeholder="Ví dụ: 2022 - Nay"
                      className={styles.flex1}
                    />
                  </div>
                  <FormField
                    control="textarea"
                    label={t('cvs.exp_desc', 'Mô tả chi tiết công việc')}
                    rows={6}
                    value={cvForm.expDesc}
                    onChange={e => setCvForm({...cvForm, expDesc: e.target.value})}
                  />
                </>
              )}

              {currentStep === 3 && (
                <>
                  <h3 className={styles.stepTitle}>{t('cvs.step3', 'Bước 3: Học vấn & Kỹ năng')}</h3>
                  <FormField
                    label={t('cvs.school', 'Trường học')}
                    value={cvForm.school}
                    onChange={e => setCvForm({...cvForm, school: e.target.value})}
                  />
                  <div className={styles.formRow}>
                    <FormField
                      label={t('cvs.major', 'Chuyên ngành')}
                      value={cvForm.major}
                      onChange={e => setCvForm({...cvForm, major: e.target.value})}
                      className={styles.flex1}
                    />
                    <FormField
                      label={t('cvs.edu_duration', 'Thời gian học')}
                      value={cvForm.eduDuration}
                      onChange={e => setCvForm({...cvForm, eduDuration: e.target.value})}
                      className={styles.flex1}
                    />
                  </div>
                  <FormField
                    label={t('cvs.skills', 'Kỹ năng chính (Phân tách bằng dấu phẩy)')}
                    value={cvForm.skills}
                    onChange={e => setCvForm({...cvForm, skills: e.target.value})}
                    placeholder="React, TypeScript, SQL, Node..."
                  />
                  <FormField
                    label={t('cvs.cert', 'Chứng chỉ & Ngôn ngữ')}
                    value={cvForm.cert}
                    onChange={e => setCvForm({...cvForm, cert: e.target.value})}
                  />
                </>
              )}

              {currentStep === 4 && (
                <>
                  <h3 className={styles.stepTitle}>{t('cvs.step4', 'Bước 4: Chọn mẫu CV & Hoàn tất')}</h3>
                  <div className={styles.formGroup}>
                    <label>Template</label>
                    <div className={styles.templatePickerRow}>
                      <button 
                        type="button" 
                        className={`${selectedTemplate === 'classic' ? styles.btnPrimary : styles.btnSecondary} ${styles.flex1}`}
                        onClick={() => setSelectedTemplate('classic')}
                      >
                        Classic Navy Blue
                      </button>
                      <button 
                        type="button" 
                        className={`${selectedTemplate === 'creative' ? styles.btnPrimary : styles.btnSecondary} ${styles.flex1}`}
                        onClick={() => setSelectedTemplate('creative')}
                      >
                        Creative Forest Green
                      </button>
                    </div>
                  </div>
                  <div className={styles.builderBtnGroup}>
                    <button 
                      className={`${styles.btnPrimary} ${styles.btnFullWidth}`} 
                      onClick={handleDownloadPdf}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 size={16} className={styles.spin} />
                          <span>{t('common.loading', 'Đang tải...')}</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>{t('cvs.btn_download_pdf', 'Tải xuống bản PDF A4')}</span>
                        </>
                      )}
                    </button>
                    <button 
                      className={`${styles.btnSecondary} ${styles.btnSaveGreen}`} 
                      onClick={handleSaveBuilderCv}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={16} className={styles.spin} />
                          <span>{t('cvs.saving_cv', 'Đang lưu CV...')}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>{t('cvs.btn_save_to_profile', 'Lưu vào hồ sơ ứng tuyển')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Stepper Navigation */}
              <div className={styles.builderFormActions}>
                <button 
                  className={styles.btnSecondary} 
                  disabled={currentStep === 1} 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  {t('cvs.btn_back', 'Quay lại')}
                </button>
                {currentStep < 4 ? (
                  <button 
                    className={styles.btnPrimary} 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                  >
                    {t('cvs.btn_next', 'Tiếp tục')}
                  </button>
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>

            {/* Right Column: CV A4 Live Preview mockup */}
            <div className={styles.cvPreviewCard}>
              <div className={styles.previewToolbar}>
                <h4>{t('cvs.live_preview', 'BẢN XEM TRƯỚC HỒ SƠ (LIVE PREVIEW)')}</h4>
                <span className={styles.templateSelectedBadge}>
                  A4 Size Layout
                </span>
              </div>
              <div ref={cvPrintRef} className={`${styles.a4Sheet} ${selectedTemplate === 'classic' ? styles.templateClassic : styles.templateCreative}`}>
                <div className={styles.cvHeader}>
                  <h2 className={styles.candidateName}>{cvForm.fullName || 'Tên của bạn'}</h2>
                  <div className={styles.candidateTitle}>{cvForm.jobTitle || 'Vị trí công việc'}</div>
                  <div className={styles.contactInfo}>
                    <span>📧 {cvForm.email}</span>
                    <span>📞 {cvForm.phone}</span>
                    <span>📍 Hà Nội, Việt Nam</span>
                  </div>
                </div>

                <div className={styles.cvBody}>
                  {cvForm.summary && (
                    <div>
                      <div className={styles.sectionTitle}>Giới thiệu</div>
                      <p className={styles.a4TextItem}>{cvForm.summary}</p>
                    </div>
                  )}

                  {(cvForm.company || cvForm.position) && (
                    <div>
                      <div className={styles.sectionTitle}>Kinh nghiệm làm việc</div>
                      <div className={styles.previewItem}>
                        <div className={styles.previewItemHeader}>
                          <span>{cvForm.position} - {cvForm.company}</span>
                          <span>{cvForm.duration}</span>
                        </div>
                        <div className={styles.previewItemDesc}>{cvForm.expDesc}</div>
                      </div>
                    </div>
                  )}

                  {(cvForm.school || cvForm.major) && (
                    <div>
                      <div className={styles.sectionTitle}>Học vấn</div>
                      <div className={styles.previewItem}>
                        <div className={styles.previewItemHeader}>
                          <span>{cvForm.school}</span>
                          <span>{cvForm.eduDuration}</span>
                        </div>
                        <div className={styles.previewItemSub}>{cvForm.major}</div>
                      </div>
                    </div>
                  )}

                  {cvForm.skills && (
                    <div>
                      <div className={styles.sectionTitle}>Kỹ năng chuyên môn</div>
                      <div className={styles.previewSkills}>
                        {cvForm.skills.split(',').map((skill, index) => (
                          <span key={index} className={styles.previewSkillTag}>{skill.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cvForm.cert && (
                    <div>
                      <div className={styles.sectionTitle}>Chứng chỉ & giải thưởng</div>
                      <p className={styles.a4TextItem}>{cvForm.cert}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Candidate View: List of CVs & Profile Settings
    return (
      <div className={styles.cvsPage}>
        {/* Title area */}
        <div className={styles.titleArea}>
          <div>
            <h1>{t('cvs.title', 'Quản lý Hồ sơ & CV cá nhân')}</h1>
            <p className={styles.subTextSecondary}>{t('cvs.subtitle', 'Tải lên các file CV hoặc khởi chạy trình tạo CV Builder chuẩn chuyên nghiệp')}</p>
          </div>
          <button className={styles.btnPrimary} onClick={handleStartNewBuilder}>
            {t('cvs.btn_builder', 'Tạo CV bằng Builder')}
          </button>
        </div>

        {/* Layout: List CV on left, Profile Settings on right */}
        <div className={styles.cvGrid}>
          {/* Left Column: CV List */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeaderCard}>
              {t('cvs.uploaded_table_title', 'HỒ SƠ CV ĐÃ TẢI LÊN / LƯU')}
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{t('cvs.col_file', 'File CV')}</th>
                    <th>{t('cvs.col_size', 'Dung lượng')}</th>
                    <th>{t('cvs.col_updated', 'Cập nhật')}</th>
                    <th>{t('cvs.col_main', 'CV chính')}</th>
                    <th className={styles.colActions}>{t('cvs.col_actions', 'Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className={styles.loadingCell}>{t('common.loading', 'Đang tải...')}</td></tr>
                  ) : cvs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyCell}>
                        {t('cvs.empty_cvs', 'Bạn chưa có CV nào. Hãy tạo mới hoặc tải file lên.')}
                      </td>
                    </tr>
                  ) : (
                    cvs.map(cv => {
                      const isMain = Boolean(cv.isDefault || cv.isMain);
                      const isBuiltWithBuilder = isBuilderCv(cv);
                      return (
                        <tr key={cv.id}>
                          <td className={styles.tdTitle}>
                            <div className={styles.cvTitleBox}>
                              <button
                                type="button"
                                className={styles.cvTitleLink}
                                onClick={() => setPreviewCv(cv)}
                                title={t('cvs.preview_online', 'Bấm để xem nhanh CV')}
                              >
                                <FileText size={16} className={styles.fileTextIcon} />
                                <span>{cv.cvTitle}</span>
                              </button>
                              {isBuiltWithBuilder && (
                                <span className={styles.mainBadgePill}>
                                  Builder
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{cv.fileSizeBytes ? `${(cv.fileSizeBytes / 1024).toFixed(0)} KB` : '—'}</td>
                          <td>{cv.createdAt ? cv.createdAt.split('T')[0] : '—'}</td>
                          <td>
                            {isMain ? (
                              <span className={styles.mainCvBadge}>
                                <Star size={12} fill="currentColor" color="currentColor" /> {t('cvs.is_main_badge', 'CV chính thức')}
                              </span>
                            ) : (
                              <button className={styles.btnSetMain} onClick={() => handleSetMain(cv.id)} title={t('cvs.set_main_btn', 'Đặt CV này làm hồ sơ nộp mặc định')}>
                                <Star size={12} />
                                <span>{t('cvs.set_main_btn', 'Đặt làm chính')}</span>
                              </button>
                            )}
                          </td>
                          <td className={styles.tdRight}>
                            <div className={`${styles.actionBtns} ${styles.actionBtnsRight}`}>
                              {isBuiltWithBuilder && (
                                <button
                                  type="button"
                                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                  onClick={() => handleEditBuilderCv(cv)}
                                  title={t('cvs.edit_cv_title', 'Chỉnh sửa / bổ sung nội dung CV (Builder)')}
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => setPreviewCv(cv)}
                                title={t('cvs.preview_online', 'Xem nhanh CV trực tuyến')}
                              >
                                <Eye size={14} />
                              </button>
                              <a href={cv.fileUrl} download className={styles.actionBtn} title={t('cvs.download_file', 'Tải file')}><Download size={14} /></a>
                              <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(cv.id)} title={t('common.delete', 'Xóa')}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Profile details settings (for AI Search ATS) */}
          <div className={styles.uploadCard}>
            <div className={styles.matchInfoTitle}>{t('cvs.match_info_title', 'THÔNG TIN SO KHỚP HỒ SƠ')}</div>
            <p className={styles.matchInfoSubtitle}>
              {t('cvs.match_info_desc', 'Thông tin này giúp thuật toán so khớp tự động đo lường độ tương thích (%) của bạn với các tin tuyển dụng IT.')}
            </p>
            
            <div className={styles.formGroup}>
              <label>{t('cvs.skills_label', 'Kỹ năng IT chính (Phân tách bằng dấu phẩy)')}</label>
              <input 
                type="text" 
                value={skillsText} 
                onChange={e => setSkillsText(e.target.value)} 
                placeholder={t('cvs.skills_placeholder', 'React, Node.js, C#, Docker...')}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('cvs.summary_label', 'Tóm tắt kinh nghiệm')}</label>
              <textarea 
                rows={3} 
                value={experienceSummary} 
                onChange={e => setExperienceSummary(e.target.value)}
                placeholder={t('cvs.summary_placeholder', 'Ví dụ: Lập trình viên C# với 2 năm kinh nghiệm.')}
              ></textarea>
            </div>

            <div className={styles.formGroup}>
              <label>{t('cvs.visibility_label', 'Trạng thái hiển thị hồ sơ')}</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value)}>
                <option value="PUBLIC">{t('cvs.visibility_public', 'Công khai (Nhà tuyển dụng có thể tìm kiếm)')}</option>
                <option value="PRIVATE">{t('cvs.visibility_private', 'Riêng tư (Chỉ hiển thị khi bạn chủ động nộp đơn)')}</option>
              </select>
            </div>

            <button className={`${styles.btnPrimary} ${styles.btnFullWidth}`} onClick={handleUpdateProfileSettings}>
              {t('cvs.btn_save_profile', 'Lưu thông tin hồ sơ')}
            </button>

            <div className={styles.uploadSectionDivider}>
              <label className={styles.uploadSectionLabel}>
                {t('cvs.upload_card_title', 'Tải lên CV PDF sẵn có')}
              </label>
              <div className={styles.dragDropArea} onClick={() => document.getElementById('cv-file-upload')?.click()}>
                <Upload size={24} color="var(--color-text-secondary)" />
                <p>{t('cvs.upload_drag_text', 'Kéo thả CV hoặc bấm để chọn file')}</p>
                <span className={styles.uploadHintText}>{t('cvs.upload_hint', 'Hỗ trợ PDF, DOCX tối đa 5MB')}</span>
                <input 
                  id="cv-file-upload" 
                  type="file" 
                  accept=".pdf,.docx" 
                  className={styles.hiddenInput} 
                  onChange={handleMockUpload} 
                />
              </div>
            </div>
          </div>
        </div>
        {renderPreviewModal()}
      </div>
    );
  }

  // RENDER: EMPLOYER OR ADMIN LOOKUP VIEW
  return (
    <div className={styles.cvsPage}>
      {/* Title area */}
      <div className={styles.titleArea}>
        <div>
          <h1>Tra cứu Hồ sơ & CV ứng viên</h1>
          <p className={styles.subTextSecondary}>Tìm kiếm trực tiếp từ kho hồ sơ ứng viên IT công khai trên toàn hệ thống</p>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className={`${styles.uploadCard} ${styles.searchHeader}`}>
        <input 
          type="text" 
          placeholder="Tìm theo kỹ năng (React, C#, SQL...), tên hoặc vị trí..." 
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          className={styles.searchInput}
          onKeyDown={e => e.key === 'Enter' && fetchCvs()}
        />
        <button className={styles.btnPrimary} onClick={() => fetchCvs()}>Tìm kiếm</button>
        <button className={styles.btnSecondary} onClick={() => { setSearchKeyword(''); fetchCvs(); }}><RotateCcw size={16} /></button>
      </div>

      {/* Candidates List cards */}
      <div className={styles.candidateGrid}>
        {loading ? (
          <div className={styles.gridColFull}>Đang tải danh sách ứng viên...</div>
        ) : cvs.length === 0 ? (
          <div className={styles.gridColFullEmpty}>
            Không tìm thấy hồ sơ ứng viên công khai nào phù hợp.
          </div>
        ) : (
          cvs.map(cv => (
            <div key={cv.id} className={styles.uploadCard}>
              <div className={styles.candidateCardHeader}>
                <div>
                  <h3 className={styles.candidateName}>{cv.candidateName}</h3>
                  <span className={styles.candidateEmail}>Email: {cv.candidateEmail}</span>
                </div>
                <span className={`${styles.badge} ${styles.badgePublished}`}>Public Profile</span>
              </div>
              
              {cv.skills && (
                <div className={styles.candidateSkillsSection}>
                  <label className={styles.candidateSkillsLabel}>Kỹ năng chính:</label>
                  <div className={styles.candidateSkillsList}>
                    {(Array.isArray(cv.skills)
                      ? cv.skills
                      : typeof cv.skills === 'string'
                      ? cv.skills.split(',')
                      : []
                    ).map((skill: any, index: number) => {
                      const skillStr = typeof skill === 'string' ? skill.trim() : (skill?.name || String(skill || ''));
                      if (!skillStr) return null;
                      return (
                        <span key={index} className={styles.candidateSkillTag}>
                          {skillStr}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {cv.experienceSummary && (
                <div className={styles.candidateExpSection}>
                  <label className={styles.candidateExpLabel}>Tóm tắt kinh nghiệm:</label>
                  <p className={styles.candidateExpText}>{cv.experienceSummary}</p>
                </div>
              )}

              <div className={styles.candidateCardFooter}>
                <span className={styles.candidateFooterTitle} title={cv.cvTitle}>
                  {cv.cvTitle}
                </span>
                <div className={styles.candidateFooterActions}>
                  <button 
                    type="button" 
                    className={`${styles.btnSecondary} ${styles.modalActionBtnSmall}`}
                    onClick={() => setPreviewCv(cv)}
                  >
                    <Eye size={14} />
                    <span>Xem nhanh</span>
                  </button>
                  <a href={cv.fileUrl} download className={`${styles.btnPrimary} ${styles.modalActionBtnSmall}`}>
                    <Download size={14} />
                    <span>Tải CV</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {renderPreviewModal()}
    </div>
  );
};
export default CvsPage;
