const db = require("../data");

async function create(req, res) {
  try {
    const { name } = req.body;
    await db.Achievement.create({ name });
    return res.status(200).json({ message: "achievement created!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function getAchievementsService(userId) {
  const userAchievements = await db.UserAchievement.findAll({ where: { userId } });
  const achievements = await db.Achievement.findAll({});
  for (const achievement of achievements) {
    achievement.isEarned = false;
  }
  for (const userAchievement of userAchievements) {
    const achievement = achievements.find(x => x.id == userAchievement.achievementId)
    achievement.isEarned = true;
  }
  achievements.sort((a, b) => (a.isEarned === b.isEarned) ? 0 : a.isEarned ? -1 : 1);
  return achievements.map(x => ({
    id: x.id,
    name: x.name,
    isEarned: x.isEarned,
    base64Image: x.image?.toString("base64"),
  }));
}

async function getAll(req, res) {
  try {
    const { userId } = req;
    return res.status(200).json({ data: await getAchievementsService(userId) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function getMine(req, res) {
  try {
    const { userId } = req;
    const userAchievements = await db.UserAchievement.findAll({ where: { userId }, include: db.Achievement });
    return res.status(200).json(userAchievements);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { create, getAll, getAchievementsService, getMine };