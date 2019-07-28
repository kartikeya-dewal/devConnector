const express = require('express');
const connectDB = require('./config/db');
const app = express();
const logger = require('./lib/logger');

// Connect database
connectDB();

// Init middleware
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('API running'));

// Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

app.listen(PORT, () => {
  logger.info(`Listening on port ${PORT}`);
  // console.log(`Listening on port ${PORT}`);
});