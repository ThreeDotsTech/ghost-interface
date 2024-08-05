
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import Modal from '../components/Modal';

interface ModalContextType {
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
}

const defaultContext: ModalContextType = {
    showModal: (_: ReactNode) => {},
    hideModal: () => {}  // Defined callable function
  };

const ModalContext = createContext<ModalContextType>(defaultContext);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ReactNode>(null);

  const showModal = useCallback((content: ReactNode) => {
    setModalContent(content);
    setIsVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsVisible(false);
    setModalContent(null);
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {isVisible && <Modal>{modalContent}</Modal>}
    </ModalContext.Provider>
  );
};
