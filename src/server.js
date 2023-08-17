const express = require('express');
const dotenv = require('dotenv');
const db = require('./data');
const authRoutes = require('./routes/auth-routes');

dotenv.config();

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;

db.sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server is running on http://localhost:${PORT}`)
    );
  })
  .catch((error) => console.error('Unable to connect to the database:', error));
