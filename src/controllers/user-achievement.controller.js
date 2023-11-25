const db = require("../data");

async function get(req, res) {
  try {
    const { userId } = req;
    const userAchievements = await db.UserAchievement.findAll({ where: { userId }, include: [db.Achievement] });
    const data = userAchievements.map(x => x.dataValues.achievement.dataValues);
    return res.status(200).json({
      data: data.map(x => ({
        id: x.id,
        name: x.name,
        base64Image: x.image?.toString("base64"),
      }))
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { get };