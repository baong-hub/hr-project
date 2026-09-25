import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  BarChart3, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Building2 
} from 'lucide-react';
import { salaryInsightsService } from '../../../core/services/salary-insights.service';
import type { SalaryInsightsResult } from '../../../core/services/salary-insights.service';
import { SeoHead } from '../../../shared/components/SeoHead';

export const SalaryInsightsPage: React.FC = () => {
  const [category, setCategory] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [insights, setInsights] = useState<SalaryInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    salaryInsightsService.getSalaryInsights(category, location)
      .then(setInsights)
      .catch((err) => console.error('Failed to load salary insights:', err))
      .finally(() => setLoading(false));
  }, [category, location]);

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Báo cáo khảo sát thị trường mức lương Việt Nam 2026',
    description: 'Báo cáo thống kê phân tích mức lương thị trường theo ngành nghề, cấp bậc và kỹ năng chuyên môn từ HR Portal.',
    creator: {
      '@type': 'Organization',
      name: 'HR Portal'
    },
    temporalCoverage: '2026',
    spatialCoverage: 'Vietnam'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '90px' }}>
      <SeoHead
        title="Báo cáo thị trường lương theo ngành & vị trí năm 2026 | HR Portal"
        description="Tra cứu mức lương chuẩn xác theo ngành nghề, vị trí và số năm kinh nghiệm. Phân tích dải lương P25 - P75 và top kỹ năng được trả lương cao nhất tại Việt Nam."
        canonicalUrl="https://tuyendung.hamo.vn/salary-insights"
        keywords="báo cáo lương 2026, tra cứu mức lương, mức lương ngành it, lương fresher, lương senior, khảo sát lương việt nam"
        jsonLd={jsonLdData}
      />

      {/* Hero Header */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        color: '#ffffff',
        padding: '65px 24px 55px 24px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            padding: '6px 14px',
            borderRadius: '999px',
            color: '#a5b4fc',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            <Sparkles size={16} /> Báo cáo dữ liệu thị trường minh bạch 2026
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Báo cáo mức lương theo ngành nghề & Cấp bậc
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 32px 0', lineHeight: 1.6 }}>
            Tổng hợp và phân tích ẩn danh theo thời gian thực từ hơn 1,000+ tin tuyển dụng thực tế và đề nghị tuyển dụng (Offer Letter) trên nền tảng.
          </p>

          {/* Quick Filters */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '12px',
            borderRadius: '14px',
            maxWidth: '650px',
            margin: '0 auto',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#ffffff',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none'
              }}
            >
              <option value="all">Tất cả ngành nghề</option>
              <option value="Công nghệ thông tin">Công nghệ thông tin / Phần mềm</option>
              <option value="Marketing">Marketing / Truyền thông</option>
              <option value="Kinh doanh">Kinh doanh / Bán hàng</option>
              <option value="Nhân sự">Nhân sự / Tuyển dụng</option>
              <option value="Tài chính">Tài chính / Kế toán</option>
              <option value="Thiết kế">Thiết kế UI/UX / Đồ hoạ</option>
            </select>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#ffffff',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none'
              }}
            >
              <option value="all">Toàn quốc</option>
              <option value="Hà Nội">Hà Nội</option>
              <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin 0.8s linear infinite'
            }} />
            Đang phân tích dữ liệu thị trường...
          </div>
        )}

        {!loading && insights && (
          <div>
            {/* KPI Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '36px'
            }}>
              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} style={{ color: '#4f46e5' }} /> Lương trung vị (P50)
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#4f46e5' }}>
                  {insights.overallMedianMillionVnd} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>tr/tháng</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>50% nhân sự đạt từ mức này trở lên</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={16} style={{ color: '#16a34a' }} /> Dải lương phổ biến (P25 - P75)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a' }}>
                  {insights.overallP25MillionVnd} - {insights.overallP75MillionVnd} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>tr</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Khoảng lương tập trung 50% vị trí tuyển dụng</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={16} style={{ color: '#2563eb' }} /> Lương trung bình
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>
                  {insights.overallAverageMillionVnd} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>tr/tháng</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Tính trên toàn bộ mẫu dữ liệu</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={16} style={{ color: '#ea580c' }} /> Mẫu khảo sát tin tuyển dụng
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#ea580c' }}>
                  {insights.totalJobsAnalyzed.toLocaleString()}+ <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>tin</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Đã xác thực & loại trừ dữ liệu nhiễu</div>
              </div>
            </div>

            {/* Experience Level Benchmark */}
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '36px', border: '1px solid #e2e8f0', marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                    Phân bổ mức lương theo Cấp bậc kinh nghiệm
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    Mức tối thiểu, trung vị và tối đa cho từng mốc số năm kinh nghiệm thực tế.
                  </p>
                </div>
                <Link
                  to="/jobs"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#4f46e5',
                    fontWeight: 600,
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  Tìm việc theo cấp bậc <ArrowRight size={16} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {insights.byExperienceLevel.map((lvl) => {
                  const maxPossible = 120;
                  const leftPercent = (Number(lvl.minSalaryMillionVnd) / maxPossible) * 100;
                  const widthPercent = Math.max(10, ((Number(lvl.maxSalaryMillionVnd) - Number(lvl.minSalaryMillionVnd)) / maxPossible) * 100);

                  return (
                    <div key={lvl.title} style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>{lvl.title}</span>
                        <div style={{ fontSize: '14px' }}>
                          <span style={{ color: '#64748b' }}>Khoảng lương: </span>
                          <strong style={{ color: '#0f172a' }}>{lvl.minSalaryMillionVnd} - {lvl.maxSalaryMillionVnd} triệu</strong>
                          <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                          <span style={{ color: '#4f46e5', fontWeight: 600 }}>Trung vị: {lvl.medianSalaryMillionVnd} tr</span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '999px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute',
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
                          borderRadius: '999px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Grid: Top Skills & Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
              {/* Top Paying Skills */}
              <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} style={{ color: '#4f46e5' }} /> Top Kỹ năng có mức lương cao nhất
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {insights.topPayingSkills.map((sk, idx) => (
                    <div
                      key={sk.skill}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: idx < 3 ? '#4f46e5' : '#e2e8f0',
                          color: idx < 3 ? '#ffffff' : '#64748b',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{sk.skill}</span>
                      </div>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>~{sk.medianSalaryMillionVnd} tr/tháng</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} style={{ color: '#2563eb' }} /> Mặt bằng lương theo Ngành nghề
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {insights.byCategory.map((cat) => (
                    <div
                      key={cat.category}
                      style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '14px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{cat.category}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{cat.jobCount} tin tuyển dụng</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#4f46e5', fontWeight: 700 }}>{cat.medianSalaryMillionVnd} tr</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>({cat.minSalaryMillionVnd} - {cat.maxSalaryMillionVnd} tr)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Banner CTA */}
            <div style={{
              marginTop: '48px',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px 0' }}>
                Tìm kiếm cơ hội việc làm với mức đãi ngộ xứng đáng
              </h3>
              <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                Hàng ngàn việc làm được cập nhật liên tục với mức lương công khai, minh bạch từ các nhà tuyển dụng hàng đầu.
              </p>
              <Link
                to="/jobs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  background: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '15px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                }}
              >
                Khám phá việc làm ngay <ArrowRight size={18} />
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
