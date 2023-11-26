const db = require('../data');
const { Op } = require('sequelize');
const { UserActivityType } = require('../models/enum/user-activity-type');
const { getUserAchievements } = require('./user-achievement.controller');

const appOverview = async (req, res) => {
  try {
    const usersCount = await db.User.count();
    const topIndividualUsers = await db.GoodDeed.findAll({
      order: [['score', 'DESC']],
      limit: 7,
      where: { isShare: false }
    });
    const topShareUsers = await db.GoodDeed.findAll({
      order: [['score', 'DESC']],
      limit: 7,
      where: { isShare: true }
    });
    const currentDate = new Date();
    const tenDaysAgo = new Date(currentDate);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tasks = await db.Task.count({
      where: {
        userId: req.userId,
        updatedAt: { [Op.lt]: tenDaysAgo },
      }
    });
    res.json({
      usersCount,
      topShareUsers: topShareUsers.map(x => ({
        score: +x.score,
        userId: x.userId,
        isCurrentUser: x.userId == req.userId
      })),
      topIndividualUsers: topIndividualUsers.map(x => ({
        score: +x.score,
        userId: x.userId,
        isCurrentUser: x.userId == req.userId
      })),
      tasks,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

const getContinuously = async (userId) => {
  const userActivities = await db.UserActivity.findAll({
    where: { userId, type: UserActivityType.Continuously },
    order: [['createdAt', 'ASC']],
    raw: true,
  });

  console.log(userActivities)

  let longestSequence = [];
  let currentSequence = [userActivities[userActivities.length - 1]];
  let tempSequence = [userActivities[0]];

  for (let i = 1; i < userActivities.length; i++) {
    const currentDate = new Date(userActivities[i].createdAt);
    const prevDate = new Date(userActivities[i - 1].createdAt);

    // Check if the current date is the next consecutive day
    if (
      currentDate.getDate() === prevDate.getDate() + 1 &&
      currentDate.getMonth() === prevDate.getMonth() &&
      currentDate.getFullYear() === prevDate.getFullYear()
    ) {
      tempSequence.push(userActivities[i]);
    } else {
      // If the current sequence is longer than the longest, update the longest sequence
      if (tempSequence.length > longestSequence.length) {
        longestSequence = [...tempSequence];
      }
      tempSequence = [userActivities[i]];
    }
  }

  for (let i = userActivities.length - 1; i >= 0; i--) {
    const currentDate = new Date(userActivities[i].createdAt);
    const prevDate = new Date(userActivities[i - 1].createdAt);

    if (
      currentDate.getDate() === prevDate.getDate() + 1 &&
      currentDate.getMonth() === prevDate.getMonth() &&
      currentDate.getFullYear() === prevDate.getFullYear()
    ) {
      currentSequence.push(userActivities[i]);
    } else {
      break;
    }
  }

  return { longestSequenceLength: longestSequence.length, currentSequenceLength: currentSequence.length };
}

const getQuranPercentageCompletion = async (userId) => {
  const completedPages = await db.Task.count({ where: { userId } });
  return (completedPages / 604) * 100;
}

function getPlayingTimeFromSeconds(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

const getQuranPledgeInHours = async (userId) => {
  const quranPledge = await db.UserActivity.findOne({ where: { userId, type: UserActivityType.QuranPledge } });
  if (!quranPledge) return null;
  return getPlayingTimeFromSeconds(+quranPledge.value);
}

const getLatestTelawa = async (userId) => {
  const latest = await db.UserActivity.findOne({
    where: { userId, type: UserActivityType.Telawa },
    order: [['createdAt', 'DESC']],
    raw: true
  });
  if (!latest) return null;
  return {
    seconds: latest.value,
    meta: {
      from: {
        surah: latest.meta.from.surah,
        ayah: latest.meta.from.ayah
      },
      to: {
        surah: latest.meta.to.surah,
        ayah: latest.meta.to.surah
      },
      mistakes: latest.meta.mistakes,
      record_link: latest.meta.record_link
    },
    createdAt: latest.createdAt
  };
}

const userOverview = async (req, res) => {
  try {
    const { userId } = req;
    const { longestSequenceLength, currentSequenceLength } = await getContinuously(userId);

    return res.status(200).json({
      longest_continuously: longestSequenceLength,
      current_continuously: currentSequenceLength,
      quran_completion: await getQuranPercentageCompletion(userId),
      quran_pledge: await getQuranPledgeInHours(userId),
      latest_telawa: await getLatestTelawa(userId),
      achievements: await getUserAchievements(userId)
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { appOverview, userOverview };