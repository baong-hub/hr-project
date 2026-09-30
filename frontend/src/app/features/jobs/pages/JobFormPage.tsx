import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wand2, ArrowLeft } from 'lucide-react';
import { jobsService } from '../../../core/services/jobs.service';
import { aiService } from '../../../core/services/ai.service';
import { toast } from '../../../core/services/toast.service';
import { metaService } from '../../../core/services/meta.service';
import type { JobStatus } from '../../../core/models/job.model';
import styles from './JobFormPage.module.scss';
import { FormField } from '../../../shared/components/form-field/FormField';
import { Modal } from '../../../shared/components/modal/Modal';
import { IndustrySelect } from '../../../shared/components/search/IndustrySelect';
import { ProvinceSelect } from '../../../shared/components/search/ProvinceSelect';

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
  const [categoryCode, setCategoryCode] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [city, setCity] = useState('Hà Nội');
  const [provinceCode, setProvinceCode] = useState('ha-noi');
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
            const job = res.data.data as any;
            setTitle(job.title || '');
            setCategory(job.category || '');
            if (job.categoryCode) {
              setCategoryCode(job.categoryCode);
            } else if (job.category) {
              const matched = metaService.matchIndustry(job.category);
              if (matched) setCategoryCode(matched.code);
            }
            setEmploymentType(job.employmentType || 'Full-time');
            setCity(job.city || 'Hà Nội');
            if (job.provinceCode) {
              setProvinceCode(job.provinceCode);
            } else if (job.city) {
              const matched = metaService.matchProvince(job.city);
              if (matched) setProvinceCode(matched.code);
            }
            setDistrict(job.district || '');
            setOffice(job.office || '');
            setOpenings(job.openings || 1);
            setDescription(job.description || '');
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
          }
        } catch (err) {
          console.error(err);
          toast.error('Có lỗi xảy ra khi tải dữ liệu tin.');
        } finally {
          setLoading(false);
        }
      };

      fetchJobDetails();
    }
  }, [id, isEditMode]);

  const validateForm = () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề tuyển dụng.');
      return false;
    }
    if (!category.trim() && !categoryCode) {
      toast.error('Vui lòng chọn Ngành nghề tuyển dụng.');
      return false;
    }
    if (!city.trim() && !provinceCode) {
      toast.error('Vui lòng chọn Tỉnh / Thành phố làm việc.');
      return false;
    }
    if (!description.trim() || description.trim().length < 50) {
      toast.error('Mô tả công việc phải chứa ít nhất 50 ký tự.');
      return false;
    }
    if (!requirements.trim() || requirements.trim().length < 50) {
      toast.error('Yêu cầu ứng viên phải chứa ít nhất 50 ký tự.');
      return false;
    }

    if (!isNegotiable) {
      if (!salaryFrom) {
        toast.error('Vui lòng nhập Mức lương tối thiểu hoặc chọn Thỏa thuận.');
        return false;
      }
      const sFrom = parseFloat(salaryFrom);
      const sTo = salaryTo ? parseFloat(salaryTo) : null;
      if (sFrom < 0 || (sTo !== null && sTo < 0)) {
        toast.error('Mức lương không được là số âm.');
        return false;
      }
      if (sTo !== null && sTo < sFrom) {
        toast.error('Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu.');
        return false;
      }
    }

    if (!expiredAt) {
      toast.error('Vui lòng chọn Hạn nộp hồ sơ.');
      return false;
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
        categoryCode: categoryCode || null,
        employmentType,
        country: 'VIETNAM',
        city: city.trim(),
        provinceCode: provinceCode || null,
        district: district.trim() || null,
        office: office.trim() || null,
        workMode: 'ONSITE',
        salaryType: isNegotiable ? 'NEGOTIABLE' : 'RANGE',
        salaryFrom: isNegotiable || !salaryFrom ? null : parseFloat(salaryFrom),
        salaryTo: isNegotiable || !salaryTo ? null : parseFloat(salaryTo),
        experienceLevel: 'Middle',
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
    let targetTitle = title.trim();
    if (!targetTitle && aiKeywords.trim()) {
      targetTitle = aiKeywords.trim();
      setTitle(targetTitle);
    }
    if (!targetTitle) {
      toast.error('Vui lòng nhập Tiêu đề / Vị trí tuyển dụng trước khi tạo bằng AI.');
      return;
    }
    setGeneratingJd(true);
    try {
      const res = await aiService.generateJd({
        title: targetTitle,
        keywords: [category, aiKeywords].filter(Boolean).join(', ')
      });
      if (res.data?.success && res.data.data) {
        const gen = res.data.data;
        if (gen.description) setDescription(gen.description);
        if (gen.requirements) setRequirements(gen.requirements);
        if (gen.benefits) setBenefits(gen.benefits);
        if (gen.suggestedSalaryFrom && gen.suggestedSalaryTo) {
          setIsNegotiable(false);
          setSalaryFrom(gen.suggestedSalaryFrom.toString());
          setSalaryTo(gen.suggestedSalaryTo.toString());
          toast.success(`AI đã tạo JD & gợi ý khung lương: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(gen.suggestedSalaryFrom)} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(gen.suggestedSalaryTo)}!`);
        } else {
          toast.success('AI đã tạo xong mô tả công việc thành công!');
        }
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
      <div className={styles.loadingPlaceholder}>
        Đang tải thông tin tin tuyển dụng...
      </div>
    );
  }

  return (
    <div className={styles.jobFormPage}>
      <div className={styles.headerRow}>
        <button onClick={() => navigate('/employer/jobs')} className={`${styles.btnSecondary} ${styles.btnBack}`}>
          <ArrowLeft size={16} /> Quay lại quản lý
        </button>
        <h1 className={styles.pageTitle}>
          {isEditMode ? 'Sửa tin tuyển dụng' : 'Đăng tuyển dụng mới'}
        </h1>
      </div>

      <div className={styles.cardList}>
        {/* Card 1: Thông tin chung */}
        <div className={styles.formCard}>
          <h3 className={styles.cardTitle}>Thông tin chung</h3>
          
          <FormField
            label="Tiêu đề tuyển dụng"
            required
            placeholder="Ví dụ: Senior .NET Backend Developer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Ngành nghề / Danh mục <span className={styles.requiredMark}>*</span>
              </label>
              <IndustrySelect
                inlineDisplay
                value={categoryCode}
                placeholder="-- Chọn ngành nghề --"
                onChange={(code, item) => {
                  setCategoryCode(code);
                  if (item) setCategory(item.name);
                }}
              />
            </div>

            <FormField
              label="Loại hình làm việc"
              control="select"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Freelance', label: 'Freelance' },
                { value: 'Internship', label: 'Internship' }
              ]}
            />
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Tỉnh / Thành phố tuyển dụng <span className={styles.requiredMark}>*</span>
              </label>
              <ProvinceSelect
                inlineDisplay
                value={provinceCode}
                placeholder="-- Chọn tỉnh/thành phố --"
                onChange={(code, item) => {
                  setProvinceCode(code);
                  if (item) setCity(item.name);
                }}
              />
            </div>

            <FormField
              label="Số lượng tuyển (chỉ tiêu)"
              type="number"
              min={1}
              value={openings}
              onChange={(e) => setOpenings(Number(e.target.value))}
            />
          </div>

          <div className={styles.grid2}>
            <FormField
              label="Quận / Huyện"
              placeholder="Ví dụ: Cầu Giấy"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
            <FormField
              label="Văn phòng (Địa chỉ cụ thể)"
              placeholder="Ví dụ: Tòa Keangnam, Mễ Trì"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
            />
          </div>
        </div>

        {/* Card 2: Nội dung chi tiết */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardHeaderTitle}>Nội dung chi tiết</h3>
            <button
              type="button"
              onClick={() => setShowAiJdModal(true)}
              className={styles.aiTriggerBtn}
            >
              <Wand2 size={16} />
              <span>AI Viết JD Tự Động</span>
            </button>
          </div>
          
          <FormField
            label="Mô tả công việc (Tối thiểu 50 ký tự)"
            required
            control="textarea"
            rows={6}
            placeholder="Mô tả các công việc chính, trách nhiệm hàng ngày của vị trí..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormField
            label="Yêu cầu ứng viên (Tối thiểu 50 ký tự)"
            required
            control="textarea"
            rows={6}
            placeholder="Yêu cầu về kỹ năng, kinh nghiệm chuyên môn, công nghệ hoặc bằng cấp..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />

          <FormField
            label="Quyền lợi & Chế độ đãi ngộ"
            control="textarea"
            rows={4}
            placeholder="Mô tả mức bảo hiểm, cơ hội thăng tiến, thưởng dự án, du lịch, v.v..."
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
          />
        </div>

        {/* Card 3: Chế độ đãi ngộ & Hạn nộp */}
        <div className={styles.formCard}>
          <h3 className={styles.cardTitle}>Chế độ đãi ngộ & Hạn nộp</h3>
          
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="negotiable"
              checked={isNegotiable}
              onChange={(e) => setIsNegotiable(e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor="negotiable" className={styles.checkboxLabel}>Mức lương thỏa thuận</label>
          </div>

          {!isNegotiable && (
            <div className={styles.grid2}>
              <FormField
                label="Lương tối thiểu (VND)"
                required
                type="number"
                placeholder="Ví dụ: 15000000"
                value={salaryFrom}
                onChange={(e) => setSalaryFrom(e.target.value)}
              />
              <FormField
                label="Lương tối đa (VND)"
                type="number"
                placeholder="Ví dụ: 25000000"
                value={salaryTo}
                onChange={(e) => setSalaryTo(e.target.value)}
              />
            </div>
          )}

          <FormField
            label="Hạn nộp hồ sơ (Tối thiểu 7 ngày, tối đa 90 ngày)"
            required
            type="date"
            value={expiredAt}
            onChange={(e) => setExpiredAt(e.target.value)}
          />
        </div>

        {/* Form Submission Buttons */}
        <div className={styles.footerActions}>
          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={submitting}
            className={styles.btnSecondary}
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            onClick={() => handleSave('PENDING_REVIEW')}
            disabled={submitting}
            className={styles.btnPrimary}
          >
            Gửi duyệt & Đăng tin
          </button>
        </div>
      </div>

      {/* AI JD Generator Modal using shared Modal component */}
      <Modal
        isOpen={showAiJdModal}
        onClose={() => setShowAiJdModal(false)}
        title="Trợ Lý AI Soạn Thảo JD Tuyển Dụng"
        description="Tự động sinh Mô tả, Yêu cầu và Quyền lợi chuẩn chuyên nghiệp"
        size="lg"
        footer={
          <div className={styles.modalFooterActions}>
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
              disabled={generatingJd || (!title.trim() && !aiKeywords.trim())}
              className={styles.aiSubmitBtn}
            >
              {generatingJd ? (
                <>
                  <div className={styles.spinner} />
                  <span>Đang sinh nội dung...</span>
                </>
              ) : (
                'Bắt đầu tạo bằng AI'
              )}
            </button>
          </div>
        }
      >
        <div className={styles.modalBodyCol}>
          <FormField
            label="Vị trí / Tiêu đề tuyển dụng"
            required
            placeholder="Ví dụ: Backend Developer, Senior .NET Engineer, UI/UX Designer..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={(!title.trim() && !aiKeywords.trim()) ? '* Vui lòng nhập tiêu đề vị trí cần tuyển dụng' : undefined}
          />

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Ngành nghề / Lĩnh vực (Tùy chọn)</label>
            <IndustrySelect
              inlineDisplay
              value={categoryCode}
              placeholder="Chọn ngành nghề..."
              onChange={(code, item) => {
                setCategoryCode(code);
                if (item) setCategory(item.name);
              }}
            />
          </div>

          <FormField
            label="Từ khóa bổ sung & Điểm nhấn mong muốn (Tùy chọn)"
            control="textarea"
            rows={3}
            value={aiKeywords}
            onChange={(e) => setAiKeywords(e.target.value)}
            placeholder="Ví dụ: C#, .NET Core, Microservices, SQL Server, 2 năm kinh nghiệm, làm việc hybrid, phụ cấp ăn trưa, thưởng dự án..."
            hint="AI sẽ kết hợp tiêu đề tuyển dụng và các từ khóa này để sinh bộ JD hoàn chỉnh nhất."
          />
        </div>
      </Modal>
    </div>
  );
};
export default JobFormPage;
