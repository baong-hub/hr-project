import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, Sparkles, Wand2, X } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { aiService } from '../../../core/services/ai.service';
import { toast } from '../../../core/services/toast.service';
import type { JobStatus } from '../../../core/models/job.model';
import styles from './JobsPage.module.scss';

export const JobFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // AI JD Generator State
  const [showAiJdModal, setShowAiJdModal] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [generatingJd, setGeneratingJd] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [city, setCity] = useState('Hà Nội');
  const [district, setDistrict] = useState('');
  const [office, setOffice] = useState('');
  const [openings, setOpenings] = useState(1);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [salaryFrom, setSalaryFrom] = useState('');
  const [salaryTo, setSalaryTo] = useState('');
  
  const [expiredAt, setExpiredAt] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 30 days
  );

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchJobDetails = async () => {
        setLoading(true);
        try {
          const res = await jobsService.getJobById(Number(id));
          if (res.data?.success && res.data.data) {
            const job = res.data.data;
            setTitle(job.title);
            // Since we added these fields, we fall back to sensible defaults or map them
            setCategory(job.category || '');
            setEmploymentType(job.employmentType || 'Full-time');
            setCity(job.city);
            setDistrict(job.district || '');
            setOffice(job.office || '');
            setOpenings(job.openings || 1);
            setDescription(job.description);
            setRequirements(job.requirements || '');
            setBenefits(job.benefits || '');
            
            if (!job.salaryFrom && !job.salaryTo) {
              setIsNegotiable(true);
            } else {
              setIsNegotiable(false);
              setSalaryFrom(job.salaryFrom ? job.salaryFrom.toString() : '');
              setSalaryTo(job.salaryTo ? job.salaryTo.toString() : '');
            }
            
            setExpiredAt(job.expiredAt ? job.expiredAt.split('T')[0] : '');
          } else {
            toast.error(res.data?.error?.message || 'Không thể tải tin tuyển dụng.');
            navigate('/employer/jobs');
          }
        } catch (err) {
          console.error(err);
          toast.error('Lỗi khi tải chi tiết tin tuyển dụng.');
          navigate('/employer/jobs');
        } finally {
          setLoading(false);
        }
      };

      fetchJobDetails();
    }
  }, [id, isEditMode]);

  // Client Validation
  const validateForm = (): boolean => {
    if (!title.trim() || title.length < 10 || title.length > 150) {
      toast.error('Tiêu đề tin đăng phải từ 10 đến 150 ký tự.');
      return false;
    }
    if (!category.trim()) {
      toast.error('Vui lòng nhập danh mục ngành nghề.');
      return false;
    }
    if (!city.trim()) {
      toast.error('Vui lòng nhập hoặc chọn tỉnh/thành phố.');
      return false;
    }
    if (!description.trim() || description.length < 50) {
      toast.error('Mô tả công việc phải từ 50 ký tự trở lên.');
      return false;
    }
    if (!requirements.trim() || requirements.length < 50) {
      toast.error('Yêu cầu ứng viên phải từ 50 ký tự trở lên.');
      return false;
    }

    if (!isNegotiable) {
      const from = parseFloat(salaryFrom);
      const to = parseFloat(salaryTo);
      if (isNaN(from) || from < 0) {
        toast.error('Vui lòng nhập lương tối thiểu hợp lệ (>= 0).');
        return false;
      }
      if (salaryTo && (isNaN(to) || to < from)) {
        toast.error('Lương tối đa không được nhỏ hơn lương tối thiểu.');
        return false;
      }
    }

    const expiryDate = new Date(expiredAt);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 6); // at least 7 days from today
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 91); // max 90 days from today

    if (expiryDate < minDate || expiryDate > maxDate) {
      toast.error('Hạn nộp hồ sơ phải nằm trong khoảng từ 7 đến 90 ngày kể từ hôm nay.');
      return false;
    }

    return true;
  };

  const handleSave = async (status: JobStatus) => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim(),
        employmentType,
        country: 'VIETNAM',
        city,
        district: district.trim() || null,
        office: office.trim() || null,
        workMode: 'ONSITE', // Can expand to dynamic workModes
        salaryType: isNegotiable ? 'NEGOTIABLE' : 'RANGE',
        salaryFrom: isNegotiable || !salaryFrom ? null : parseFloat(salaryFrom),
        salaryTo: isNegotiable || !salaryTo ? null : parseFloat(salaryTo),
        experienceLevel: 'Middle', // Default career level or dynamic
        experienceYearsMin: null,
        education: null,
        description: description.trim(),
        requirements: requirements.trim(),
        benefits: benefits.trim() || null,
        probationDuration: null,
        openings,
        status,
        expiredAt: new Date(expiredAt).toISOString()
      } as any;

      let res;
      if (isEditMode && id) {
        res = await jobsService.updateJob(Number(id), payload);
      } else {
        res = await jobsService.createJob(payload);
      }

      if (res.data?.success) {
        toast.success(isEditMode ? 'Cập nhật tin đăng thành công!' : 'Tạo tin đăng thành công!');
        navigate('/employer/jobs');
      } else {
        toast.error(res.data?.error?.message || 'Thao tác thất bại.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi lưu tin tuyển dụng.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAiJd = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề tuyển dụng trước khi tạo bằng AI.');
      return;
    }
    setGeneratingJd(true);
    try {
      const res = await aiService.generateJd({
        title: title.trim(),
        keywords: [category, aiKeywords].filter(Boolean).join(', ')
      });
      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        if (gen.description) setDescription(gen.description);
        if (gen.requirements) setRequirements(gen.requirements);
        if (gen.benefits) setBenefits(gen.benefits);
        toast.success('AI đã tạo xong mô tả công việc thành công!');
        setShowAiJdModal(false);
      } else {
        toast.error(res.data?.error?.message || 'Không thể tạo JD tự động.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi gọi trợ lý AI tạo JD.');
    } finally {
      setGeneratingJd(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Đang tải thông tin tin tuyển dụng...
      </div>
    );
  }

  return (
    <div className={styles.jobsPage} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/employer/jobs')} className={styles.btnSecondary}>
          <ArrowLeft size={16} /> Quay lại quản lý
        </button>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, margin: 0 }}>
          {isEditMode ? 'Sửa tin tuyển dụng' : 'Đăng tuyển dụng mới'}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
        {/* Card 1: Thông tin chung */}
        <div className={styles.tableCard} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border-default)', paddingBottom: '8px', fontWeight: 700 }}>Card 1: Thông tin chung</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Tiêu đề tuyển dụng <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <input
              type="text"
              placeholder="Ví dụ: Senior .NET Backend Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Ngành nghề / Danh mục <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: IT / Phần mềm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Loại hình làm việc</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Thành phố tuyển dụng <span style={{ color: 'var(--color-error)' }}>*</span></label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. HCM">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Số lượng tuyển (chỉ tiêu)</label>
              <input
                type="number"
                min={1}
                value={openings}
                onChange={(e) => setOpenings(Number(e.target.value))}
                style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Quận / Huyện</label>
              <input
                type="text"
                placeholder="Ví dụ: Cầu Giấy"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Văn phòng (Địa chỉ cụ thể)</label>
              <input
                type="text"
                placeholder="Ví dụ: Tòa Keangnam, Mễ Trì"
                value={office}
                onChange={(e) => setOffice(e.target.value)}
                style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Nội dung chi tiết */}
        <div className={styles.tableCard} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-default)', paddingBottom: '8px' }}>
            <h3 style={{ margin: 0, fontWeight: 700 }}>Card 2: Nội dung chi tiết</h3>
            <button
              type="button"
              onClick={() => setShowAiJdModal(true)}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
              }}
            >
              <Sparkles size={15} /> AI Viết JD Tự Động
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Mô tả công việc <span style={{ color: 'var(--color-error)' }}>*</span> (Tối thiểu 50 ký tự)</label>
            <textarea
              rows={6}
              placeholder="Mô tả các công việc chính, trách nhiệm hàng ngày của vị trí..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)', fontSize: 'var(--font-size-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Yêu cầu ứng viên <span style={{ color: 'var(--color-error)' }}>*</span> (Tối thiểu 50 ký tự)</label>
            <textarea
              rows={6}
              placeholder="Yêu cầu về kỹ năng, kinh nghiệm chuyên môn, công nghệ hoặc bằng cấp..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)', fontSize: 'var(--font-size-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Quyền lợi & Chế độ đãi ngộ</label>
            <textarea
              rows={4}
              placeholder="Mô tả mức bảo hiểm, cơ hội thăng tiến, thưởng dự án, du lịch, v.v..."
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)', fontSize: 'var(--font-size-sm)' }}
            />
          </div>
        </div>

        {/* Card 3: Chế độ đãi ngộ & Hạn nộp */}
        <div className={styles.tableCard} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border-default)', paddingBottom: '8px', fontWeight: 700 }}>Card 3: Chế độ đãi ngộ & Hạn nộp</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              id="negotiable"
              checked={isNegotiable}
              onChange={(e) => setIsNegotiable(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="negotiable" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer' }}>Mức lương thỏa thuận</label>
          </div>

          {!isNegotiable && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Lương tối thiểu (VND) <span style={{ color: 'var(--color-error)' }}>*</span></label>
                <input
                  type="number"
                  placeholder="Ví dụ: 15000000"
                  value={salaryFrom}
                  onChange={(e) => setSalaryFrom(e.target.value)}
                  style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Lương tối đa (VND)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 25000000"
                  value={salaryTo}
                  onChange={(e) => setSalaryTo(e.target.value)}
                  style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Hạn nộp hồ sơ <span style={{ color: 'var(--color-error)' }}>*</span> (Tối thiểu 7 ngày, tối đa 90 ngày)</label>
            <input
              type="date"
              value={expiredAt}
              onChange={(e) => setExpiredAt(e.target.value)}
              style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-default)', width: '100%' }}
            />
          </div>
        </div>

        {/* Form Submission Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '12px 0 24px 0' }}>
          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={submitting}
            className={styles.btnSecondary}
          >
            <Save size={16} /> Lưu bản nháp
          </button>
          <button
            type="button"
            onClick={() => handleSave('PENDING_REVIEW')}
            disabled={submitting}
            className={styles.btnPrimary}
          >
            <Send size={16} /> Gửi duyệt & Đăng tin
          </button>
        </div>
      </div>

      {/* AI JD Generator Modal */}
      {showAiJdModal && (
        <div className={styles.modalOverlay} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.65)' }}>
          <div className={styles.modalContent} style={{ maxWidth: '560px', width: '92%', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Wand2 size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>Trợ Lý AI Soạn Thảo JD Tuyển Dụng</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Tự động sinh Mô tả, Yêu cầu và Quyền lợi chuẩn chuyên nghiệp</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiJdModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', borderLeft: '3px solid #6366f1' }}>
                <strong>Vị trí đang tạo:</strong> {title || '(Chưa có tiêu đề - Vui lòng nhập tiêu đề trước)'}
                <br />
                <strong>Ngành nghề:</strong> {category || 'Công nghệ thông tin'}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Từ khóa bổ sung & Điểm nhấn mong muốn (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  placeholder="Ví dụ: ReactJS, TypeScript, 2 năm kinh nghiệm, làm việc hybrid, phụ cấp ăn trưa, thưởng dự án quý..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI sẽ kết hợp tiêu đề tuyển dụng và các từ khóa này để sinh bộ JD hoàn chỉnh nhất.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAiJdModal(false)} 
                  className={styles.btnSecondary}
                  disabled={generatingJd}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button"
                  onClick={handleGenerateAiJd} 
                  disabled={generatingJd || !title.trim()}
                  className={styles.btnPrimary}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {generatingJd ? (
                    <>
                      <div style={{ width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Đang sinh nội dung...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Bắt đầu tạo bằng AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
