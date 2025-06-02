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
const GRAVITY = 0.1; // Сила гравитации
const JUMP_STRENGTH = -3; // Сила прыжка (отрицательное значение для движения вверх)
const BIRD_SIZE = 20; // Размер птицы
const BIRD_POSITION_X = 70; // Фиксированная позиция птицы по горизонтали

// Константы для труб
const PIPE_WIDTH = 50;
const PIPE_GAP = 100; // Расстояние между верхней и нижней трубой
const PIPE_SPEED = 1; // Скорость движения труб
const PIPE_DISTANCE = 1200; // Расстояние между парами труб

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

  // Загрузка рекорда из localStorage при монтировании компонента
  useEffect(() => {
    const savedHighScore = localStorage.getItem('flappyHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []); // Пустой массив зависимостей означает, что эффект выполнится только один раз при монтировании

  // Обработчик клика для прыжка птицы
  const handleJump = () => {
    if (gameState === 'playing') {
      setBirdVelocityY(JUMP_STRENGTH);
       // Optionally set initial rotation on jump for snappier feel
      setBirdRotation(-20); 
    } else if (gameState === 'idle') {
      setGameState('playing');
      setScore(0);
      setPipes([]); // Сбрасываем трубы при старте новой игры
      setBirdPositionY(GAME_HEIGHT / 2);
      setBirdVelocityY(0);
      setBirdRotation(0); // Reset rotation on new game
    }
  };

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
    pipeTimerRef.current = setInterval(generatePipe, PIPE_DISTANCE * PIPE_SPEED);

    return () => clearInterval(pipeTimerRef.current);
  }, [gameState]);


  // Игровой цикл (движение птицы, труб, столкновения, очки)
  useEffect(() => {
    if (gameState !== 'playing') {
      cancelAnimationFrame(gameLoopRef.current);

      // Сохранение рекорда при окончании игры
      if (gameState === 'gameOver' && Math.floor(score / 2) > highScore) {
        const finalScore = Math.floor(score / 2);
        setHighScore(finalScore);
        localStorage.setItem('flappyHighScore', finalScore.toString());
      }

      return;
    }

    const gameLoop = () => {
      // Движение птицы
      setBirdPositionY(prev => {
        const newPosition = prev + birdVelocityY;
        // Проверка столкновения с верхней или нижней границей игрового поля
        if (newPosition <= 0 || newPosition >= GAME_HEIGHT - BIRD_SIZE) {
          setGameState('gameOver');
          return newPosition; // Позволяем птице упасть до края для наглядности
        }
        return newPosition;
      });

      setBirdVelocityY(prev => {
        const newVelocity = prev + GRAVITY;
        // Calculate rotation based on new velocity
        let rotation = 0;
        if (newVelocity < 0) { // Moving up
          rotation = Math.max(-20, newVelocity * 7); // Adjust multiplier as needed
        } else { // Moving down or still
          rotation = Math.min(45, newVelocity * 9); // Adjust multiplier as needed
        }
        setBirdRotation(rotation);
        return newVelocity;
      });

      // Движение труб и проверка столкновений + очки
      setPipes(prevPipes =>
        prevPipes
          .map(pipe => {
            const newLeft = pipe.left - PIPE_SPEED;

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
    if (gameArea) {
      gameArea.addEventListener('click', handleJump);
      gameArea.addEventListener('touchstart', handleJump);
    }

    return () => {
      if (gameArea) {
        gameArea.removeEventListener('click', handleJump);
        gameArea.removeEventListener('touchstart', handleJump);
      }
    };
  }, [handleJump]);


  return (
    <div className="flappy-game-container" ref={gameAreaRef}>
      {/* Отрисовка птицы */}
      {(gameState === 'playing' || gameState === 'gameOver' || gameState === 'idle') && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width={BIRD_SIZE} // Use BIRD_SIZE for width
          height={BIRD_SIZE} // Use BIRD_SIZE for height
          viewBox="0 0 48 48"
          className="bird"
          style={{
            position: 'absolute', // Ensure absolute positioning
            top: `${birdPositionY}px`,
            left: `${BIRD_POSITION_X}px`,
            transform: `rotate(${birdRotation}deg)`, // Apply rotation style
            // The original SVG is 48x48, but our BIRD_SIZE is 20. 
            // We set the width and height to BIRD_SIZE directly on the SVG.
            // The viewBox handles scaling the internal elements.
          }}
        >
          <path fill="none" stroke="#6dabfd" strokeLinecap="round" strokeLinejoin="round" d="M30.484 25.524h7.864m-7.864 0c-1.723 0-6.764-3.443-6.764-8.201c0-3.021 3.023-4.838 5.04-4.838c.76 0 1.535.137 2.298.393m-.574 12.646c-2.404 0-6.106 3.194-6.106 4.66s3.42 4.082 6.106 4.082m7.864-8.742v-2.37c0-4.803-3.5-9.004-7.29-10.276m7.29 12.646h.524c6.132 0 6.209 4.66 0 4.66M9.604 18.377c5.838 0 9.415 2.314 9.572 5.865c.197 4.454-3.097 6.656-7.307 6.656H9.604m0-12.52c-2.997 0-5.104 1.478-5.104 4.602s2.301 6.538 5.104 7.918m0-12.52c.845-.082-.845-.082 0 0m0 0c3.668-4.772 9.002-6.913 14.774-7.02c5.772-.108 4.071.926 6.68 1.52m7.815 17.306c-.646 0 .687 0 0 0m0 0c-.988 0-1.087.04-2.221.036m-6.168 4.046h6.168c5.815 0 5.815-4.04 0-4.046m-6.168 4.046s-2.369 2.384-9.259 2.384c-4.74 0-11.14-1.97-11.621-5.752M29 30.184s3.913.025 7.652.036"/>
          <rect width="2.672" height="5.069" x="31.952" y="17.321" fill="none" stroke="#6dabfd" strokeLinecap="round" strokeLinejoin="round" rx="1.309" ry="1.309"/>
        </svg>
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
          <button onClick={onRestart}>Начать заново</button>
          <button onClick={onGameOver}>Выйти</button>
        </div>
      )}
    </div>
  );
};

export default FlappyGame; 