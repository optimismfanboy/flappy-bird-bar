/**
 * @file: FlappyModal.jsx
 * @description: Модальное окно для игры Flappy Bird
 * @dependencies: React, FlappyStart, FlappyGame
 * @created: 02.06.2025
 */

import React, { useEffect, useRef, useState } from 'react';
import FlappyStart from './FlappyStart';
import FlappyGame from './FlappyGame';
import './FlappyModal.css';

const FlappyModal = ({ isVisible, onClose }) => {
  const modalOverlayRef = useRef(null);
  const [gameStatus, setGameStatus] = useState('idle');
  const [allowOverlayClose, setAllowOverlayClose] = useState(false);

  useEffect(() => {
    const overlay = modalOverlayRef.current;
    if (!overlay) return;

    if (isVisible) {
      overlay.classList.add('visible');
      const timeoutId = setTimeout(() => {
        setAllowOverlayClose(true);
      }, 350);
      setGameStatus('idle');
      return () => clearTimeout(timeoutId);
    } else {
      overlay.classList.remove('visible');
      setAllowOverlayClose(false);
      const handleTransitionEnd = () => {
        overlay.removeEventListener('transitionend', handleTransitionEnd);
        setGameStatus('idle');
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

  const handleGameStart = () => {
    setGameStatus('playing');
  };

  const handleGameOver = () => {
    setGameStatus('gameOver');
  };

  const handleGameRestart = () => {
    console.log('handleGameRestart called in FlappyModal');
    setTimeout(() => {
      console.log('Setting gameStatus to idle...');
      setGameStatus('idle');
    }, 50);
  };

  return (
    <div className="modal-overlay" ref={modalOverlayRef} onClick={handleOverlayClick}> 
      <div className="modal-content" onClick={handleContentClick}>
        {gameStatus === 'idle' && (
          <FlappyStart onClick={handleGameStart} />
        )}
        {(gameStatus === 'playing' || gameStatus === 'gameOver') && (
          <FlappyGame
            onGameOver={handleGameOver}
            onRestart={handleGameRestart}
          />
        )}
      </div>
    </div>
  );
};

export default FlappyModal; 