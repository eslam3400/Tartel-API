const db = require("../data");
const { Op } = require("sequelize")

async function create(req, res) {
  try {
    const { userId } = req;
    const { paid, need } = req.body;
    if (!paid || !need || paid <= 0 || need <= 0) {
      return res.status(400).json({ message: "paid and need are required and be more than 0" });
    }
    await db.Support.create({ userId, paid, need });
    await assignSupports(userId);
    return res.status(200).json({ message: "activity recorded!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function assignSupports(userId) {
  try {
    const supportTracker = await db.Support.findOne({ where: { userId, need: { [Op.gt]: 0 } } });
    if (!supportTracker) return;
    const availableUsers = await db.User.findAll({ where: { id: { [Op.ne]: userId }, userId: null }, limit: supportTracker.need });
    if (availableUsers.length === 0) return;
    for (const user of availableUsers) {
      user.userId = userId;
      user.isSupport = true;
      await user.save();
      supportTracker.need -= 1;
      supportTracker.gained += 1;
      await supportTracker.save();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { create, assignSupports };