// history-service/src/models/GameHistory.js
const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gameType: { type: String, enum: ['snake', 'tictactoe', 'rps'] },
  score: Number,
  result: { type: String, enum: ['win', 'loss', 'draw'] },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GameHistory', gameHistorySchema);

