/**
 * @file: FlappyStart.jsx
 * @description: Компонент кнопки старта игры Flappy Bird
 * @dependencies: React
 * @created: 02.06.2025
 */

import React from 'react';
import './FlappyStart.css';

const FlappyStart = ({ onClick }) => {
  return (
    <button className="flappy-start" onClick={onClick}>
      Начать игру
    </button>
  );
};

export default FlappyStart; 