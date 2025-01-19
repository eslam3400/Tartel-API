const db = require("../data");
const { Op } = require("sequelize")

async function create(req, res) {
  try {
    const { userId } = req;
    const { paid, need } = req.body;
    if (paid < 0 || !need || need < 0) {
      return res.status(400).json({ message: "paid and need are required and be more than 0" });
    }
    if (paid == 0) {
      const isUserHadFreeSupport = await db.Support.findOne({ where: { userId, paid: 0 } });
      if (isUserHadFreeSupport) return res.status(400).json({ message: "user already take the free support" });
    }
    await db.Support.create({ userId, paid, need });
    const users = await db.User.findAll({
      include: db.GoodDeed,
      order: db.sequelize.random(),
    });
    await assignSupports(userId, users);
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

async function assignSupports(userId, users) {
  try {
    const asyncTasks = [];
    const supportTracker = await db.Support.findOne({
      where: { userId, need: { [Op.gt]: 0 } },
      order: [['need', 'DESC']]
    });
    if (!supportTracker || supportTracker.need <= 0) return;
    let totalSupport = supportTracker.need + supportTracker.gained;
    let supportToAssign = Math.ceil(totalSupport * 0.3);
    if (supportToAssign > supportTracker.need) {
      supportToAssign = supportTracker.need;
    }

    const userParentChain = getUserParentChain(userId, users);
    const availableUsers = users.filter(user => {
      return (
        !userParentChain.includes(user.id) &&
        user.userId == null &&
        user['good-deeds'].find(goodDeed => goodDeed.isShare === false)?.score >= 100
      );
    }).slice(0, supportToAssign);

    if (availableUsers.length === 0) return;
    for (const user of availableUsers) {
      user.userId = userId;
      user.isSupport = true;
      asyncTasks.push(user.save());
      supportTracker.need -= 1;
      supportTracker.gained += 1;
    }
    asyncTasks.push(supportTracker.save());
    const allUsersScore = availableUsers.reduce((acc, user) => acc + +(user['good-deeds'].find(x => !x.isShare)?.score ?? 0), 0);
    const supportGoodDeed = await db.SupportGoodDeed.findOne({ where: { userId } });
    if (supportGoodDeed) {
      supportGoodDeed.score = +supportGoodDeed.score + allUsersScore;
      asyncTasks.push(supportGoodDeed.save());
    }
    else {
      asyncTasks.push(db.SupportGoodDeed.create({ userId, score: allUsersScore }));
    }
    const goodDeeds = await db.GoodDeed.findOne({ where: { userId, isShare: false } });
    if (goodDeeds) {
      goodDeeds.score = +goodDeeds.score + allUsersScore;
      asyncTasks.push(goodDeeds.save());
    }
    else {
      asyncTasks.push(db.GoodDeed.create({ userId, score: allUsersScore, isShare: false }));
    }
    await Promise.all(asyncTasks);
  } catch (error) {
    console.log(error);
  }
}

function getUserParentChain(userId, users, chain = []) {
  if (!userId || userId < 1) return chain;
  const user = users.find(user => user.id === userId);
  if (!user) return chain;
  chain.push(user.id);
  return getUserParentChain(user.userId, users, chain);
}

module.exports = {
  create,
  assignSupports,
  status,
  getUserParentChain
};