const jwt = require('jsonwebtoken');
const db = require('../data');

const generateToken = (user) => {
  return jwt.sign({ user: user.id }, process.env.SECRET_KEY, {});
};

const auth = async (req, res) => {
  try {
    const { phone, firebaseId } = req.body;

    if (!phone || !firebaseId) return res.status({ msg: 'Invalid phone or firebaseId' });

    let user = await db.User.findOne({ where: { phone, firebaseId } });

    if (!user) {
      user = await db.User.create({
        phone,
        firebaseId,
      });
    }

    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { auth }