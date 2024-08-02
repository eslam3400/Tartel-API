const db = require("../data");
const { Op } = require("sequelize")
const { UserActivityType } = require('../models/enum/user-activity');
const { sendNotification } = require("../utils");

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
            type,
            createdAt: {
              [Op.between]: [startOfDay, endOfDay],
            }
          }
        });
        if (existingContinuously) {
          existingContinuously.value = +existingContinuously.value++;
          await existingContinuously.save();
        } else {
          await db.UserActivity.create({ type, value: 1, userId, meta });
        }
        break;
      case UserActivityType.QuranReading:
        await db.UserActivity.create({ type, value, userId, meta });
        break;
      case UserActivityType.QuranCompletion:
        const existingQuranCompletion = await db.UserActivity.findOne({ where: { userId, type, value } });
        if (!existingQuranCompletion) {
          await db.UserActivity.create({ type, value, userId, meta });
        }
        break;
      case UserActivityType.QuranPledge:
        await db.UserActivity.create({ type, value, userId, meta });
        break;
      case UserActivityType.Telawa:
        await db.UserActivity.create({ type, value, userId, meta });
        break;
      case UserActivityType.Search:
        await db.UserActivity.create({ type, value, userId, meta });
        break;
      case UserActivityType.AyahSharing:
        await db.UserActivity.create({ type, value, userId, meta });
        break;
      default:
        return res.status(400).json({ message: "type is not acceptable!" });
    }
    if (meta?.good_deeds) {
      const userGoodDeeds = await db.GoodDeed.findOne({ where: { userId, isShare: false } });
      const user = await db.User.findOne({ where: { id: userId } });
      if (userGoodDeeds) {
        userGoodDeeds.score = +userGoodDeeds.score + meta.good_deeds;
        if (userGoodDeeds.score - userGoodDeeds.lastNotification >= 10000) {
          userGoodDeeds.lastNotification = userGoodDeeds.score;
          sendNotification({
            title: "الأعمال الصالحة",
            message: `لقد حصلت على ${userGoodDeeds.score} من الأعمال الصالحة`,
            userToken: user.device_token,
          }).catch(x => x);
        }
        await userGoodDeeds.save();
      }
      else {
        await db.GoodDeed.create({ userId, score: meta.good_deeds, isShare: false });
      }
      await giveGoodDeedsToParentTree(meta.good_deeds, user);
    }
    return res.status(200).json({ message: "activity recorded!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function giveGoodDeedsToParentTree(goodDeeds, currentUser) {
  if (!currentUser.userId) return;
  const parentUser = await db.User.findOne({ where: { id: currentUser.userId } });
  if (!parentUser) return;
  const parentUserGoodDeeds = await db.GoodDeed.findOne({ where: { userId: parentUser.id, isShare: true } });
  if (parentUserGoodDeeds) {
    parentUserGoodDeeds.score = +parentUserGoodDeeds.score + goodDeeds;
    await parentUserGoodDeeds.save();
  }
  else {
    await db.GoodDeed.create({ userId: parentUser.id, score: goodDeeds, isShare: true });
  }
  if (currentUser.isSupport) {
    const supportGoodDeed = await db.SupportGoodDeed.findOne({ where: { userId: parentUser.id } });
    if (supportGoodDeed) {
      supportGoodDeed.score = +supportGoodDeed.score + goodDeeds;
      await supportGoodDeed.save();
    }
    else {
      await db.SupportGoodDeed.create({ userId: parentUser.id, score: goodDeeds });
    }
  }
  return await giveGoodDeedsToParentTree(goodDeeds, parentUser);
}

module.exports = { create };