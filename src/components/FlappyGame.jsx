/**
 * @file: FlappyGame.jsx
 * @description: Компонент игры Flappy Bird
 * @dependencies: React
 * @created: 02.06.2025
 */

import React, { useRef, useEffect, useState } from 'react';
import './FlappyGame.css';

// Константы игры
const GAME_WIDTH = 390; // Ширина игрового поля
const GAME_HEIGHT = 400; // Высота игрового поля
const GRAVITY = 0.3; // Сила гравитации
const JUMP_STRENGTH = -5; // Сила прыжка (отрицательное значение для движения вверх)
const BIRD_SIZE = 20; // Размер птицы
const BIRD_POSITION_X = 70; // Фиксированная позиция птицы по горизонтали

// Константы для труб
const PIPE_WIDTH = 50;
const PIPE_GAP = 100; // Расстояние между верхней и нижней трубой
const BASE_PIPE_SPEED = 2; // Базовая скорость движения труб
const PIPE_DISTANCE = 1200; // Расстояние между парами труб (уменьшено для мобильных устройств)

const FlappyGame = ({ onGameOver, onRestart }) => {
  const gameAreaRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'gameOver'
  
  // Состояние птицы
  const [birdPositionY, setBirdPositionY] = useState(GAME_HEIGHT / 2);
  const [birdVelocityY, setBirdVelocityY] = useState(0);
  const [birdRotation, setBirdRotation] = useState(0); // New state for rotation

  // Состояние рекорда
  const [highScore, setHighScore] = useState(0);

  // Состояние труб: массив объектов { left: number, height: number, passed: boolean }
  const [pipes, setPipes] = useState([]);

  // Реф для игрового цикла и таймера генерации труб
  const gameLoopRef = useRef();
  const pipeTimerRef = useRef();
  const lastFrameTimeRef = useRef(0);
  const [pipeSpeed, setPipeSpeed] = useState(BASE_PIPE_SPEED);
  const lastJumpTimeRef = useRef(0); // Добавляем реф для отслеживания времени последнего прыжка
  const touchStartYRef = useRef(0); // Добавляем реф для отслеживания начальной позиции тача

  // Загрузка рекорда из localStorage при монтировании компонента
  useEffect(() => {
    const savedHighScore = localStorage.getItem('flappyHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []); // Пустой массив зависимостей означает, что эффект выполнится только один раз при монтировании

  // Логика генерации труб
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(pipeTimerRef.current);
      return;
    }

    const generatePipe = () => {
      const minHeight = 50;
      const maxHeight = GAME_HEIGHT - PIPE_GAP - minHeight;
      const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

      setPipes(prevPipes => [
        ...prevPipes,
        { left: GAME_WIDTH, height: height, passed: false }
      ]);
    };

    generatePipe();
    pipeTimerRef.current = setInterval(generatePipe, PIPE_DISTANCE);

    return () => clearInterval(pipeTimerRef.current);
  }, [gameState]);

  // Обработчик клика для прыжка птицы
  const handleJump = () => {
    const now = Date.now();
    // Проверяем, прошло ли достаточно времени с последнего прыжка (300мс)
    if (now - lastJumpTimeRef.current < 50) {
      return;
    }
    lastJumpTimeRef.current = now;

    if (gameState === 'playing') {
      setBirdVelocityY(JUMP_STRENGTH);
      setBirdRotation(-20); 
    } else if (gameState === 'idle') {
      console.log('Starting game...'); // Отладочная информация
      setGameState('playing');
      setScore(0);
      setPipes([]);
      setBirdPositionY(GAME_HEIGHT / 2);
      setBirdVelocityY(0);
      setBirdRotation(0);
      lastFrameTimeRef.current = 0; // Сбрасываем время последнего кадра
    }
  };

  // Игровой цикл (движение птицы, труб, столкновения, очки)
  useEffect(() => {
    console.log('Game state changed:', gameState); // Отладочная информация
    
    if (gameState !== 'playing') {
      cancelAnimationFrame(gameLoopRef.current);
      lastFrameTimeRef.current = 0;

      if (gameState === 'gameOver' && Math.floor(score / 2) > highScore) {
        const finalScore = Math.floor(score / 2);
        setHighScore(finalScore);
        localStorage.setItem('flappyHighScore', finalScore.toString());
      }

      return;
    }

    const gameLoop = (timestamp) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Адаптируем скорость под частоту обновления экрана
      const speedMultiplier = Math.min(deltaTime / 16.67, 2); // 16.67ms = ~60fps
      const currentPipeSpeed = BASE_PIPE_SPEED * speedMultiplier;
      setPipeSpeed(currentPipeSpeed);

      // Движение птицы
      setBirdPositionY(prev => {
        const newPosition = prev + birdVelocityY * speedMultiplier;
        if (newPosition <= 0 || newPosition >= GAME_HEIGHT - BIRD_SIZE) {
          setGameState('gameOver');
          return newPosition;
        }
        return newPosition;
      });

      setBirdVelocityY(prev => {
        const newVelocity = prev + GRAVITY * speedMultiplier;
        let rotation = 0;
        if (newVelocity < 0) {
          rotation = Math.max(-20, newVelocity * 7);
        } else {
          rotation = Math.min(45, newVelocity * 9);
        }
        setBirdRotation(rotation);
        return newVelocity;
      });

      // Движение труб и проверка столкновений + очки
      setPipes(prevPipes =>
        prevPipes
          .map(pipe => {
            const newLeft = pipe.left - currentPipeSpeed;

            // Проверка столкновения с текущей трубой (AABB collision)
            const birdLeft = BIRD_POSITION_X;
            const birdRight = BIRD_POSITION_X + BIRD_SIZE;
            const birdTop = birdPositionY;
            const birdBottom = birdPositionY + BIRD_SIZE;

            const pipeLeft = pipe.left;
            const pipeRight = pipe.left + PIPE_WIDTH;

            // Проверка столкновения с верхней трубой
            const topPipeBottom = pipe.height;
            const hitTopPipe = !(birdRight < pipeLeft || // птица справа от трубы
                                birdLeft > pipeRight || // птица слева от трубы
                                birdBottom < 0 || // птица выше верхней границы верхней трубы (всегда 0)
                                birdTop > topPipeBottom); // птица ниже нижней границы верхней трубы

            // Проверка столкновения с нижней трубой
            const bottomPipeTop = pipe.height + PIPE_GAP;
            const hitBottomPipe = !(birdRight < pipeLeft || // птица справа от трубы
                                 birdLeft > pipeRight || // птица слева от трубы
                                 birdBottom < bottomPipeTop || // птица выше верхней границы нижней трубы
                                 birdTop > GAME_HEIGHT); // птица ниже нижней границы нижней трубы (всегда GAME_HEIGHT)

            const hitPipe = hitTopPipe || hitBottomPipe;

            if (hitPipe) {
              setGameState('gameOver');
            }

            // Проверка прохождения трубы для начисления очков
            let scored = pipe.passed;
            const pipeRightEdge = pipe.left + PIPE_WIDTH;
            const newPipeRightEdge = newLeft + PIPE_WIDTH;

            // Очко засчитывается, когда правый край трубы пересекает левый край птицы
            if (!pipe.passed && pipeRightEdge >= BIRD_POSITION_X && newPipeRightEdge < BIRD_POSITION_X) {
              setScore(prevScore => prevScore + 1);
              scored = true;
            }

            return { ...pipe, left: newLeft, passed: scored };
          })
          .filter(pipe => pipe.left + PIPE_WIDTH > 0) // Удаляем трубы, вышедшие за левую границу
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(gameLoopRef.current);

  }, [gameState, birdVelocityY, pipes, score, highScore]);

  // Добавляем обработчики клика/тапа на контейнер игры
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const handleTouchStart = (e) => {
      e.preventDefault(); // Предотвращаем стандартное поведение
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      e.preventDefault(); // Предотвращаем стандартное поведение
      const touchEndY = e.changedTouches[0].clientY;
      const touchDiff = Math.abs(touchEndY - touchStartYRef.current);
      
      // Проверяем, что это был короткий тап (не свайп)
      if (touchDiff < 10) {
        handleJump();
      }
    };

    // Добавляем обработчики
    gameArea.addEventListener('click', handleJump);
    gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      // Удаляем обработчики
      gameArea.removeEventListener('click', handleJump);
      gameArea.removeEventListener('touchstart', handleTouchStart);
      gameArea.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState]); // Зависимость только от gameState

  return (
    <div className="flappy-game-container" ref={gameAreaRef}>
      {/* Отрисовка птицы */}
      {(gameState === 'playing' || gameState === 'gameOver' || gameState === 'idle') && (
        <img
          src="/icons8-bird-20.png"
          alt="Flappy Bird"
          className="bird-image"
          style={{
            position: 'absolute',
            top: `${birdPositionY}px`,
            left: `${BIRD_POSITION_X}px`,
            width: `${BIRD_SIZE}px`,
            height: `${BIRD_SIZE}px`,
            transform: `rotate(${birdRotation}deg)`,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Отрисовка труб */}
      {pipes.map((pipe, index) => (
        <React.Fragment key={index}>
          {/* Верхняя труба */}
          <div
            className="pipe pipe-top"
            style={{
              left: `${pipe.left}px`,
              height: `${pipe.height}px`,
              width: `${PIPE_WIDTH}px`,
              top: 0,
            }}
          ></div>
          {/* Нижняя труба */}
          <div
            className="pipe pipe-bottom"
            style={{
              left: `${pipe.left}px`,
              height: `${GAME_HEIGHT - pipe.height - PIPE_GAP}px`,
              width: `${PIPE_WIDTH}px`,
              top: `${pipe.height + PIPE_GAP}px`,
            }}
          ></div>
        </React.Fragment>
      ))}

      {/* Сообщения о состоянии игры */}
      {gameState === 'idle' && (
        <div className="game-message">Нажмите для старта</div>
      )}
      {gameState === 'playing' && (
        <div className="score">Счет: {Math.floor(score / 2)}</div>
      )}
      {gameState === 'gameOver' && (
        <div className="game-over-screen">
          <div className="high-score">Ваш рекорд: {highScore}</div>
          <div className="final-score">Пройдено труб: {Math.floor(score / 2)}</div>
          <button 
            className="restart-button"
            onClick={onRestart}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRestart();
            }}
          >
            Начать заново
          </button>
        </div>
      )}
    </div>
  );
};

export default FlappyGame; 