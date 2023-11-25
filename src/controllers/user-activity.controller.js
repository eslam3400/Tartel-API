const db = require("../data");
const { Op } = require("sequelize")
const { UserActivityType } = require('../models/enum/user-activity-type')

async function create(req, res) {
  try {
    const { userId } = req;
    const { type, value, meta } = req.body;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    switch (type) {
      case UserActivityType.Continuously:
        const existingContinuously = await db.UserActivity.findOne({
          where: {
            userId,
            createdAt: {
              [Op.between]: [startOfDay, endOfDay],
            }
          }
        });
        if (existingContinuously) {
          existingContinuously.value = +existingContinuously.value++;
          await existingContinuously.save();
        }
        await db.UserActivity.create({ type, value: 1, userId });
        break;
      case UserActivityType.QuranReading:
        const existingQuranReading = await db.UserActivity.findOne({ where: { userId, type } });
        if (existingQuranReading) {
          existingQuranReading.value = +existingQuranReading.value + value;
          await existingQuranReading.save();
        } else await db.UserActivity.create({ type, value, userId });
        break;
      case UserActivityType.QuranPledge:
        const existingQuranPledge = await db.UserActivity.findOne({ where: { userId, type } });
        if (existingQuranPledge) {
          existingQuranPledge.value = +existingQuranPledge.value + value;
          await existingQuranPledge.save();
        } else await db.UserActivity.create({ type, value, userId });
        break;
      case UserActivityType.Telawa:
        await db.UserActivity.create({ type, value, userId, meta });
        break;
      default:
        return res.status(400).json({ message: "type is not acceptable!" });
    }
    return res.status(200).json({ message: "activity recorded!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { create };