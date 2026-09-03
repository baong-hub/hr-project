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
      if (response.succeeded) {
        setCvs(response.data);
      } else {
        setError(response.message || 'Không thể lấy danh sách CV.');
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
      if (response.succeeded) {
        setSuccess('Tải lên CV mới thành công!');
        setCvTitle('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadCvs();
      } else {
        setError(response.message || 'Tải lên CV thất bại.');
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
      if (response.succeeded) {
        setSuccess('Đã đổi CV chính thành công.');
        loadCvs();
      } else {
        setError(response.message || 'Không thể đổi CV chính.');
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
      if (response.succeeded) {
        setSuccess('Xóa CV thành công.');
        loadCvs();
      } else {
        setError(response.message || 'Không thể xóa CV.');
      }
    } catch (err: any) {
      setError('Có lỗi xảy ra khi xóa CV.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Quản lý CV của tôi
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Hồ sơ của bạn tối đa chứa 5 bản CV. Hãy thiết lập một bản CV chính để tự động ứng tuyển vào các công việc.
        </p>
      </div>

      {success && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10b981',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          color: '#10b981'
        }}>
          <CheckCircle2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{success}</span>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger-default)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          color: 'var(--color-danger-default)'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* BLOCK 1: Tải lên CV */}
      <div style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-default)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileUp style={{ color: '#10b981' }} />
          Tải lên bản CV mới
        </h2>

        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Dropzone Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#10b981' : 'var(--color-border-default)'}`,
                backgroundColor: dragOver ? 'rgba(16, 185, 129, 0.05)' : 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: cvs.length >= 5 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: cvs.length >= 5 ? 0.6 : 1
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="application/pdf"
                disabled={cvs.length >= 5}
                style={{ display: 'none' }}
              />
              <FileUp style={{ width: '48px', height: '48px', color: dragOver ? '#10b981' : 'var(--color-text-muted)', marginBottom: '16px' }} />
              
              {selectedFile ? (
                <div>
                  <p style={{ fontWeight: 600, color: '#10b981', margin: '0 0 4px 0' }}>{selectedFile.name}</p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Kích thước: {formatBytes(selectedFile.size)}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
                    Kéo thả tệp tin CV vào đây hoặc click để chọn tệp
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Chỉ hỗ trợ định dạng PDF. Dung lượng nhỏ hơn 5MB.
                  </p>
                </div>
              )}
            </div>

            {/* Title Input */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Tiêu đề bản CV
              </label>
              <input 
                type="text" 
                value={cvTitle}
                onChange={(e) => setCvTitle(e.target.value)}
                placeholder="Nhập tiêu đề CV (ví dụ: CV - Kỹ Sư C# Back-end)"
                disabled={cvs.length >= 5}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Info style={{ width: '16px', height: '16px', color: '#10b981' }} />
              Số lượng CV hiện tại: <strong>{cvs.length} / 5</strong>
            </span>

            <button 
              type="submit"
              disabled={uploading || !selectedFile || cvs.length >= 5}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: !selectedFile || cvs.length >= 5 ? 'var(--color-border-default)' : '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: uploading || !selectedFile || cvs.length >= 5 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {uploading && <Loader2 style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} />}
              Tải lên CV
            </button>
          </div>
        </form>
      </div>

      {/* BLOCK 2: Danh sách CV */}
      <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Layers style={{ color: '#10b981' }} />
        Danh sách CV đã tải lên
      </h2>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#10b981', width: '32px', height: '32px' }} />
        </div>
      ) : cvs.length === 0 ? (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border-default)'
        }}>
          <FileText style={{ width: '64px', height: '64px', color: 'var(--color-text-muted)', marginBottom: '16px', strokeWidth: 1.5 }} />
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Chưa có bản CV nào được tải lên
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '14px' }}>
            Hồ sơ trống sẽ làm bạn bỏ lỡ các cơ hội việc làm tốt. Hãy kéo thả tệp CV PDF ở trên để tải lên bản CV đầu tiên của bạn!
          </p>
        </div>
      ) : (
        /* Grid Cards List */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {cvs.map((cv) => (
            <div 
              key={cv.id}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${cv.isDefault ? '#10b981' : 'var(--color-border-default)'}`,
                boxShadow: cv.isDefault ? '0 4px 12px rgba(16, 185, 129, 0.1)' : 'var(--shadow-sm)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'transform 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-danger-default)'
                  }}>
                    <FileText style={{ width: '24px', height: '24px' }} />
                  </div>

                  {cv.isDefault && (
                    <span style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '50px'
                    }}>
                      CV chính
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0', lineBreak: 'anywhere' }}>
                  {cv.cvTitle}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 4px 0' }}>
                  Dung lượng: {formatBytes(cv.fileSizeBytes)}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 16px 0' }}>
                  Tải lên: {formatDate(cv.createdAt)}
                </p>
              </div>

              {/* Action Buttons inside Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--color-border-subtle)',
                paddingTop: '12px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Set Main CV Button */}
                  {!cv.isDefault && (
                    <button 
                      type="button"
                      disabled={processingId === cv.id}
                      onClick={() => handleSetDefault(cv.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      title="Đặt làm CV chính"
                    >
                      {processingId === cv.id ? (
                        <Loader2 style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} />
                      ) : (
                        <Star style={{ width: '18px', height: '18px' }} />
                      )}
                    </button>
                  )}

                  {/* View File Button */}
                  {cv.fileUrl && (
                    <a 
                      href={`${cv.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--color-text-secondary)',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                      }}
                      title="Xem CV"
                    >
                      <ExternalLink style={{ width: '18px', height: '18px' }} />
                    </a>
                  )}
                </div>

                {/* Delete Button */}
                <button 
                  type="button"
                  disabled={processingId === cv.id}
                  onClick={() => setCvToDelete(cv)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-danger-default)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                  }}
                  title="Xóa CV"
                >
                  <Trash2 style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {cvToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--color-bg-card)',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>
              Xác nhận xóa CV
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa bản CV <strong>"{cvToDelete.cvTitle}"</strong>? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setCvToDelete(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-danger-default)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
