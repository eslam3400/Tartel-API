const db = require("../data");
const { Op } = require("sequelize")
const { UserActivityType } = require('../models/enum/user-activity');
const { sendNotification, logMessage } = require("../utils");

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
      const userGoodDeed = await db.GoodDeed.findOne({ where: { userId, isShare: false } });
      const user = await db.User.findOne({ where: { id: userId } });
      logMessage("---------------------------------------");
      logMessage({ "Old user good deeds": meta.good_deeds });
      logMessage({ "User gained good deeds": userGoodDeed.score });
      if (userGoodDeed) {
        userGoodDeed.score = +userGoodDeed.score + meta.good_deeds;
        if (userGoodDeed.score - userGoodDeed.lastNotification >= 10000) {
          userGoodDeed.lastNotification = userGoodDeed.score;
          sendNotification({
            title: "الأعمال الصالحة",
            message: `لقد حصلت على ${userGoodDeed.score} من الأعمال الصالحة`,
            userToken: user.device_token,
          }).catch(x => x);
        }
        await userGoodDeed.save();
      }
      else {
        await db.GoodDeed.create({ userId, score: meta.good_deeds, isShare: false });
      }
      logMessage({ "New user good deeds": userGoodDeed.score });
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
  logMessage({
    currentUserId: currentUser.id,
    id: parentUser.id,
    "Parent good deeds before": parentUserGoodDeeds.score,
  });
  if (parentUserGoodDeeds) {
    parentUserGoodDeeds.score = +parentUserGoodDeeds.score + goodDeeds;
    await parentUserGoodDeeds.save();
  }
  else {
    await db.GoodDeed.create({ userId: parentUser.id, score: goodDeeds, isShare: true });
  }
  logMessage({ "Parent user good deeds after": parentUserGoodDeeds.score });
  if (currentUser.isSupport) {
    const supportGoodDeed = await db.SupportGoodDeed.findOne({ where: { userId: parentUser.id } });
    logMessage({
      type: "support",
      currentUserId: currentUser.id,
      id: parentUser.id,
      gained: goodDeeds,
      "Parent support good deeds before": supportGoodDeed.score,
    });
    if (supportGoodDeed) {
      supportGoodDeed.score = +supportGoodDeed.score + goodDeeds;
      await supportGoodDeed.save();
    }
    else {
      await db.SupportGoodDeed.create({ userId: parentUser.id, score: goodDeeds });
    }
    logMessage({ "Parent user support good deeds after": supportGoodDeed.score });
  }
  return await giveGoodDeedsToParentTree(goodDeeds, parentUser);
}

module.exports = { create };