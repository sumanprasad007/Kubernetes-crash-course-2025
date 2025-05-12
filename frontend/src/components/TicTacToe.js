import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../assets/kubesimplify-logo.png';

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // User is X, computer is O
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const isBoardFull = (squares) => {
    return squares.every((square) => square !== null);
  };

  const updateGameStats = async (winner) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Retrieved token:', token);
      const stats = {
        game_type: 'tic-tac-toe',
        wins: winner === 'X' ? 1 : 0, // User wins if X wins
        losses: winner === 'O' ? 1 : 0, // User loses if O (computer) wins
      };
      if (!winner) {
        // Draw: neither a win nor a loss
        stats.wins = 0;
        stats.losses = 0;
      }
      const fullUrl = '/api/game/game/stats';
      console.log('Updating RPS stats at:', fullUrl); // Debug log
      const response = await axios.post(fullUrl, stats, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Tic-Tac-Toe stats updated:', response.data);
    } catch (err) {
      console.error('Error updating Tic-Tac-Toe stats:', err.response ? err.response.data : err.message);
    }
  };

  const makeComputerMove = () => {
    const emptyIndices = board
      .map((square, index) => (square === null ? index : null))
      .filter((index) => index !== null);
    if (emptyIndices.length === 0) return;

    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...board];
    newBoard[randomIndex] = 'O';
    setBoard(newBoard);
    setIsXNext(true);

    // Check for winner or draw after computer's move
    const newWinner = calculateWinner(newBoard);
    if (newWinner || isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner(newWinner);
      updateGameStats(newWinner);
    }
  };

  useEffect(() => {
    if (!isXNext && !gameOver && !calculateWinner(board)) {
      setTimeout(() => {
        makeComputerMove();
      }, 500); // Delay for better UX
    }
  }, [isXNext]); // Only depend on isXNext to prevent multiple triggers

  const handleClick = (index) => {
    if (!isXNext || gameOver || board[index] || calculateWinner(board)) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);

    // Check for winner or draw after user's move
    const newWinner = calculateWinner(newBoard);
    if (newWinner || isBoardFull(newBoard)) {
      setGameOver(true);
      setWinner(newWinner);
      updateGameStats(newWinner);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameOver(false);
    setWinner(null);
  };

  const status = winner
    ? `Winner: ${winner === 'X' ? 'You' : 'Computer'}`
    : isBoardFull(board) && !winner
    ? 'Draw!'
    : `Your turn (X)`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <img src={logo} alt="Kubesimplify" className="max-w-xs h-auto mx-auto rounded-lg shadow-md mb-6" />
      <h2 className="text-3xl font-bold text-blue-500 mb-4">Tic Tac Toe</h2>
      <div className="mb-4 text-lg font-medium">{status}</div>
      <div className="grid grid-cols-3 gap-1 w-64 h-64 bg-gray-200 p-2 rounded-lg shadow-md">
        {board.map((square, index) => (
          <button
            key={index}
            className="w-full h-full bg-white border-2 border-gray-400 text-4xl font-bold flex items-center justify-center hover:bg-gray-100 transition duration-200"
            onClick={() => handleClick(index)}
          >
            {square}
          </button>
        ))}
      </div>
      <button
        onClick={resetGame}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
      >
        Reset Game
      </button>
      <a href="/dashboard" className="text-blue-500 hover:underline mt-6">Back to Dashboard</a>
    </div>
  );
};

export default TicTacToe;
