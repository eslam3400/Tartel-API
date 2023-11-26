const db = require("../data");

const getUserAchievements = async (userId) => {
  const userAchievements = await db.UserAchievement.findAll({ where: { userId }, include: [db.Achievement] });
  const data = userAchievements.map(x => x.dataValues.achievement.dataValues);
  return data.map(x => ({
    name: x.name,
    base64Image: x.image?.toString("base64"),
  }));
}

async function get(req, res) {
  try {
    const { userId } = req;
    return res.status(200).json({ data: await getUserAchievements(userId) });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { get, getUserAchievements };