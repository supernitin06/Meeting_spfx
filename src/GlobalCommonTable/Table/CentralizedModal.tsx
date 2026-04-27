import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  zIndex?: number;
}

const sizeMap = {
  sm: 'max-w-sm',     // ~384px
  md: 'max-w-md',     // ~448px
  lg: 'max-w-4xl',    // ~896px
  xl: 'max-w-6xl'     // ~1152px
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  zIndex = 1050
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40"
      style={{ zIndex }}
    >
      {/* Modal Container */}
      <div className={`w-full ${sizeMap[size]} mx-4 max-h-[90vh] flex flex-col`}>

        {/* Modal Content */}
        <div className="bg-white rounded-sm shadow-lg overflow-hidden flex flex-col h-full border border-[#DDDDDD]">

          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 bg-white shrink-0 border-b border-[#DDDDDD]">
            <h2 className="modal-title flex-1 mb-0">
              {title}
            </h2>

            <button
              onClick={onClose}
              className="text-[#333333] hover:text-[#2F5596] text-2xl leading-none p-1"
            >
              ×
            </button>
          </div>

          {/* BODY */}
          <div className="px-6 py-4 overflow-y-auto flex-grow bg-white">
            {children}
          </div>

          {/* FOOTER */}
          {footer && (
            <div className="flex justify-end gap-2 px-6 py-3 border-t border-[#DDDDDD] bg-[#F8F9FA] shrink-0">
              {footer}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Modal;