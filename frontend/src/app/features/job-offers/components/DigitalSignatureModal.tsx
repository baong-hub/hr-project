import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, X, CheckCircle2 } from 'lucide-react';

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

    // Set background to pure white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Deep formal blue ink
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

    ctx.fillStyle = '#ffffff';
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
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, 500, 180);
        offCtx.font = 'italic bold 38px "Dancing Script", "Brush Script MT", cursive, sans-serif';
        offCtx.fillStyle = '#1e3a8a';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(typedSignature, 250, 90);
        finalSignatureData = offCanvas.toDataURL('image/png');
      }
    }

    await onConfirm(finalSignatureData, signerName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ký Điện Tử Thư Mời Nhận Việc (E-Signature)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {positionTitle} • {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Signer Legal Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Họ và tên pháp lý người ký <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="VD: NGUYỄN VĂN AN"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Khung chữ ký điện tử <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setSignMode('DRAW')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  signMode === 'DRAW'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Vẽ tay trên màn hình
              </button>
              <button
                type="button"
                onClick={() => setSignMode('TYPE')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  signMode === 'TYPE'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Nhập tên tạo chữ ký
              </button>
            </div>
          </div>

          {/* Signature Canvas / Type area */}
          {signMode === 'DRAW' ? (
            <div className="relative border-2 border-dashed border-blue-200 dark:border-blue-900/60 rounded-xl overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={520}
                height={160}
                className="w-full h-40 touch-none cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                  Dùng ngón tay hoặc chuột để ký tên vào đây
                </div>
              )}
              <button
                type="button"
                onClick={clearCanvas}
                className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium shadow-sm transition-colors"
                title="Xoá chữ ký để vẽ lại"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Vẽ lại
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
              />
              <div className="h-28 rounded-xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center p-4">
                <span className="font-serif italic text-3xl text-blue-900 tracking-wider">
                  {typedSignature || 'Chữ ký mẫu'}
                </span>
              </div>
            </div>
          )}

          {/* Legal Compliance Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeConsent}
              onChange={(e) => setAgreeConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tôi xác nhận ký điện tử chấp thuận Thư mời nhận việc theo <strong>Luật Giao dịch Điện tử Việt Nam số 20/2023/QH15</strong>. Chữ ký này có giá trị ràng buộc cam kết gia nhập công ty.
            </span>
          </label>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !agreeConsent || (signMode === 'DRAW' && !hasDrawn)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <span>Đang xử lý ký...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
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
