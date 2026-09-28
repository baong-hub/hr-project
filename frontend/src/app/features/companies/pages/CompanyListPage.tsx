import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building2, Search, MapPin, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import { companiesService } from '../../../core/services/companies.service';
import { metaService, type ProvinceItem, type IndustryItem } from '../../../core/services/meta.service';
import type { CompanyDto } from '../../../core/models/company.model';
import { SeoHead } from '../../../shared/components/SeoHead';
import styles from './CompanyListPage.module.scss';

export const CompanyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Reference Metadata
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);

  // Company List State
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters from URL
  const search = searchParams.get('q') || '';
  const selectedIndustry = searchParams.get('industry') || '';
  const selectedProvince = searchParams.get('province') || '';
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = 12;

  // Local form inputs
  const [keywordInput, setKeywordInput] = useState(search);
  const [industryInput, setIndustryInput] = useState(selectedIndustry);
  const [provinceInput, setProvinceInput] = useState(selectedProvince);

  // Load Metadata
  useEffect(() => {
    Promise.all([metaService.getIndustries(), metaService.getProvinces()])
      .then(([indList, provList]) => {
        setIndustries(indList);
        setProvinces(provList);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch Companies
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await companiesService.getCompanies({
        page,
        pageSize,
        search: search || undefined,
        industry: selectedIndustry || undefined,
      });

      if (res.data?.success && res.data.data) {
        const raw = res.data.data;
        if (Array.isArray(raw)) {
          setCompanies(raw);
          setTotal(raw.length);
        } else if (Array.isArray((raw as any).items)) {
          setCompanies((raw as any).items);
          setTotal((raw as any).meta?.total ?? (raw as any).items.length);
        }
      } else {
        setError(res.data?.error?.message || 'Có lỗi xảy ra khi tải danh sách doanh nghiệp.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedIndustry]);

  useEffect(() => {
    setKeywordInput(search);
    setIndustryInput(selectedIndustry);
    setProvinceInput(selectedProvince);
    fetchCompanies();
  }, [search, selectedIndustry, selectedProvince, page, fetchCompanies]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (keywordInput.trim()) next.set('q', keywordInput.trim());
    else next.delete('q');

    if (industryInput.trim()) next.set('industry', industryInput.trim());
    else next.delete('industry');

    if (provinceInput.trim()) next.set('province', provinceInput.trim());
    else next.delete('province');

    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setKeywordInput('');
    setIndustryInput('');
    setProvinceInput('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={styles.companyListPage}>
      <SeoHead
        title="Danh sách Doanh nghiệp & Nhà tuyển dụng | HR Portal"
        description="Khám phá các doanh nghiệp uy tín, tìm hiểu quy mô, môi trường làm việc và các vị trí tuyển dụng đang mở trên HR Portal."
      />

      {/* Header Banner */}
      <section className={styles.headerCard} aria-label="Tiêu đề trang">
        <div className={styles.titleWrap}>
          <h1>Khám phá Doanh nghiệp</h1>
          <p>
            Tìm hiểu thông tin pháp nhân, quy mô và các cơ hội nghề nghiệp đang mở tại các nhà tuyển dụng
          </p>
        </div>
        <div className={styles.countBadge}>
          <Building2 size={16} />
          <span>{total.toLocaleString('vi-VN')} doanh nghiệp</span>
        </div>
      </section>

      {/* Filter Strip */}
      <form onSubmit={handleSearchSubmit} className={styles.filterStrip} aria-label="Bộ lọc doanh nghiệp">
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm theo tên doanh nghiệp..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
        </div>

        <div className={styles.selectBox}>
          <select
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            aria-label="Chọn ngành nghề"
          >
            <option value="">Tất cả ngành nghề</option>
            {industries.map((ind) => (
              <option key={ind.code} value={ind.name}>
                {ind.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectBox}>
          <select
            value={provinceInput}
            onChange={(e) => setProvinceInput(e.target.value)}
            aria-label="Chọn khu vực"
          >
            <option value="">Toàn quốc</option>
            {provinces.map((prov) => (
              <option key={prov.code} value={prov.name}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterBtnRow}>
          <button type="submit" className={styles.searchBtn}>
            Tìm kiếm
          </button>
          <button type="button" className={styles.clearBtn} onClick={handleResetFilters}>
            Đặt lại
          </button>
        </div>
      </form>

      {/* Company Grid */}
      <main aria-label="Danh sách doanh nghiệp">
        {loading ? (
          <div className={styles.emptyState}>
            <Building2 size={36} />
            <h3>Đang tải dữ liệu doanh nghiệp...</h3>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <h3>Đã xảy ra lỗi</h3>
            <p>{error}</p>
          </div>
        ) : companies.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={36} />
            <h3>Không tìm thấy doanh nghiệp phù hợp</h3>
            <p>Hãy thử thay đổi từ khóa hoặc bộ lọc ngành nghề để tìm kiếm thêm.</p>
          </div>
        ) : (
          <div className={styles.companyGrid}>
            {companies.map((company) => {
              const initial = company.name ? company.name.trim().charAt(0).toUpperCase() : 'C';

              return (
                <article
                  key={company.id}
                  className={styles.companyCard}
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.logoBox}>
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt={company.name} loading="lazy" />
                      ) : (
                        <span className={styles.logoInitial}>{initial}</span>
                      )}
                    </div>
                    <div className={styles.titleSection}>
                      <div className={styles.nameRow}>
                        <h2 className={styles.companyName} title={company.name}>
                          {company.name}
                        </h2>
                        {(company.isVerified || company.verificationStatus === 'VERIFIED') && (
                          <CheckCircle2
                            size={15}
                            className={styles.verifiedCheck}
                            aria-label="Doanh nghiệp đã xác thực"
                          />
                        )}
                      </div>
                      <p className={styles.industryText}>{company.industry || 'Đa ngành nghề'}</p>
                    </div>
                  </div>

                  <div className={styles.cardMetaList}>
                    {company.sizeRange && (
                      <div className={styles.metaLine}>
                        <Users size={13} className={styles.metaIcon} />
                        <span>Quy mô: {company.sizeRange}</span>
                      </div>
                    )}
                    {company.address && (
                      <div className={styles.metaLine} title={company.address}>
                        <MapPin size={13} className={styles.metaIcon} />
                        <span>{company.address}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.activeJobsCount}>
                      {company.activeJobsCount && company.activeJobsCount > 0
                        ? `${company.activeJobsCount} việc làm đang tuyển`
                        : 'Xem cơ hội việc làm'}
                    </span>
                    <Link
                      to={`/companies/${company.id}`}
                      className={styles.viewDetailLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Chi tiết</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Phân trang doanh nghiệp">
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              ‹ Trước
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx + 1}
                type="button"
                className={`${styles.pageBtn} ${page === idx + 1 ? styles.active : ''}`}
                onClick={() => handlePageChange(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Sau ›
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default CompanyListPage;
