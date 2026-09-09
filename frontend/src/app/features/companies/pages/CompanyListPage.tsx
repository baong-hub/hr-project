import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesService } from '../../../core/services/companies.service';
import type { CompanyDto } from '../../../core/models/company.model';

export const CompanyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(9);
  const [total, setTotal] = useState<number>(0);

  const industries = [
    'Công nghệ thông tin',
    'Tài chính / Ngân hàng',
    'Marketing / Quảng cáo',
    'Y tế / Sức khỏe',
    'Giáo dục / Đào tạo',
    'Bán lẻ / Tiêu dùng',
    'Khác',
  ];

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await companiesService.getCompanies({
        page,
        pageSize,
        search: search || undefined,
        industry: industry || undefined,
      });

      if (response.data.success && response.data.data) {
        const raw = response.data.data;
        if (Array.isArray(raw)) {
          setCompanies(raw);
          setTotal(raw.length);
        } else if (Array.isArray(raw.items)) {
          setCompanies(raw.items);
          setTotal(raw.meta?.total ?? raw.items.length);
        }
      } else {
        setError(response.data.error?.message || 'Có lỗi xảy ra khi lấy danh sách doanh nghiệp.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Không thể kết nối đến hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, industry]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleReset = () => {
    setSearch('');
    setIndustry('');
    setPage(1);
    companiesService.getCompanies({ page: 1, pageSize }).then((res) => {
      if (res.data.success && res.data.data) {
        const raw = res.data.data;
        setCompanies(Array.isArray(raw) ? raw : (raw.items || []));
        setTotal(Array.isArray(raw) ? raw.length : (raw.meta?.total || 0));
      }
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>
          Khám Phá Doanh Nghiệp
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
          Tìm hiểu văn hóa, môi trường làm việc và cơ hội nghề nghiệp tại các doanh nghiệp hàng đầu.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{
        display: 'flex',
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border-default)',
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên công ty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <select
            value={industry}
            onChange={(e) => {
              setIndustry(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-base)',
              outline: 'none',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              boxSizing: 'border-box'
            }}
          >
            <option value="">Tất cả ngành nghề</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flex: '0 0 auto' }}>
          <button type="submit" style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-brand-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-base)'
          }}>
            Tìm kiếm
          </button>
          <button type="button" onClick={handleReset} style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-bg-app)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 'var(--font-weight-medium)',
            fontSize: 'var(--font-size-base)'
          }}>
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
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
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          Đang tải dữ liệu doanh nghiệp...
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-danger)',
          marginBottom: 'var(--space-6)',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Grid List */}
      {!loading && !error && (
        <>
          {companies.length === 0 ? (
            /* Empty state */
            <div style={{
              padding: 'var(--space-16) 0',
              textAlign: 'center',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-text-muted)'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 'var(--space-4)', opacity: 0.6 }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
              <h3 style={{ margin: '0 0 var(--space-2)', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-lg)' }}>
                Không tìm thấy doanh nghiệp
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>Thử thay đổi từ khóa hoặc bộ lọc ngành nghề khác.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-8)'
            }}>
              {companies.map((company) => (
                <div key={company.id} style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border-default)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform var(--transition-fast), boxShadow var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                >
                  {/* Banner */}
                  <div style={{
                    height: '100px',
                    backgroundColor: company.bannerUrl ? 'transparent' : 'var(--color-brand-primary-soft)',
                    backgroundImage: company.bannerUrl ? `url(${company.bannerUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    {/* Logo Overlay */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#fff',
                      border: '2px solid #fff',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'absolute',
                      bottom: '-20px',
                      left: 'var(--space-4)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontWeight: 'bold', color: 'var(--color-brand-primary)', fontSize: '20px' }}>
                          {company.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{
                    padding: 'var(--space-6) var(--space-4) var(--space-4)',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h3 style={{
                        margin: 'var(--space-2) 0 var(--space-2)',
                        fontSize: 'var(--font-size-lg)',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {company.name}
                      </h3>

                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: 'var(--color-info-bg)',
                          color: 'var(--color-info)',
                          fontSize: 'var(--font-size-xs)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {company.industry}
                        </span>
                        <span style={{
                          backgroundColor: 'var(--color-bg-app)',
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--font-size-xs)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          Quy mô: {company.sizeRange}
                        </span>
                      </div>

                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                        margin: 'var(--space-2) 0',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '38px'
                      }}>
                        Địa chỉ: {company.address}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--color-border-default)',
                      paddingTop: 'var(--space-4)',
                      marginTop: 'var(--space-4)',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)'
                    }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-brand-primary-dark)', fontWeight: 'var(--font-weight-semibold)' }}>
                        Đang mở tuyển dụng
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/companies/${company.id}/careers`);
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 'var(--font-weight-medium)',
                            fontSize: 'var(--font-size-xs)',
                            transition: 'opacity var(--transition-fast)'
                          }}
                          title="Xem cổng tuyển dụng và cơ hội việc làm"
                        >
                          Cơ hội việc làm
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/companies/${company.id}`);
                          }}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: 'var(--color-brand-secondary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 'var(--font-weight-medium)',
                            fontSize: 'var(--font-size-xs)',
                            transition: 'background-color var(--transition-fast)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand-secondary-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-brand-secondary)'}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Trước
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const p = index + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: page === p ? 'var(--color-brand-primary)' : 'var(--color-bg-card)',
                      color: page === p ? '#fff' : 'var(--color-text-primary)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
