import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, DollarSign, Calendar, Heart, AlertCircle, Search } from 'lucide-react';
import { savedJobService } from '../../../core/services/saved-job.service';
import { authService } from '../../../core/services/auth.service';
import type { SavedJobDto } from '../../../core/models/saved-job.model';
import styles from './SavedJobListPage.module.scss';

export const SavedJobListPage: React.FC = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJobDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [undoItem, setUndoItem] = useState<{ job: SavedJobDto; index: number } | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchSavedJobs = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await savedJobService.getSavedJobs({ page: 1, pageSize: 100 });
      if (response.data.success && response.data.data) {
        setSavedJobs(response.data.data.items);
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const user = authService.getUser();
    const userRole = user?.role || user?.accountType || '';
    const roles = (user?.roles as string[]) || [];
    const isCandidate = userRole === 'CANDIDATE' || userRole === 'User' || roles.includes('Ứng viên');
    const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin') || user?.username === 'admin' || userRole === 'Admin' || userRole === 'ADMIN';

    if (user && (isSuperAdmin || !isCandidate)) {
      navigate('/', { replace: true });
      return;
    }

    fetchSavedJobs();
    return () => {
      if (undoTimeoutId) {
        window.clearTimeout(undoTimeoutId);
      }
    };
  }, []);

  const handleToggleSave = async (job: SavedJobDto, index: number) => {
    // Clear existing undo timer if clicked on another item
    if (undoTimeoutId) {
      window.clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
      setUndoItem(null);
    }

    try {
      // Optimistic update
      const updatedJobs = [...savedJobs];
      updatedJobs.splice(index, 1);
      setSavedJobs(updatedJobs);

      // Save undo item
      setUndoItem({ job, index });

      // Call API
      const response = await savedJobService.toggleSave(job.jobId);
      
      if (!response.data.success) {
        // Rollback
        setSavedJobs(savedJobs);
        setUndoItem(null);
      } else {
        // Start undo timeout (5 seconds)
        const timeout = window.setTimeout(() => {
          setUndoItem(null);
          setUndoTimeoutId(null);
        }, 5000) as unknown as number;
        setUndoTimeoutId(timeout);
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      // Rollback
      setSavedJobs(savedJobs);
      setUndoItem(null);
    }
  };

  const handleUndo = async () => {
    if (!undoItem) return;
    
    if (undoTimeoutId) {
      window.clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }

    const { job, index } = undoItem;
    
    try {
      // Optimistic rollback
      const updatedJobs = [...savedJobs];
      updatedJobs.splice(index, 0, job);
      setSavedJobs(updatedJobs);
      setUndoItem(null);

      // Re-save via API
      await savedJobService.toggleSave(job.jobId);
    } catch (error) {
      console.error('Failed to undo unsave:', error);
      // Fetch latest list to be sure
      fetchSavedJobs();
    }
  };

  const handleApply = (jobId: number) => {
    navigate(`/jobs/${jobId}`);
  };

  const formatSalary = (from?: number, to?: number) => {
    if (from === undefined && to === undefined) return 'Thỏa thuận';
    if (from !== undefined && to !== undefined) return `${(from / 1000000).toFixed(0)} - ${(to / 1000000).toFixed(0)} tr`;
    if (from !== undefined) return `Từ ${(from / 1000000).toFixed(0)} tr`;
    if (to !== undefined) return `Đến ${(to / 1000000).toFixed(0)} tr`;
    return 'Thỏa thuận';
  };

  const isExpiredOrClosed = (status: string) => {
    return status === 'EXPIRED' || status === 'CLOSED';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.stateText}>Đang tải danh sách việc làm đã lưu...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.stateContainer}>
        <AlertCircle size={40} className={styles.errorIcon} />
        <p className={styles.stateText_error}>Không thể tải dữ liệu việc làm đã lưu.</p>
        <button className={styles.btnRetry} onClick={fetchSavedJobs}>
          Thử lại
        </button>
      </div>
    );
  }

  if (savedJobs.length === 0 && !undoItem) {
    return (
      <div className={styles.stateContainer}>
        <Heart size={48} className={styles.emptyIcon} />
        <h2>Chưa lưu việc làm nào</h2>
        <p className={styles.emptyText}>Hãy khám phá và lưu các cơ hội phù hợp với bạn!</p>
        <button className={styles.btnDiscover} onClick={() => navigate('/jobs')}>
          <Search size={16} /> Khám phá ngay
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1>Việc làm đã lưu của bạn</h1>
          <p className={styles.subtitle}>Danh sách các cơ hội nghề nghiệp bạn quan tâm</p>
        </div>
      </div>

      {undoItem && (
        <div className={styles.undoBanner}>
          <span>Đã hủy lưu việc làm <strong>{undoItem.job.title}</strong></span>
          <button className={styles.btnUndo} onClick={handleUndo}>Hoàn tác</button>
        </div>
      )}

      <div className={styles.jobsList}>
        {savedJobs.map((job, index) => {
          const disabled = isExpiredOrClosed(job.jobStatus);
          
          return (
            <div 
              key={job.jobId} 
              className={`${styles.jobCard} ${disabled ? styles.jobCard_disabled : ''}`}
            >
              <div className={styles.cardMain}>
                <div className={styles.logoWrapper}>
                  {job.companyLogoUrl ? (
                    <img src={job.companyLogoUrl} alt={job.companyName} className={styles.companyLogo} />
                  ) : (
                    <div className={styles.logoPlaceholder}>
                      {(job.companyName || 'CO').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.infoWrapper}>
                  <div className={styles.titleRow}>
                    <h3 onClick={() => !disabled && navigate(`/jobs/${job.jobId}`)} className={styles.jobTitle}>
                      {job.title}
                    </h3>
                    {disabled && (
                      <span className={styles.expiredBadge}>
                        {job.jobStatus === 'CLOSED' ? 'Đã đóng tin' : 'Hết hạn'}
                      </span>
                    )}
                  </div>
                  
                  <p className={styles.companyName}>{job.companyName}</p>

                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <DollarSign size={14} />
                      {formatSalary(job.salaryFrom, job.salaryTo)}
                    </span>
                    <span className={styles.metaItem}>
                      <MapPin size={14} />
                      {job.city}
                    </span>
                    <span className={styles.metaItem}>
                      <Calendar size={14} />
                      Hạn nộp: {formatDate(job.expiredAt)}
                    </span>
                  </div>

                  <p className={styles.savedAt}>
                    Đã lưu ngày: {formatDate(job.savedAt)}
                  </p>
                </div>

                <button 
                  className={styles.btnBookmark} 
                  onClick={() => handleToggleSave(job, index)}
                  title="Hủy lưu việc làm"
                >
                  <Bookmark size={20} className={styles.bookmarkIcon} />
                </button>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={styles.btnApply} 
                  disabled={disabled}
                  onClick={() => handleApply(job.jobId)}
                >
                  Ứng tuyển ngay
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
