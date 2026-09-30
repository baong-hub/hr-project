import React, { useState, useEffect, useRef } from 'react';
import { cvsService } from '../../../core/services/cvs.service';
import type { CandidateCvDto } from '../../../core/models/cv.model';
import { 
  FileUp, 
  FileText, 
  Trash2, 
  Star, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Layers
} from 'lucide-react';
import styles from './CandidateCvPage.module.scss';
import { FormField } from '../../../shared/components/form-field/FormField';
import { Modal } from '../../../shared/components/modal/Modal';

export const CandidateCvPage: React.FC = () => {
  // Data states
  const [cvs, setCvs] = useState<CandidateCvDto[]>([]);
  const [cvTitle, setCvTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // UI States
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Alert states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal confirm delete
  const [cvToDelete, setCvToDelete] = useState<CandidateCvDto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load CV list
  const loadCvs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cvsService.getCvs();
      if (response.success && response.data) {
        setCvs(response.data);
      } else {
        setError(response.error?.message || 'Không thể lấy danh sách CV.');
      }
    } catch (err: any) {
      setError('Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCvs();
  }, []);

  // Format File Size
  const formatBytes = (bytes?: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format Date
  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // Drag and drop handlers
  const [dragOver, setDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (cvs.length >= 5) {
      setError('Bạn đã đạt giới hạn tối đa 5 bản CV. Hãy xóa bớt CV cũ trước.');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setSuccess(null);

    // Mime format validation
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Chỉ chấp nhận tệp tin định dạng PDF.');
      setSelectedFile(null);
      return;
    }

    // Size limit validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng tệp tin không được vượt quá 5MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!cvTitle) {
      // Auto name CV based on file name (remove extension)
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setCvTitle(cleanName.substring(0, 50));
    }
  };

  // Upload handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Vui lòng chọn hoặc kéo thả tệp tin CV (PDF) vào khung.');
      return;
    }
    if (!cvTitle.trim()) {
      setError('Vui lòng nhập tiêu đề cho bản CV này.');
      return;
    }

    if (cvs.length >= 5) {
      setError('Bạn đã đạt giới hạn tối đa 5 bản CV. Vui lòng xóa bớt CV trước khi tải lên mới.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await cvsService.uploadCv(cvTitle, selectedFile);
      if (response.success) {
        setSuccess('Tải lên CV mới thành công!');
        setCvTitle('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadCvs();
      } else {
        setError(response.error?.message || 'Tải lên CV thất bại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải lên tệp tin.');
    } finally {
      setUploading(false);
    }
  };

  // Set Main/Default CV
  const handleSetDefault = async (id: number) => {
    setProcessingId(id);
    setError(null);
    setSuccess(null);
    try {
      const response = await cvsService.setDefaultCv(id);
      if (response.success) {
        setSuccess('Đã đổi CV chính thành công.');
        loadCvs();
      } else {
        setError(response.error?.message || 'Không thể đổi CV chính.');
      }
    } catch (err: any) {
      setError('Có lỗi xảy ra khi đổi CV chính.');
    } finally {
      setProcessingId(null);
    }
  };

  // Delete CV
  const handleDeleteConfirm = async () => {
    if (!cvToDelete) return;
    setProcessingId(cvToDelete.id);
    setError(null);
    setSuccess(null);
    const deleteId = cvToDelete.id;
    setCvToDelete(null);

    try {
      const response = await cvsService.deleteCv(deleteId);
      if (response.success) {
        setSuccess('Xóa CV thành công.');
        loadCvs();
      } else {
        setError(response.error?.message || 'Không thể xóa CV.');
      }
    } catch (err: any) {
      setError('Có lỗi xảy ra khi xóa CV.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Quản lý CV của tôi
        </h1>
        <p className={styles.subtitle}>
          Hồ sơ của bạn tối đa chứa 5 bản CV. Hãy thiết lập một bản CV chính để tự động ứng tuyển vào các công việc.
        </p>
      </div>

      {success && (
        <div className={styles.successAlert}>
          <CheckCircle2 />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className={styles.errorAlert}>
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* BLOCK 1: Tải lên CV */}
      <div className={styles.uploadCard}>
        <h2 className={styles.sectionTitle}>
          <FileUp />
          Tải lên bản CV mới
        </h2>

        <form onSubmit={handleUpload}>
          <div className={styles.formGrid}>
            {/* Dropzone Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                styles.dropzone,
                dragOver && styles.dropzoneActive,
                cvs.length >= 5 && styles.dropzoneDisabled
              ].filter(Boolean).join(' ')}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="application/pdf"
                disabled={cvs.length >= 5}
                className={styles.hiddenInput}
              />
              <FileUp className={`${styles.dropzoneIcon} ${dragOver ? styles.dropzoneIconActive : ''}`} />
              
              {selectedFile ? (
                <div>
                  <p className={styles.selectedFileName}>{selectedFile.name}</p>
                  <p className={styles.fileMeta}>
                    Kích thước: {formatBytes(selectedFile.size)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className={styles.dropzonePrompt}>
                    Kéo thả tệp tin CV vào đây hoặc click để chọn tệp
                  </p>
                  <p className={styles.dropzoneHint}>
                    Chỉ hỗ trợ định dạng PDF. Dung lượng nhỏ hơn 5MB.
                  </p>
                </div>
              )}
            </div>

            {/* Title Input */}
            <FormField
              label="Tiêu đề bản CV"
              placeholder="Nhập tiêu đề CV (ví dụ: CV - Kỹ Sư C# Back-end)"
              value={cvTitle}
              onChange={(e) => setCvTitle(e.target.value)}
              disabled={cvs.length >= 5}
            />
          </div>

          <div className={styles.formFooter}>
            <span className={styles.countInfo}>
              <Info />
              Số lượng CV hiện tại: <strong>{cvs.length} / 5</strong>
            </span>

            <button 
              type="submit"
              disabled={uploading || !selectedFile || cvs.length >= 5}
              className={styles.uploadBtn}
            >
              {uploading && <Loader2 className={styles.spinner} />}
              Tải lên CV
            </button>
          </div>
        </form>
      </div>

      {/* BLOCK 2: Danh sách CV */}
      <h2 className={styles.sectionTitle}>
        <Layers />
        Danh sách CV đã tải lên
      </h2>

      {loading ? (
        <div className={styles.loaderCenter}>
          <Loader2 />
        </div>
      ) : cvs.length === 0 ? (
        /* Empty State */
        <div className={styles.emptyState}>
          <FileText className={styles.emptyIcon} strokeWidth={1.5} />
          <h3>
            Chưa có bản CV nào được tải lên
          </h3>
          <p>
            Hồ sơ trống sẽ làm bạn bỏ lỡ các cơ hội việc làm tốt. Hãy kéo thả tệp CV PDF ở trên để tải lên bản CV đầu tiên của bạn!
          </p>
        </div>
      ) : (
        /* Grid Cards List */
        <div className={styles.cvGrid}>
          {cvs.map((cv) => (
            <div 
              key={cv.id}
              className={`${styles.cvCard} ${cv.isDefault ? styles.cvCardDefault : ''}`}
            >
              <div>
                <div className={styles.cardTop}>
                  <div className={styles.pdfIconBox}>
                    <FileText />
                  </div>

                  {cv.isDefault && (
                    <span className={styles.defaultBadge}>
                      CV chính
                    </span>
                  )}
                </div>

                <h3 className={styles.cvCardTitle}>
                  {cv.cvTitle}
                </h3>

                <p className={styles.cvCardMeta}>
                  Dung lượng: {formatBytes(cv.fileSizeBytes)}
                </p>
                <p className={styles.cvCardDate}>
                  Tải lên: {formatDate(cv.createdAt)}
                </p>
              </div>

              {/* Action Buttons inside Card */}
              <div className={styles.cardActions}>
                <div className={styles.leftActions}>
                  {/* Set Main CV Button */}
                  {!cv.isDefault && (
                    <button 
                      type="button"
                      disabled={processingId === cv.id}
                      onClick={() => handleSetDefault(cv.id)}
                      className={styles.iconBtn}
                      title="Đặt làm CV chính"
                    >
                      {processingId === cv.id ? (
                        <Loader2 className={styles.spinner} />
                      ) : (
                        <Star />
                      )}
                    </button>
                  )}

                  {/* View File Button */}
                  {cv.fileUrl && (
                    <a 
                      href={`${cv.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.iconBtn}
                      title="Xem CV"
                    >
                      <ExternalLink />
                    </a>
                  )}
                </div>

                {/* Delete Button */}
                <button 
                  type="button"
                  disabled={processingId === cv.id}
                  onClick={() => setCvToDelete(cv)}
                  className={styles.deleteBtn}
                  title="Xóa CV"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={Boolean(cvToDelete)}
        onClose={() => setCvToDelete(null)}
        title="Xác nhận xóa CV"
        size="sm"
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setCvToDelete(null)}
              className={styles.modalCancelBtn}
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleDeleteConfirm}
              className={styles.modalConfirmBtn}
            >
              Xác nhận xóa
            </button>
          </>
        }
      >
        <p className={styles.modalDesc}>
          Bạn có chắc chắn muốn xóa bản CV <strong>"{cvToDelete?.cvTitle}"</strong>? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
};
