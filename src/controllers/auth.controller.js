const jwt = require('jsonwebtoken');
const db = require('../data');

const generateToken = (user) => {
  return jwt.sign({ user: user.id }, process.env.SECRET_KEY, {});
};

const registerUser = async (req, res) => {
  try {
    const { phone, firebaseId } = req.body;

    if (!phone || !firebaseId) return res.status(400).json({ msg: 'Invalid phone or firebaseId' });

    const existingUser = await db.User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const newUser = await db.User.create({
      phone,
      firebaseId,
    });

    const token = generateToken(newUser);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { phone, firebaseId } = req.body;

    if (!phone || !firebaseId) return res.status({ msg: 'Invalid phone or firebaseId' });

    const user = await db.User.findOne({ where: { phone, firebaseId } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { registerUser, loginUser };
