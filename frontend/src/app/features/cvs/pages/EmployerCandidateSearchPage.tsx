import React, { useState, useEffect } from 'react';
import { cvsService } from '../../../core/services/cvs.service';
import type { CandidateProfileDto } from '../../../core/models/cv.model';
import { 
  Search, 
  Tag, 
  Mail, 
  UserCheck, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  FilterX,
  FileText
} from 'lucide-react';

export const EmployerCandidateSearchPage: React.FC = () => {
  // Filter States
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Search trigger helper (to avoid calling API on every keystroke)
  const [triggerQuery, setTriggerQuery] = useState(0);

  // Result data states
  const [candidates, setCandidates] = useState<CandidateProfileDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch candidates from API
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await cvsService.searchCandidates({
          page,
          pageSize,
          skill: skill.trim() || undefined,
          search: search.trim() || undefined
        });

        if (response.success && response.data) {
          setCandidates(response.data);
        } else {
          setError(response.error?.message || 'Không thể tìm kiếm hồ sơ.');
        }
      } catch (err: any) {
        setError('Có lỗi xảy ra khi kết nối máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [page, triggerQuery]);

  // Submit filters
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setTriggerQuery(prev => prev + 1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearch('');
    setSkill('');
    setPage(1);
    setTriggerQuery(prev => prev + 1);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Tìm kiếm hồ sơ ứng viên
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Tìm kiếm hồ sơ nhân sự, lọc theo kỹ năng và tóm tắt kinh nghiệm làm việc để tuyển dụng ứng viên phù hợp.
        </p>
      </div>

      {/* FILTER PANEL */}
      <div style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-default)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', alignItems: 'end' }}>
          
          {/* Keyword Search */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Từ khóa tìm kiếm
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên ứng viên hoặc kinh nghiệm..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', width: '16px', height: '16px' }} />
            </div>
          </div>

          {/* Skill Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Lọc theo Kỹ năng
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Ví dụ: C#, React, SQL..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Tag style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', width: '16px', height: '16px' }} />
            </div>
          </div>

          {/* Buttons Area */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="submit"
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Search style={{ width: '16px', height: '16px' }} />
              Tìm kiếm
            </button>

            {(search || skill) && (
              <button 
                type="button"
                onClick={handleClearFilters}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Xóa lọc
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger-default)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          color: 'var(--color-danger-default)',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

      {/* RESULTS LIST */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
          <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#10b981', width: '32px', height: '32px' }} />
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Đang tìm kiếm ứng viên tốt nhất...</span>
        </div>
      ) : candidates.length === 0 ? (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border-default)'
        }}>
          <FilterX style={{ width: '64px', height: '64px', color: 'var(--color-text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Không tìm thấy ứng viên nào phù hợp
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '14px' }}>
            Chúng tôi không tìm thấy hồ sơ nào chứa từ khóa "{search || skill}". Hãy thử thay đổi bộ lọc hoặc rút ngắn từ khóa.
          </p>
        </div>
      ) : (
        /* Cards Layout */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {candidates.map((candidate) => (
            <div 
              key={candidate.id}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-default)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                transition: 'border-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: '300px' }}>
                {/* Simulated Avatar or Placeholder */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '24px',
                  flexShrink: 0,
                  border: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {candidate.fullName.charAt(0)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                      {candidate.fullName}
                    </h3>
                    <span style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '50px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <UserCheck style={{ width: '12px', height: '12px' }} />
                      PUBLIC
                    </span>
                  </div>

                  <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text-secondary)',
                    margin: '0 0 12px 0',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {candidate.objective || 'Chưa cập nhật phần giới thiệu bản thân.'}
                  </p>

                  {/* Skills tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {candidate.skills && candidate.skills.map((s, idx) => (
                      <span 
                        key={idx}
                        style={{
                          fontSize: '12px',
                          padding: '3px 8px',
                          backgroundColor: 'var(--color-bg-subtle)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '4px',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {(!candidate.skills || candidate.skills.length === 0) && (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Không có thông tin kỹ năng.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignSelf: 'center', flexShrink: 0 }}>
                <button 
                  type="button"
                  onClick={() => alert(`Đang mở kết nối chat/gửi email đến ứng viên ${candidate.fullName}`)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Mail style={{ width: '14px', height: '14px' }} />
                  Liên hệ
                </button>
                <button 
                  type="button"
                  onClick={() => alert('Xem tóm tắt thông tin năng lực của ứng viên')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText style={{ width: '14px', height: '14px' }} />
                  Xem CV
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {candidates.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginTop: '32px'
        }}>
          <button 
            type="button"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-primary)',
              opacity: page === 1 ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            Trang trước
          </button>
          <span style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
            Trang {page}
          </span>
          <button 
            type="button"
            disabled={candidates.length < pageSize}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              cursor: candidates.length < pageSize ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-primary)',
              opacity: candidates.length < pageSize ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            Trang sau
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}
    </div>
  );
};
