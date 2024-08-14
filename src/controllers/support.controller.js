const db = require("../data");
const { Op, where } = require("sequelize")

async function create(req, res) {
  try {
    const { userId } = req;
    const { paid, need } = req.body;
    if (!paid || !need || need <= 0) {
      return res.status(400).json({ message: "paid and need are required and be more than 0" });
    }
    const isUserHadFreeSupport = await db.Support.findOne({ where: { userId, paid: 0 } });
    if (isUserHadFreeSupport) return res.status(400).json({ message: "user already take the free support" });
    await db.Support.create({ userId, paid, need });
    await assignSupports(userId);
    return res.status(200).json({ message: "support recorded!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function status(req, res) {
  try {
    const { userId } = req;
    const supports = await db.Support.findAll({ where: { userId } });
    if (!supports) return res.status(404).json({ message: "Supports not found" });
    const supportGoodDeed = await db.SupportGoodDeed.findOne({ where: { userId } });
    return res.status(200).json({ supports, supportGoodDeed });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function assignSupports(userId) {
  try {
    const START_USER_ID = 35000;
    const supportTracker = await db.Support.findOne({ where: { userId, need: { [Op.gt]: 0 } } });
    if (!supportTracker) return;
    const availableUsers = await db.User.findAll({
      where: {
        id: { [Op.and]: { [Op.ne]: userId, [Op.gt]: START_USER_ID } },
        userId: null
      },
      order: db.sequelize.random(),
      limit: supportTracker.need
    });
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

module.exports = { create, assignSupports, status };