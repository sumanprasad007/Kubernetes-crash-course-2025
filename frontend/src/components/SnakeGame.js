import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../assets/kubesimplify-logo.png';

const Snake = () => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const boardSize = 20;
  const speed = 200;

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        switch (direction) {
          case 'RIGHT':
            head.x += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          default:
            break;
        }

        // Check for collision with walls
        if (head.x < 0 || head.x >= boardSize || head.y < 0 || head.y >= boardSize) {
          setGameOver(true);
          return prevSnake;
        }

        // Check for collision with self
        for (let i = 1; i < newSnake.length; i++) {
          if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
            setGameOver(true);
            return prevSnake;
          }
        }

        newSnake.unshift(head);

        // Check if food is eaten
        if (head.x === food.x && head.y === food.y) {
          setScore((prevScore) => {
            const newScore = prevScore + 1;
            // Update high score in backend
            try {
              let token = localStorage.getItem('token');
              if (token && token.startsWith('Bearer ')) {
                token = token.split(' ')[1];
              }
              console.log('Retrieved token:', token);

              const fullUrl = '/api/game/snake/score';
              console.log('Updating RPS stats at:', fullUrl); // Debug log
              axios.post(fullUrl, { score: newScore }, {
                headers: { Authorization: `Bearer ${token}` },
              }).then((response) => {
                console.log('Snake score updated:', response.data);
              }).catch((err) => {
                console.error('Error updating score:', err.response ? err.response.data : err.message);
              });
            } catch (err) {
              console.error('Error in score update request:', err);
            }
            return newScore;
          });
          setFood({
            x: Math.floor(Math.random() * boardSize),
            y: Math.floor(Math.random() * boardSize),
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [snake, direction, food, gameStarted, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const board = Array(boardSize).fill().map(() => Array(boardSize).fill(''));

  snake.forEach(segment => {
    board[segment.y][segment.x] = 'snake';
  });
  board[food.y][food.x] = 'food';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <img src={logo} alt="Kubesimplify" className="max-w-xs h-auto mx-auto rounded-lg shadow-md mb-6" />
      <h2 className="text-3xl font-bold text-blue-500 mb-4">Snake Game</h2>
      {!gameStarted && !gameOver && (
        <button
          onClick={startGame}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 mb-4"
        >
          Start
        </button>
      )}
      {gameOver && (
        <div className="text-center mb-4">
          <p className="text-red-500 text-xl font-bold">Game Over!</p>
          <button
            onClick={startGame}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 mt-2"
          >
            Restart
          </button>
        </div>
      )}
      <p className="text-lg font-medium mb-4">Score: {score}</p>
      <div className="border-2 border-blue-500 p-2 rounded-lg">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`w-6 h-6 border border-gray-300 ${
                  cell === 'snake' ? 'bg-green-500' : cell === 'food' ? 'bg-red-500' : 'bg-white'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <a href="/dashboard" className="text-blue-500 hover:underline mt-6">Back to Dashboard</a>
    </div>
  );
};

export default Snake;
