const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const db = require('../data');

dotenv.config();

const generateToken = (user) => {
  return jwt.sign({ user: user.id }, process.env.SECRET_KEY, {
    expiresIn: '1h',
  });
};

const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await db.User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const newUser = await db.User.create({
      username,
      password,
    });

    const token = generateToken(newUser);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { registerUser, loginUser };
