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
      3 попытки
    </button>
  );
};

export default FlappyStart; 