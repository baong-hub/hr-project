import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import styles from './DigitalSignatureModal.module.scss';

interface DigitalSignatureModalProps {
  candidateDefaultName: string;
  positionTitle: string;
  companyName: string;
  onConfirm: (signatureData: string, signerFullName: string) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  candidateDefaultName,
  positionTitle,
  companyName,
  onConfirm,
  onClose,
  submitting
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(candidateDefaultName || '');
  const [agreeConsent, setAgreeConsent] = useState(false);
  const [signMode, setSignMode] = useState<'DRAW' | 'TYPE'>('DRAW');
  const [typedSignature, setTypedSignature] = useState(candidateDefaultName || '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set background to pure white for proper PNG export
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgb(30, 58, 138)'; // Formal ink color
  }, [signMode]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signerName.trim()) {
      alert('Vui lòng nhập họ và tên người ký.');
      return;
    }

    if (!agreeConsent) {
      alert('Vui lòng đồng ý điều khoản sử dụng chữ ký điện tử.');
      return;
    }

    let finalSignatureData = '';
    if (signMode === 'DRAW') {
      if (!hasDrawn || !canvasRef.current) {
        alert('Vui lòng vẽ chữ ký của bạn trên khung ký.');
        return;
      }
      finalSignatureData = canvasRef.current.toDataURL('image/png');
    } else {
      if (!typedSignature.trim()) {
        alert('Vui lòng nhập chữ ký dạng chữ.');
        return;
      }
      // Generate canvas representation of typed signature
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 500;
      offCanvas.height = 180;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.fillStyle = 'rgb(255, 255, 255)';
        offCtx.fillRect(0, 0, 500, 180);
        offCtx.font = 'italic bold 38px "Dancing Script", "Brush Script MT", cursive, sans-serif';
        offCtx.fillStyle = 'rgb(30, 58, 138)';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(typedSignature, 250, 90);
        finalSignatureData = offCanvas.toDataURL('image/png');
      }
    }

    await onConfirm(finalSignatureData, signerName.trim());
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <PenTool size={20} />
            </div>
            <div>
              <h3 className={styles.title}>
                Ký Điện Tử Thư Mời Nhận Việc (E-Signature)
              </h3>
              <p className={styles.subtitle}>
                {positionTitle} • {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.closeBtn}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Signer Legal Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Họ và tên pháp lý người ký <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="VD: NGUYỄN VĂN AN"
              className={styles.input}
            />
          </div>

          {/* Mode Switcher */}
          <div className={styles.modeHeader}>
            <label className={styles.label}>
              Khung chữ ký điện tử <span className={styles.required}>*</span>
            </label>
            <div className={styles.modeTabs}>
              <button
                type="button"
                onClick={() => setSignMode('DRAW')}
                className={`${styles.modeTab} ${signMode === 'DRAW' ? styles.active : ''}`}
              >
                Vẽ tay trên màn hình
              </button>
              <button
                type="button"
                onClick={() => setSignMode('TYPE')}
                className={`${styles.modeTab} ${signMode === 'TYPE' ? styles.active : ''}`}
              >
                Nhập tên tạo chữ ký
              </button>
            </div>
          </div>

          {/* Signature Canvas / Type area */}
          {signMode === 'DRAW' ? (
            <div className={styles.canvasBox}>
              <canvas
                ref={canvasRef}
                width={520}
                height={160}
                className={styles.canvas}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className={styles.canvasHint}>
                  Dùng ngón tay hoặc chuột để ký tên vào đây
                </div>
              )}
              <button
                type="button"
                onClick={clearCanvas}
                className={styles.clearBtn}
                title="Xoá chữ ký để vẽ lại"
              >
                <RotateCcw size={14} />
                Vẽ lại
              </button>
            </div>
          ) : (
            <div className={styles.typedContainer}>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className={styles.input}
              />
              <div className={styles.typedPreview}>
                <span className={styles.typedText}>
                  {typedSignature || 'Chữ ký mẫu'}
                </span>
              </div>
            </div>
          )}

          {/* Legal Compliance Checkbox */}
          <label className={styles.consentBox}>
            <input
              type="checkbox"
              checked={agreeConsent}
              onChange={(e) => setAgreeConsent(e.target.checked)}
            />
            <span className={styles.consentText}>
              Tôi xác nhận ký điện tử chấp thuận Thư mời nhận việc theo <strong>Luật Giao dịch Điện tử Việt Nam số 20/2023/QH15</strong>. Chữ ký này có giá trị ràng buộc cam kết gia nhập công ty.
            </span>
          </label>

          {/* Action Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !agreeConsent || (signMode === 'DRAW' && !hasDrawn)}
              className={styles.submitBtn}
            >
              {submitting ? (
                <span>Đang xử lý ký...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Xác nhận ký điện tử & Nhận việc
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
