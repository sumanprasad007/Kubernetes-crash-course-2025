import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import logo from '../assets/kubesimplify-logo.png';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const fullUrl = '/api/auth/register';
      console.log('Signing up at:', fullUrl); // Debug log
      await axios.post(fullUrl, { username, password });
      alert('Signup successful! Please log in.');
      history.push('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-lg shadow-lg">
      <img src={logo} alt="Kubesimplify" className="max-w-xs h-auto mx-auto rounded-lg shadow-md mb-6" />
      <h2 className="text-3xl font-bold text-center text-blue-500 mb-6">Sign Up</h2>
      {error && <p className="text-red-500 text-center mb-4 font-medium">{error}</p>}
      <form onSubmit={handleSignup}>
        <div className="mb-5">
          <label className="block text-gray-700 mb-2 font-medium" htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Enter your username"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300 font-medium"
        >
          Sign Up
        </button>
      </form>
      <p className="text-center mt-5 text-gray-600">
        Already have an account? <a href="/login" className="text-blue-500 hover:underline">Log In</a>
      </p>
    </div>
  );
};

export default Signup;
