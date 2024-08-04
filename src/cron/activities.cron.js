const cron = require('node-cron');
const { activitiesScoreQuery, getStartDateOfCurrentWeek } = require('../controllers/statistics.controller');
const { TrackingFilter } = require('../models/enum/user-activity');
const db = require('../data');
const { sendNotification } = require('../utils');

async function activitiesReward(duration = "") {
  try {
    let date = new Date();
    if (duration == TrackingFilter.Week) date = getStartDateOfCurrentWeek();
    else if (duration == TrackingFilter.Month) date.setDate(1);
    else if (duration == TrackingFilter.Year) {
      date.setMonth(0);
      date.setDate(1);
    }
    date.setHours(0, 0, 0, 0);
    let winner = await activitiesScoreQuery({ date, limit: 1 });
    if (winner.length == 0) return;
    winner = winner[0];
    const user = await db.User.findOne({ where: { id: winner.userId } });
    const achievement = await db.Achievement.findOne({ where: { name: "Top user of the " + duration } });
    if (achievement) {
      const userAchievement = await db.UserAchievement.findOne({ where: { userId: winner.userId, achievementId: achievement.id } });
      if (userAchievement) {
        userAchievement.count++;
        await userAchievement.save();
      } else {
        await db.UserAchievement.create({ userId: winner.userId, achievementId: achievement.id, count: 1 });
      }
    }
    await sendNotification({
      title: "Congratulations!",
      message: `You have won the title of the top user of the ${duration}!`,
      userToken: user.device_token,
    });
  } catch (error) {
    console.log("support cron error`", error);
  }
}

// End of the day (23:55 every day)
cron.schedule('55 23 * * *', () => activitiesReward());

// End of the week (23:55 every Saturday)
cron.schedule('55 23 * * 6', () => activitiesReward(TrackingFilter.Week));

// End of the month (23:55 on the last day of every month)
cron.schedule('55 23 28-31 * *', () => activitiesReward(TrackingFilter.Month));

// End of the year (23:55 on December 31st)
cron.schedule('55 23 31 12 *', () => activitiesReward(TrackingFilter.Year));