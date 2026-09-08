import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, Search, RotateCcw, Trash2, 
  FileText, Upload, ChevronLeft, ChevronRight, Check, Star, Settings, X 
} from 'lucide-react';
import { cvsService } from '../../../core/services/cvs.service';
import { authService } from '../../../core/services/auth.service';
import { toast } from '../../../core/services/toast.service';
import styles from './CvsPage.module.scss';

export const CvsPage: React.FC = () => {
  const user = authService.getUser();
  const roles = (user?.roles as string[]) || [];
  const userRole = user?.role || user?.accountType || '';
  const isCandidate = roles.includes('Ứng viên') || userRole === 'CANDIDATE' || userRole === 'User';

  // Candidate states
  const [cvs, setCvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'creative'>('classic');

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
    setLoading(true);
    try {
      if (isCandidate) {
        const res = await cvsService.getCvs();
        if (res.success) {
          setCvs(res.data || []);
        }
      } else {
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
        fetchCvs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete CV
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa CV này?')) return;
    try {
      const res = await cvsService.deleteCv(id);
      if (res.success) {
        fetchCvs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mock Upload CV
  const handleMockUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Save CV Builder details to profile
  const handleSaveBuilderCv = async () => {
    try {
      // 1. Create a CV record
      const cvTitle = `CV_${cvForm.fullName.replace(/\s+/g, '')}_Builder.pdf`;
      const dummyBlob = new Blob([`CV Content for ${cvForm.fullName}`], { type: 'application/pdf' });
      const dummyFile = new File([dummyBlob], cvTitle, { type: 'application/pdf' });
      const createRes = await cvsService.uploadCv(cvTitle, dummyFile);

      if (createRes.success) {
        // 2. Sync profile skills automatically
        await cvsService.updateProfile({
          skills: cvForm.skills,
          experienceSummary: `${cvForm.jobTitle} - ${cvForm.summary.slice(0, 80)}...`,
          visibilityStatus: 'PUBLIC'
        });
        
        toast.success('Tạo và lưu CV thành công!');
        setIsBuilderMode(false);
        fetchCvs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Download PDF / Print trigger
  const handlePrintPdf = () => {
    window.print();
  };

  // RENDER: CANDIDATE DASHBOARD
  if (isCandidate) {
    if (isBuilderMode) {
      return (
        <div className={styles.cvsPage}>
          {/* Header */}
          <div className={styles.builderHeader}>
            <div>
              <h2>Trình tạo CV thông minh (CV Builder)</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>Nhập thông tin cá nhân và xem trực tiếp CV mẫu chuẩn A4</p>
            </div>
            <button className={styles.btnSecondary} onClick={() => setIsBuilderMode(false)}><X size={16} /> Thoát</button>
          </div>

          {/* Stepper Progress */}
          <div className={styles.stepper}>
            <div className={`${styles.step} ${currentStep === 1 ? styles.stepActive : currentStep > 1 ? styles.stepCompleted : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span>Cá nhân</span>
            </div>
            <div className={`${styles.step} ${currentStep === 2 ? styles.stepActive : currentStep > 2 ? styles.stepCompleted : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span>Kinh nghiệm</span>
            </div>
            <div className={`${styles.step} ${currentStep === 3 ? styles.stepActive : currentStep > 3 ? styles.stepCompleted : ''}`}>
              <span className={styles.stepNumber}>3</span>
              <span>Học vấn & Kỹ năng</span>
            </div>
            <div className={`${styles.step} ${currentStep === 4 ? styles.stepActive : ''}`}>
              <span className={styles.stepNumber}>4</span>
              <span>Mẫu & Tải về</span>
            </div>
          </div>

          {/* Builder Split Layout */}
          <div className={styles.builderSplitLayout}>
            {/* Left Column: Form inputs per step */}
            <div className={styles.builderFormCard}>
              {currentStep === 1 && (
                <>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Bước 1: Thông tin cá nhân</h3>
                  <div className={styles.formGroup}>
                    <label>Họ và tên</label>
                    <input type="text" value={cvForm.fullName} onChange={e => setCvForm({...cvForm, fullName: e.target.value})} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input type="email" value={cvForm.email} onChange={e => setCvForm({...cvForm, email: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Số điện thoại</label>
                      <input type="text" value={cvForm.phone} onChange={e => setCvForm({...cvForm, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Vị trí ứng tuyển mong muốn</label>
                    <input type="text" value={cvForm.jobTitle} onChange={e => setCvForm({...cvForm, jobTitle: e.target.value})} placeholder="Ví dụ: Backend Developer" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tóm tắt năng lực (Giới thiệu bản thân)</label>
                    <textarea rows={4} value={cvForm.summary} onChange={e => setCvForm({...cvForm, summary: e.target.value})}></textarea>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Bước 2: Kinh nghiệm làm việc</h3>
                  <div className={styles.formGroup}>
                    <label>Tên công ty</label>
                    <input type="text" value={cvForm.company} onChange={e => setCvForm({...cvForm, company: e.target.value})} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Vị trí / Chức danh</label>
                      <input type="text" value={cvForm.position} onChange={e => setCvForm({...cvForm, position: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Thời gian (Bắt đầu - Kết thúc)</label>
                      <input type="text" value={cvForm.duration} onChange={e => setCvForm({...cvForm, duration: e.target.value})} placeholder="Ví dụ: 2022 - Nay" />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mô tả chi tiết công việc</label>
                    <textarea rows={6} value={cvForm.expDesc} onChange={e => setCvForm({...cvForm, expDesc: e.target.value})}></textarea>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Bước 3: Học vấn & Kỹ năng</h3>
                  <div className={styles.formGroup}>
                    <label>Trường đại học</label>
                    <input type="text" value={cvForm.school} onChange={e => setCvForm({...cvForm, school: e.target.value})} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Chuyên ngành</label>
                      <input type="text" value={cvForm.major} onChange={e => setCvForm({...cvForm, major: e.target.value})} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Thời gian học</label>
                      <input type="text" value={cvForm.eduDuration} onChange={e => setCvForm({...cvForm, eduDuration: e.target.value})} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Kỹ năng chính (Phân tách bằng dấu phẩy)</label>
                    <input type="text" value={cvForm.skills} onChange={e => setCvForm({...cvForm, skills: e.target.value})} placeholder="React, TypeScript, SQL, Node..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Chứng chỉ & Ngôn ngữ</label>
                    <input type="text" value={cvForm.cert} onChange={e => setCvForm({...cvForm, cert: e.target.value})} />
                  </div>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Bước 4: Chọn mẫu CV & Hoàn tất</h3>
                  <div className={styles.formGroup}>
                    <label>Chọn thiết kế Template</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button 
                        type="button" 
                        className={selectedTemplate === 'classic' ? styles.btnPrimary : styles.btnSecondary}
                        onClick={() => setSelectedTemplate('classic')}
                        style={{ flex: 1 }}
                      >
                        Classic Navy Blue
                      </button>
                      <button 
                        type="button" 
                        className={selectedTemplate === 'creative' ? styles.btnPrimary : styles.btnSecondary}
                        onClick={() => setSelectedTemplate('creative')}
                        style={{ flex: 1 }}
                      >
                        Creative Forest Green
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }} onClick={handlePrintPdf}>
                      <Download size={16} /> Tải xuống bản PDF A4
                    </button>
                    <button className={styles.btnSecondary} style={{ width: '100%', justifyContent: 'center', background: '#e8f5e9', color: '#2e7d32', borderColor: '#c6f6d5' }} onClick={handleSaveBuilderCv}>
                      <Check size={16} /> Lưu vào hồ sơ ứng tuyển
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
                  <ChevronLeft size={16} /> Quay lại
                </button>
                {currentStep < 4 ? (
                  <button 
                    className={styles.btnPrimary} 
                    onClick={() => setCurrentStep(prev => prev + 1)}
                  >
                    Tiếp tục <ChevronRight size={16} />
                  </button>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>Bước cuối cùng</span>
                )}
              </div>
            </div>

            {/* Right Column: CV A4 Live Preview mockup */}
            <div className={styles.cvPreviewCard}>
              <div className={styles.previewToolbar}>
                <h4>BẢN XEM TRƯỚC HỒ SƠ (LIVE PREVIEW)</h4>
                <span style={{ fontSize: '10px', background: 'var(--color-bg-card)', padding: '2px 8px', borderRadius: '12px' }}>
                  A4 Size Layout
                </span>
              </div>
              <div className={`${styles.a4Sheet} ${selectedTemplate === 'classic' ? styles.templateClassic : styles.templateCreative}`}>
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
                      <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>{cvForm.summary}</p>
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
                      <p style={{ fontSize: '11px', color: '#4a5568', margin: 0 }}>{cvForm.cert}</p>
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
            <h1>Quản lý Hồ sơ & CV cá nhân</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>Tải lên các file CV hoặc khởi chạy trình tạo CV Builder chuẩn chuyên nghiệp</p>
          </div>
          <button className={styles.btnPrimary} onClick={() => { setIsBuilderMode(true); setCurrentStep(1); }}>
            <Plus size={16} /> Tạo CV bằng Builder
          </button>
        </div>

        {/* Layout: List CV on left, Profile Settings on right */}
        <div className={styles.cvGrid}>
          {/* Left Column: CV List */}
          <div className={styles.tableCard}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-default)', fontWeight: 700 }}>
              HỒ SƠ CV ĐÃ TẢI LÊN / LƯU
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>File CV</th>
                    <th>Dung lượng</th>
                    <th>Cập nhật</th>
                    <th>CV chính</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>Đang tải...</td></tr>
                  ) : cvs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        Bạn chưa có CV nào. Hãy tạo mới hoặc tải file lên.
                      </td>
                    </tr>
                  ) : (
                    cvs.map(cv => (
                      <tr key={cv.id}>
                        <td style={{ fontWeight: 600 }}>
                          <FileText size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--color-brand-primary)' }} />
                          {cv.cvTitle}
                        </td>
                        <td>{cv.fileSizeBytes ? `${(cv.fileSizeBytes / 1024).toFixed(0)} KB` : '—'}</td>
                        <td>{cv.createdAt ? cv.createdAt.split('T')[0] : '—'}</td>
                        <td>
                          {cv.isMain ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2e7d32', fontWeight: 600, fontSize: '12px' }}>
                              <Star size={12} fill="#2e7d32" /> CV chính thức
                            </span>
                          ) : (
                            <button className={styles.btnSecondary} style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => handleSetMain(cv.id)}>
                              Đặt làm chính
                            </button>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                            <a href={cv.fileUrl} download className={styles.actionBtn} title="Tải file"><Download size={14} /></a>
                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(cv.id)} title="Xóa"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Profile details settings (for AI Search ATS) */}
          <div className={styles.uploadCard}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>THÔNG TIN SO KHỚP HỒ SƠ</div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px 0' }}>
              Thông tin này giúp thuật toán so khớp tự động đo lường độ tương thích (%) của bạn với các tin tuyển dụng IT.
            </p>
            
            <div className={styles.formGroup}>
              <label>Kỹ năng IT chính (Phân tách bằng dấu phẩy)</label>
              <input 
                type="text" 
                value={skillsText} 
                onChange={e => setSkillsText(e.target.value)} 
                placeholder="React, Node.js, C#, Docker..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tóm tắt kinh nghiệm</label>
              <textarea 
                rows={3} 
                value={experienceSummary} 
                onChange={e => setExperienceSummary(e.target.value)}
                placeholder="Ví dụ: Lập trình viên C# với 2 năm kinh nghiệm."
              ></textarea>
            </div>

            <div className={styles.formGroup}>
              <label>Trạng thái hiển thị hồ sơ</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value)}>
                <option value="PUBLIC">Công khai (Nhà tuyển dụng có thể tìm kiếm)</option>
                <option value="PRIVATE">Riêng tư (Chỉ hiển thị khi bạn chủ động nộp đơn)</option>
              </select>
            </div>

            <button className={styles.btnPrimary} style={{ justifyContent: 'center' }} onClick={handleUpdateProfileSettings}>
              <Settings size={16} /> Lưu thông tin hồ sơ
            </button>

            <div style={{ borderTop: '1px solid var(--color-border-default)', paddingTop: '16px', marginTop: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
                Tải lên CV PDF sẵn có
              </label>
              <div className={styles.dragDropArea} onClick={() => document.getElementById('cv-file-upload')?.click()}>
                <Upload size={24} color="var(--color-text-secondary)" />
                <p>Kéo thả CV hoặc bấm để chọn file</p>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Hỗ trợ PDF, DOCX tối đa 5MB</span>
                <input 
                  id="cv-file-upload" 
                  type="file" 
                  accept=".pdf,.docx" 
                  style={{ display: 'none' }} 
                  onChange={handleMockUpload} 
                />
              </div>
            </div>
          </div>
        </div>
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
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>Tìm kiếm trực tiếp từ kho hồ sơ ứng viên IT công khai trên toàn hệ thống</p>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className={styles.uploadCard} style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Tìm theo kỹ năng (React, C#, SQL...), tên hoặc vị trí..." 
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--color-border-default)', borderRadius: '8px' }}
          onKeyDown={e => e.key === 'Enter' && fetchCvs()}
        />
        <button className={styles.btnPrimary} onClick={() => fetchCvs()}><Search size={16} /> Tìm kiếm</button>
        <button className={styles.btnSecondary} onClick={() => { setSearchKeyword(''); fetchCvs(); }}><RotateCcw size={16} /></button>
      </div>

      {/* Candidates List cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>Đang tải danh sách ứng viên...</div>
        ) : cvs.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', background: 'var(--color-bg-card)', borderRadius: '8px', border: '1px solid var(--color-border-default)' }}>
            Không tìm thấy hồ sơ ứng viên công khai nào phù hợp.
          </div>
        ) : (
          cvs.map(cv => (
            <div key={cv.id} className={styles.uploadCard} style={{ gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>{cv.candidateName}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Email: {cv.candidateEmail}</span>
                </div>
                <span className={`${styles.badge} ${styles.badgePublished}`}>Public Profile</span>
              </div>
              
              {cv.skills && (
                <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Kỹ năng chính:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {cv.skills.split(',').map((skill: string, index: number) => (
                      <span key={index} style={{ fontSize: '10px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-default)', padding: '2px 8px', borderRadius: '4px' }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {cv.experienceSummary && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Tóm tắt kinh nghiệm:</label>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{cv.experienceSummary}</p>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '12px', display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>File: {cv.cvTitle}</span>
                <a href={cv.fileUrl} download className={styles.btnPrimary} style={{ padding: '6px 12px', fontSize: '12px', gap: '4px' }}>
                  <Download size={12} /> Tải CV
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default CvsPage;
