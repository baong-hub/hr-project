import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../Modal/Modal';
import styles from './RichTextEditorModal.module.scss';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link, 
  Image as ImageIcon,
  Palette,
  Pipette,
  Type
} from 'lucide-react';

interface RichTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialValue: string;
  title?: string;
  placeholder?: string;
}

const BASIC_COLORS = [
  '#000000', // Đen
  '#5e6278', // Xám đậm
  '#a1a5b7', // Xám nhạt
  '#ffffff', // Trắng
  '#f64e60', // Đỏ
  '#ffa800', // Cam
  '#ffc107', // Vàng
  '#1bc5bd', // Lục
  '#1f3bb3', // Xanh dương
  '#8950fc', // Tím
  '#e83e8c'  // Hồng
];

const FONT_SIZES = [
  { label: 'Cỡ chữ', value: '' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '32px', value: '32px' }
];

export const RichTextEditorModal = ({
  isOpen,
  onClose,
  onSave,
  initialValue,
  title = 'Soạn thảo nội dung',
  placeholder = 'Nhập nội dung tương tác chi tiết tại đây...'
}: RichTextEditorModalProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const bgColorInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [resizerRect, setResizerRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Popover state
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);

  // Initialize editor content when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = initialValue;
          // Set focus and position cursor at the end
          editorRef.current.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 50);
      setSelectedImage(null);
    }
  }, [isOpen, initialValue]);

  // Track selected image coordinates inside the editor to position handles
  useEffect(() => {
    if (!selectedImage || !editorRef.current) {
      setResizerRect(null);
      return;
    }

    const updateRect = () => {
      const editorEl = editorRef.current;
      if (!editorEl || !selectedImage) return;

      const editorRect = editorEl.getBoundingClientRect();
      const imgRect = selectedImage.getBoundingClientRect();

      setResizerRect({
        top: imgRect.top - editorRect.top + editorEl.scrollTop,
        left: imgRect.left - editorRect.left + editorEl.scrollLeft,
        width: imgRect.width,
        height: imgRect.height
      });
    };

    updateRect();

    const editorEl = editorRef.current;
    editorEl?.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);

    return () => {
      editorEl?.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [selectedImage, updateTrigger]);

  // Execute native rich-text commands
  const execFormatCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setSelectedImage(null); // Clear image selection on formatting text
  };

  // Safe tag substitution for arbitrary CSS font sizes
  const applyFontSize = (sizeStr: string) => {
    if (!sizeStr) return;
    execFormatCommand('fontSize', '7');
    const fontElements = editorRef.current?.getElementsByTagName('font');
    if (fontElements) {
      for (let i = fontElements.length - 1; i >= 0; i--) {
        const fontEl = fontElements[i];
        if (fontEl.getAttribute('size') === '7') {
          const span = document.createElement('span');
          span.style.fontSize = sizeStr;
          span.innerHTML = fontEl.innerHTML;
          fontEl.parentNode?.replaceChild(span, fontEl);
        }
      }
    }
    editorRef.current?.focus();
  };

  // Align text or image
  const handleAlignment = (alignment: 'left' | 'center' | 'right') => {
    if (selectedImage) {
      // Set image alignment via inline styles
      if (alignment === 'center') {
        selectedImage.style.display = 'block';
        selectedImage.style.margin = '8px auto';
      } else if (alignment === 'right') {
        selectedImage.style.display = 'block';
        selectedImage.style.margin = '8px 0 8px auto';
      } else {
        selectedImage.style.display = 'block';
        selectedImage.style.margin = '8px auto 8px 0';
      }
      setUpdateTrigger(prev => prev + 1);
    } else {
      const command = alignment === 'center' ? 'justifyCenter' : alignment === 'right' ? 'justifyRight' : 'justifyLeft';
      execFormatCommand(command);
    }
  };

  // Handle paste image from clipboard (Ctrl+V)
  const handlePasteImage = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (ev.target?.result) {
                execFormatCommand('insertImage', ev.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
  };

  // Editor body click handler to select images
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImage(target as HTMLImageElement);
    } else {
      setSelectedImage(null);
    }
  };

  // Handle image resizer dragging
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImage) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = selectedImage.clientWidth;
    const startHeight = selectedImage.clientHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (corner === 'bottomRight') {
        newWidth = startWidth + dx;
        newHeight = startHeight + dy;
      } else if (corner === 'bottomLeft') {
        newWidth = startWidth - dx;
        newHeight = startHeight + dy;
      } else if (corner === 'topRight') {
        newWidth = startWidth + dx;
        newHeight = startHeight - dy;
      } else if (corner === 'topLeft') {
        newWidth = startWidth - dx;
        newHeight = startHeight - dy;
      }

      // Minimum size clamp
      if (newWidth < 40) newWidth = 40;
      if (newHeight < 40) newHeight = 40;

      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = `${newHeight}px`;

      setUpdateTrigger(prev => prev + 1);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Keyboard delete for selected image
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedImage && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      selectedImage.remove();
      setSelectedImage(null);
    }
  };

  // Save changes
  const handleSave = () => {
    setSelectedImage(null);
    const content = editorRef.current?.innerHTML || '';
    onSave(content);
    onClose();
  };

  // Render footer elements
  const footerContent = (
    <div className={styles.modalFooterActions}>
      <button className={styles.btnCancel} onClick={onClose}>
        Hủy
      </button>
      <button className={styles.btnSave} onClick={handleSave}>
        Đồng ý
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footerContent} width="800px">
      <div className={styles.editorContainer}>
        {/* Editor Toolbar */}
        <div className={styles.editorToolbar}>
          <button type="button" onClick={() => execFormatCommand('bold')} title="In đậm" className={styles.toolbarBtn}>
            <Bold size={16} />
          </button>
          <button type="button" onClick={() => execFormatCommand('italic')} title="In nghiêng" className={styles.toolbarBtn}>
            <Italic size={16} />
          </button>
          <button type="button" onClick={() => execFormatCommand('underline')} title="Gạch chân" className={styles.toolbarBtn}>
            <Underline size={16} />
          </button>
          <button type="button" onClick={() => execFormatCommand('strikeThrough')} title="Gạch ngang" className={styles.toolbarBtn}>
            <Strikethrough size={16} />
          </button>

          <div className={styles.toolbarSeparator} />

          <button type="button" onClick={() => execFormatCommand('insertUnorderedList')} title="Danh sách chấm tròn" className={styles.toolbarBtn}>
            <List size={16} />
          </button>
          <button type="button" onClick={() => execFormatCommand('insertOrderedList')} title="Danh sách số" className={styles.toolbarBtn}>
            <ListOrdered size={16} />
          </button>

          <div className={styles.toolbarSeparator} />

          <button type="button" onClick={() => handleAlignment('left')} title="Căn trái" className={styles.toolbarBtn}>
            <AlignLeft size={16} />
          </button>
          <button type="button" onClick={() => handleAlignment('center')} title="Căn giữa" className={styles.toolbarBtn}>
            <AlignCenter size={16} />
          </button>
          <button type="button" onClick={() => handleAlignment('right')} title="Căn phải" className={styles.toolbarBtn}>
            <AlignRight size={16} />
          </button>

          <div className={styles.toolbarSeparator} />

          {/* Font size dropdown */}
          <select 
            onChange={(e) => applyFontSize(e.target.value)} 
            title="Cỡ chữ" 
            className={styles.toolbarSelect}
            defaultValue=""
          >
            {FONT_SIZES.map(sz => (
              <option key={sz.label} value={sz.value}>{sz.label}</option>
            ))}
          </select>

          <div className={styles.toolbarSeparator} />

          {/* Fore Color Picker */}
          <div className={styles.colorPickerWrapper}>
            <button 
              type="button" 
              onClick={() => { setShowTextColor(!showTextColor); setShowBgColor(false); }} 
              title="Màu chữ" 
              className={`${styles.toolbarBtn} ${showTextColor ? styles.active : ''}`}
            >
              <Type size={16} />
            </button>
            {showTextColor && (
              <div className={styles.colorPopover}>
                <div className={styles.colorGrid}>
                  {BASIC_COLORS.map(c => (
                    <div 
                      key={c} 
                      className={styles.colorCircle} 
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        execFormatCommand('foreColor', c);
                        setShowTextColor(false);
                      }}
                    />
                  ))}
                </div>
                <button 
                  className={styles.customColorBtn}
                  onClick={() => textColorInputRef.current?.click()}
                >
                  <Pipette size={12} />
                  Chọn màu khác
                </button>
                <input 
                  type="color" 
                  ref={textColorInputRef} 
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    execFormatCommand('foreColor', e.target.value);
                    setShowTextColor(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Background Color Picker */}
          <div className={styles.colorPickerWrapper}>
            <button 
              type="button" 
              onClick={() => { setShowBgColor(!showBgColor); setShowTextColor(false); }} 
              title="Màu nền chữ (Highlight)" 
              className={`${styles.toolbarBtn} ${showBgColor ? styles.active : ''}`}
            >
              <Palette size={16} />
            </button>
            {showBgColor && (
              <div className={styles.colorPopover}>
                <div className={styles.colorGrid}>
                  {BASIC_COLORS.map(c => (
                    <div 
                      key={c} 
                      className={styles.colorCircle} 
                      style={{ backgroundColor: c }}
                      onClick={() => {
                        execFormatCommand('hiliteColor', c);
                        setShowBgColor(false);
                      }}
                    />
                  ))}
                </div>
                <button 
                  className={styles.customColorBtn}
                  onClick={() => bgColorInputRef.current?.click()}
                >
                  <Pipette size={12} />
                  Chọn màu khác
                </button>
                <input 
                  type="color" 
                  ref={bgColorInputRef} 
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    execFormatCommand('hiliteColor', e.target.value);
                    setShowBgColor(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className={styles.toolbarSeparator} />

          <button 
            type="button" 
            onClick={() => {
              const url = prompt('Nhập URL đường dẫn:');
              if (url) execFormatCommand('createLink', url);
            }} 
            title="Chèn Link" 
            className={styles.toolbarBtn}
          >
            <Link size={16} />
          </button>

          <button 
            type="button" 
            onClick={() => imageInputRef.current?.click()} 
            title="Chèn ảnh" 
            className={styles.toolbarBtn}
          >
            <ImageIcon size={16} />
          </button>
          <input 
            type="file" 
            ref={imageInputRef} 
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  if (ev.target?.result) {
                    execFormatCommand('insertImage', ev.target.result as string);
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        {/* Editor Body Area */}
        <div className={styles.editorViewport}>
          <div 
            ref={editorRef}
            className={styles.editorBody}
            contentEditable={true}
            onPaste={handlePasteImage}
            onClick={handleEditorClick}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
          />

          {/* Interactive Resizer Handles overlay */}
          {resizerRect && (
            <div 
              className={styles.resizerOverlay} 
              style={{
                top: resizerRect.top - 2,
                left: resizerRect.left - 2,
                width: resizerRect.width + 4,
                height: resizerRect.height + 4
              }}
            >
              <div className={`${styles.resizeHandle} ${styles.topLeft}`} onMouseDown={(e) => handleResizeStart(e, 'topLeft')} />
              <div className={`${styles.resizeHandle} ${styles.topRight}`} onMouseDown={(e) => handleResizeStart(e, 'topRight')} />
              <div className={`${styles.resizeHandle} ${styles.bottomLeft}`} onMouseDown={(e) => handleResizeStart(e, 'bottomLeft')} />
              <div className={`${styles.resizeHandle} ${styles.bottomRight}`} onMouseDown={(e) => handleResizeStart(e, 'bottomRight')} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
