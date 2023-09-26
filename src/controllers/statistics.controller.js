const db = require('../data');

const overview = async (req, res) => {
  try {
    const usersCount = await db.User.count();

    res.json({ usersCount });
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

module.exports = { overview, loginUser };