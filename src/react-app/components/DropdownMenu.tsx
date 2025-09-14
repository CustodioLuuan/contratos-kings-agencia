import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  children: React.ReactNode;
}

export default function DropdownMenu({ isOpen, onClose, triggerRef, children }: DropdownMenuProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const menuHeight = 200; // Altura estimada do menu
          const menuWidth = 160; // Largura do menu
          
          // Calcular posição horizontal (alinhar à direita do botão)
          let left = rect.right - menuWidth;
          if (left < 10) left = 10; // Margem mínima da esquerda
          if (left + menuWidth > viewportWidth - 10) left = viewportWidth - menuWidth - 10;
          
          // Calcular posição vertical
          let top = rect.bottom + 8; // 8px de espaçamento
          
          // Se não há espaço abaixo, mostrar acima
          if (top + menuHeight > viewportHeight - 10) {
            top = rect.top - menuHeight - 8;
          }
          
          setPosition({ top, left });
        }
      };

      updatePosition();
      
      // Atualizar posição quando a janela for redimensionada ou rolada
      const handleResize = () => updatePosition();
      const handleScroll = () => updatePosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        // Adicionar um pequeno delay para permitir que os cliques nos botões sejam processados
        setTimeout(() => {
          if (
            menuRef.current &&
            !menuRef.current.contains(event.target as Node) &&
            triggerRef.current &&
            !triggerRef.current.contains(event.target as Node)
          ) {
            onClose();
          }
        }, 100);
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mouseup', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mouseup', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-kings-bg-secondary border border-kings-border rounded-lg shadow-lg z-[9999] min-w-[160px]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
