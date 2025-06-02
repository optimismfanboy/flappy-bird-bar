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
const BIRD_SIZE = 25; // Визуальный размер птицы в пикселях
const BIRD_HITBOX_SIZE = 20; // Размер хитбокса птицы в пикселях (меньше визуального размера)
const BIRD_POSITION_X = 70; // Фиксированная позиция птицы по горизонтали
const BIRD_HITBOX_OFFSET_X = (BIRD_SIZE - BIRD_HITBOX_SIZE) / 2; // Смещение хитбокса по X
const BIRD_HITBOX_OFFSET_Y = (BIRD_SIZE - BIRD_HITBOX_SIZE) / 2; // Смещение хитбокса по Y

// Константы для труб
const PIPE_WIDTH = 50;
const PIPE_GAP = 100; // Расстояние между верхней и нижней трубой
const BASE_PIPE_SPEED = 3; // Базовая скорость движения труб
const PIPE_DISTANCE = 900; // Расстояние между парами труб (уменьшено для мобильных устройств)
const PIPE_HITBOX_TRIM = 5; // На сколько пикселей подрезать хитбокс труб снизу (для верхних) и сверху (для нижних)

// Константы для фоновых элементов (облаков)
const BACKGROUND_SPEED = 1; // Скорость движения фоновых элементов (облаков)
const MAX_BACKGROUND_ELEMENTS = 3; // Максимальное количество фоновых элементов (облаков) на экране
const MIN_BACKGROUND_DISTANCE = 50; // Минимальное расстояние между фоновыми элементами (облаками) по вертикали
const MAX_GENERATION_ATTEMPTS = 10; // Максимальное количество попыток генерации элемента (облаков)
const BACKGROUND_IMAGES = ['/cloud1.jpg', '/cloud2.jpg', '/cloud4.jpg', '/seno.jpg']; // Массив путей к фоновым изображениям (облаков)

// Константы для движущегося задника (гор)
const MOUNTAIN_BACKGROUND_SPEED = 1.5; // Скорость движения задника (гор)
const MOUNTAIN_BACKGROUND_HEIGHT = 200; // Высота задника (гор) в пикселях
const MOUNTAIN_IMAGE_SRC = '/back-mountain.jpg'; // Путь к изображению задника
const INITIAL_MOUNTAIN_WIDTH = 600; // Примерная ширина вашего изображения задника. Возможно потребуется настройка.

const FlappyGame = ({ onGameOver, onRestart }) => {
  const gameAreaRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'gameOver'
  
  // Состояние птицы
  const [birdPositionY, setBirdPositionY] = useState(GAME_HEIGHT / 2 + 20);
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

  // Состояние для фоновых элементов (облаков)
  const [backgroundElements, setBackgroundElements] = useState([]);

  // Состояние для движущегося задника (гор). Используем два элемента для бесшовного скролла.
  const [mountainBackgrounds, setMountainBackgrounds] = useState([
    { id: 1, left: 0 },
    { id: 2, left: INITIAL_MOUNTAIN_WIDTH }, // Второй элемент стартует сразу после первого
  ]);

  // Реф для таймера генерации фоновых элементов
  const backgroundTimerRef = useRef();

  // Функция для сброса состояния игры
  const resetGame = () => {
    setScore(0);
    setPipes([]);
    setBirdPositionY(GAME_HEIGHT / 2 + 20);
    setBirdVelocityY(0);
    setBirdRotation(0);
    lastFrameTimeRef.current = 0;
    setBackgroundElements([]); // Сбрасываем фоновые элементы при рестарте
    setGameState('idle'); // Возвращаемся в состояние ожидания старта
  };

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

  // Логика генерации фоновых элементов (облаков) с использованием отдельного таймера
  useEffect(() => {
    console.log('Background generation effect running. Game state:', gameState);
    if (gameState === 'playing') {
      console.log('Starting background generation timer.');
      const generateElement = () => {
        // Генерируем новый элемент только если их меньше максимального количества
        setBackgroundElements(prevElements => {
          if (prevElements.length >= MAX_BACKGROUND_ELEMENTS) {
            return prevElements; // Не генерируем, если лимит достигнут
          }

          const size = 40; // Размер изображения фона
          const startLeft = GAME_WIDTH; // Появляется справа за границей экрана

          let newElement = null;
          let attempts = 0;
          let foundValidPosition = false;

          // Пытаемся найти подходящую случайную позицию по вертикали
          while (attempts < MAX_GENERATION_ATTEMPTS && !foundValidPosition) {
            const randomTop = Math.random() * (GAME_HEIGHT - size);
            // Случайно выбираем изображение из массива
            const randomImageSrc = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
            
            newElement = { 
              id: Date.now() + Math.random(), 
              top: randomTop, 
              left: startLeft, 
              size: size, 
              imageSrc: randomImageSrc // Сохраняем путь к изображению
            };

            // Проверяем расстояние до всех существующих элементов
            foundValidPosition = prevElements.every(existingElement =>
              Math.abs(newElement.top - existingElement.top) >= MIN_BACKGROUND_DISTANCE
            );

            attempts++;
          }

          if (foundValidPosition && newElement) {
            console.log('Generated new background element with valid position.');
            return [...prevElements, newElement];
          } else {
            console.log('Could not find valid position for new background element after attempts.');
            return prevElements; // Возвращаем старое состояние, если не удалось найти позицию
          }
        });
      };

      // Генерируем новый элемент каждые несколько секунд
      backgroundTimerRef.current = setInterval(generateElement, 2000); // Интервал генерации

    } else {
      // Останавливаем таймер, если игра не в состоянии 'playing'
      console.log('Stopping background generation timer.');
      clearInterval(backgroundTimerRef.current);
    }

    // Очистка таймера при размонтировании компонента или изменении gameState
    return () => {
      console.log('Cleaning up background generation timer.');
      clearInterval(backgroundTimerRef.current);
    };
  }, [gameState]); // Зависимость только от gameState

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
      setBirdPositionY(GAME_HEIGHT / 2 + 20);
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
      //setPipeSpeed(currentPipeSpeed); // Это состояние не используется, можно удалить если не нужно для дебага

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
            const birdLeft = BIRD_POSITION_X + BIRD_HITBOX_OFFSET_X;
            const birdRight = BIRD_POSITION_X + BIRD_HITBOX_OFFSET_X + BIRD_HITBOX_SIZE;
            const birdTop = birdPositionY + BIRD_HITBOX_OFFSET_Y;
            const birdBottom = birdPositionY + BIRD_HITBOX_OFFSET_Y + BIRD_HITBOX_SIZE;

            const pipeLeft = pipe.left;
            const pipeRight = pipe.left + PIPE_WIDTH;

            // Проверка столкновения с верхней трубой
            const topPipeBottom = pipe.height - PIPE_HITBOX_TRIM;
            const hitTopPipe = !(birdRight < pipeLeft || // птица справа от трубы
                                birdLeft > pipeRight || // птица слева от трубы
                                birdBottom < 0 || // птица выше верхней границы верхней трубы (всегда 0)
                                birdTop > topPipeBottom); // птица ниже нижней границы верхней трубы

            // Проверка столкновения с нижней трубой
            const bottomPipeTop = pipe.height + PIPE_GAP + PIPE_HITBOX_TRIM; // Учитываем подрезку хитбокса снизу трубы
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

      // Движение фоновых элементов (облаков)
      setBackgroundElements(prevElements =>
        prevElements
          .map(element => ({
            ...element,
            left: element.left - BACKGROUND_SPEED * speedMultiplier // Двигаем влево с адаптивной скоростью
          }))
          .filter(element => element.left + element.size > 0) // Удаляем элементы, ушедшие за левую границу
      );

      // Движение движущегося задника (гор)
      setMountainBackgrounds(prevMountains =>
        prevMountains.map(mountain => {
          let newLeft = mountain.left - MOUNTAIN_BACKGROUND_SPEED * speedMultiplier;
          // Если элемент ушел за левую границу, перемещаем его за правый край второго элемента
          if (newLeft + INITIAL_MOUNTAIN_WIDTH < 0) {
            // Находим позицию другого элемента
            const otherMountain = prevMountains.find(m => m.id !== mountain.id);
            if (otherMountain) {
               newLeft = otherMountain.left + INITIAL_MOUNTAIN_WIDTH - (MOUNTAIN_BACKGROUND_SPEED * speedMultiplier); // Смещаем ровно за другой элемент
            }
          }
          return { ...mountain, left: newLeft };
        })
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(gameLoopRef.current);

  }, [gameState, birdVelocityY, pipes, score, highScore, backgroundElements, mountainBackgrounds]); // Добавляем backgroundElements и mountainBackgrounds в зависимости

  // Добавляем обработчики клика/тапа на контейнер игры
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const handleTouchStart = (e) => {
      if (gameState === 'playing') { // Только во время игры
        e.preventDefault();
        e.stopPropagation();
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e) => {
      if (gameState === 'playing') { // Только во время игры
        e.preventDefault();
        e.stopPropagation();
        const touchEndY = e.changedTouches[0].clientY;
        const touchDiff = Math.abs(touchEndY - touchStartYRef.current);
        
        if (touchDiff < 10) {
          handleJump();
        }
      }
    };
    
    const handleClick = (e) => {
      if (gameState === 'playing' || gameState === 'idle') { // Во время игры или простоя (для старта)
        e.preventDefault();
        e.stopPropagation();
        handleJump();
      }
    };

    // Добавляем обработчики
    gameArea.addEventListener('click', handleClick);
    gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      // Удаляем обработчики
      gameArea.removeEventListener('click', handleClick);
      gameArea.removeEventListener('touchstart', handleTouchStart);
      gameArea.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, handleJump]); // Зависимость от gameState и handleJump

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

      {/* Отрисовка фоновых элементов (облаков) */}
      {backgroundElements.map(element => {
        // console.log('Rendering background element:', element.id, element.left, element.top); // Лог отрисовки (опционально, может быть много логов)
        return (
        <img
          key={element.id}
          src={element.imageSrc} // Используем сохраненный путь к изображению
          alt="Background element"
          className="background-element"
          style={{
            position: 'absolute',
            top: `${element.top}px`,
            left: `${element.left}px`,
            width: `${element.size}px`,
            height: `${element.size}px`,
          }}
        />
      )})}

      {/* Отрисовка движущегося задника (гор) */}
      {mountainBackgrounds.map(mountain => (
        <img
          key={mountain.id}
          src={MOUNTAIN_IMAGE_SRC}
          alt="Mountain Background"
          className="back-mountain-background"
          style={{
            position: 'absolute',
            bottom: 0, // Располагаем снизу
            left: `${mountain.left}px`, // Позиция по горизонтали
            height: `${MOUNTAIN_BACKGROUND_HEIGHT}px`, // Заданная высота
            width: `${INITIAL_MOUNTAIN_WIDTH}px`, // Заданная ширина
            zIndex: 0, // Низкий z-index, чтобы не перекрывать птицу и трубы
            pointerEvents: 'none', // Игнорировать события мыши/тача
          }}
        />
      ))}

      {/* Отрисовка труб */}
      {pipes.map((pipe, index) => (
        <React.Fragment key={index}>
          {/* Верхняя труба */}
          <img
            src="/pipe.png"
            alt="Верхняя труба"
            className="pipe-image pipe-top"
            style={{
              left: `${pipe.left}px`,
              height: `${pipe.height}px`,
              width: `${PIPE_WIDTH}px`,
              top: 0,
              transform: 'scaleY(-1)', // Переворачиваем изображение по вертикали для верхней трубы
            }}
          />
          {/* Нижняя труба */}
          <img
            src="/pipe.png"
            alt="Нижняя труба"
            className="pipe-image pipe-bottom"
            style={{
              left: `${pipe.left}px`,
              height: `${GAME_HEIGHT - pipe.height - PIPE_GAP}px`,
              width: `${PIPE_WIDTH}px`,
              top: `${pipe.height + PIPE_GAP}px`,
            }}
          />
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
            onClick={() => { // Добавляем обертку для лога
              console.log('Restart button clicked in FlappyGame');
              onRestart();
            }} 
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Restart button touched in FlappyGame');
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