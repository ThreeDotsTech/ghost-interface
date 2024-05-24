import React, { useEffect, useRef } from 'react';
import { useModal } from '../../context/ModalContext';

const Modal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hideModal } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        hideModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hideModal]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div ref={modalRef}>
        {children}
      </div>
    </div>
  );
};

export default Modal;