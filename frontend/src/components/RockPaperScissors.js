import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/kubesimplify-logo.png';

const RockPaperScissors = () => {
  const [userChoice, setUserChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('');

  const choices = ['Rock', 'Paper', 'Scissors'];

  const playGame = async (choice) => {
    setUserChoice(choice);
    const randomIndex = Math.floor(Math.random() * 3);
    const compChoice = choices[randomIndex];
    setComputerChoice(compChoice);

    let gameResult;
    if (choice === compChoice) {
      gameResult = 'Tie!';
    } else if (
      (choice === 'Rock' && compChoice === 'Scissors') ||
      (choice === 'Paper' && compChoice === 'Rock') ||
      (choice === 'Scissors' && compChoice === 'Paper')
    ) {
      gameResult = 'You Win!';
    } else {
      gameResult = 'You Lose!';
    }
    setResult(gameResult);

    // Update backend with game stats
    try {
      let token = localStorage.getItem('token');
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }
      const stats = {
        game_type: 'rock-paper-scissors',
        wins: gameResult === 'You Win!' ? 1 : 0,
        losses: gameResult === 'You Lose!' ? 1 : 0,
      };
      const response = await axios.post('http://localhost:8081/game/stats', stats, {
        headers: { Authorization: token },
      });
      console.log('Rock Paper Scissors stats updated:', response.data);
    } catch (err) {
      console.error('Error updating Rock Paper Scissors stats:', err.response ? err.response.data : err.message);
    }
  };

  const resetGame = () => {
    setUserChoice(null);
    setComputerChoice(null);
    setResult('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <img src={logo} alt="Kubesimplify" className="max-w-xs h-auto mx-auto rounded-lg shadow-md mb-6" />
      <h2 className="text-3xl font-bold text-blue-500 mb-4">Rock Paper Scissors</h2>
      <div className="flex space-x-4 mb-6">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => playGame(choice)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 text-lg font-medium"
          >
            {choice}
          </button>
        ))}
      </div>
      {userChoice && computerChoice && (
        <div className="text-center mb-6">
          <p className="text-lg font-medium">Your Choice: <span className="font-bold">{userChoice}</span></p>
          <p className="text-lg font-medium">Computer's Choice: <span className="font-bold">{computerChoice}</span></p>
          <p className={`text-xl font-bold mt-2 ${result === 'You Win!' ? 'text-green-500' : result === 'You Lose!' ? 'text-red-500' : 'text-gray-700'}`}>
            {result}
          </p>
        </div>
      )}
      <button
        onClick={resetGame}
        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-300 mb-6"
      >
        Reset Game
      </button>
      <a href="/dashboard" className="text-blue-500 hover:underline">Back to Dashboard</a>
    </div>
  );
};

export default RockPaperScissors;
