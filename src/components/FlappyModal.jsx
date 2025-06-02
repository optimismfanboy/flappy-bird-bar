/**
 * @file: FlappyModal.jsx
 * @description: Модальное окно для игры Flappy Bird
 * @dependencies: React, FlappyStart, FlappyGame
 * @created: 02.06.2025
 */

import React, { useEffect, useRef, useState } from 'react';
// import FlappyStart from './FlappyStart'; // Удаляем импорт FlappyStart
import FlappyGame from './FlappyGame';
import './FlappyModal.css';

const FlappyModal = ({ isVisible, onClose }) => {
  const modalOverlayRef = useRef(null);
  // Удаляем состояние gameStatus
  // const [gameStatus, setGameStatus] = useState('idle');
  const [allowOverlayClose, setAllowOverlayClose] = useState(false);

  useEffect(() => {
    const overlay = modalOverlayRef.current;
    if (!overlay) return;

    if (isVisible) {
      overlay.classList.add('visible');
      const timeoutId = setTimeout(() => {
        setAllowOverlayClose(true);
      }, 350);
      // Удаляем установку gameStatus при открытии
      // setGameStatus('playing');
      return () => clearTimeout(timeoutId);
    } else {
      overlay.classList.remove('visible');
      setAllowOverlayClose(false);
      const handleTransitionEnd = () => {
        overlay.removeEventListener('transitionend', handleTransitionEnd);
        // Удаляем сброс gameStatus при закрытии
        // setGameStatus('idle');
      };
      overlay.addEventListener('transitionend', handleTransitionEnd);
    }
  }, [isVisible]);

  const handleOverlayClick = () => {
    if (allowOverlayClose) {
      onClose();
    }
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Удаляем функции управления игрой, они будут в FlappyGame
  // const handleGameOver = () => {
  //   setGameStatus('gameOver');
  // };

  // const handleGameRestart = () => {
  //   console.log('handleGameRestart called in FlappyModal');
  //   setTimeout(() => {
  //     console.log('Setting gameStatus to idle...');
  //     setGameStatus('idle');
  //   }, 50);
  // };

  return (
    <div className="modal-overlay" ref={modalOverlayRef} onClick={handleOverlayClick}> 
      <div className="modal-content" onClick={handleContentClick}>
        {/* Рендерим игру безусловно, когда модальное окно видимо */}
        {isVisible && (
          <FlappyGame
            // Удаляем пропсы onGameOver и onRestart, игра управляет состоянием сама
            // onGameOver={handleGameOver}
            // onRestart={handleGameRestart}
          />
        )}
      </div>
    </div>
  );
};

export default FlappyModal; 