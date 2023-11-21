const db = require('../data');
const { Op } = require('sequelize');

const overview = async (req, res) => {
  try {
    const usersCount = await db.User.count();
    const topIndividualUsers = await db.GoodDeed.findAll({
      order: [['score', 'DESC']],
      limit: 7,
      where: { isShare: false }
    });
    const topShareUsers = await db.GoodDeed.findAll({
      order: [['score', 'DESC']],
      limit: 7,
      where: { isShare: true }
    });
    const currentDate = new Date();
    const tenDaysAgo = new Date(currentDate);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tasks = await db.Task.count({
      where: {
        userId: req.userId,
        updatedAt: { [Op.lt]: tenDaysAgo },
      }
    });
    res.json({
      usersCount,
      topShareUsers: topShareUsers.map(x => ({
        score: +x.score,
        userId: x.userId,
        isCurrentUser: x.userId == req.userId
      })),
      topIndividualUsers: topIndividualUsers.map(x => ({
        score: +x.score,
        userId: x.userId,
        isCurrentUser: x.userId == req.userId
      })),
      tasks,
    });
  } catch (error) {
    console.log(error);
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