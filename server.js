const express = require('express');
const connectDB = require('./config/db');
const app = express();

// Connect database
connectDB();

const PORT = process.env.PORT || 5000;

app.get('/api', (req, res) => res.send('API running'));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});