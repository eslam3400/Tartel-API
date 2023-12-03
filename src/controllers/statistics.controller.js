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
  const quranPledge = await db.UserActivity.findAll({ where: { userId, type: UserActivityType.QuranPledge } });
  if (!quranPledge) return null;
  return getPlayingTimeFromSeconds(quranPledge.reduce((sum, obj) => sum + +obj["value"], 0));
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

const getTelawat = async (req, res) => {
  try {
    const { userId } = req;
    const telawat = await db.UserActivity.findAll({
      where: { userId, type: UserActivityType.Telawa },
      order: [['createdAt', 'DESC']],
      raw: true
    });
    const data = [];
    for (const telawa of telawat) {
      data.push({
        seconds: telawa.value,
        meta: {
          from: {
            surah: telawa.meta.from.surah,
            ayah: telawa.meta.from.ayah
          },
          to: {
            surah: telawa.meta.to.surah,
            ayah: telawa.meta.to.surah
          },
          mistakes: telawa.meta.mistakes,
          record_link: telawa.meta.record_link
        },
        createdAt: telawa.createdAt
      });
    }
    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Server error" });
  }
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

async function progress(req, res) {
  try {
    const { userId } = req;
    const { currentSequenceLength } = await getContinuously(userId);

    res.status(200).json({
      current_continuously: currentSequenceLength,
      last4monthsActivity: await getActivitiesWithin4Months(userId),
      pages: await getNumberOfPagesActivities(userId),
      pledges: await getTimeOfPledgesActivities(userId)
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ msg: "Server error" });
  }
}

async function getActivitiesWithin4Months(userId) {
  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

  const records = await db.UserActivity.findAll({
    where: {
      userId,
      type: UserActivityType.Continuously,
      createdAt: {
        [Op.gte]: fourMonthsAgo,
      },
    },
  });

  const dateCounts = {};

  records.forEach(record => {
    const dateKey = record.createdAt.toISOString().split('T')[0];
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + +record.value;
  });

  // Generate the result array with counts for each date
  const data = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate()); // Start from yesterday and go back 4 months

  for (let i = 0; i < 120; i++) {
    const currentDateKey = currentDate.toISOString().split('T')[0];

    data.unshift({ [currentDateKey]: dateCounts[currentDateKey] || 0 });
    currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
  }

  return data;
}

async function getNumberOfPagesActivities(userId) {
  const records = await db.UserActivity.findAll({
    where: {
      userId,
      type: UserActivityType.QuranReading,
    },
  });

  const dateCounts = {};

  records.forEach(record => {
    const dateKey = record.createdAt.toISOString().split('T')[0];
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + +record.value;
  });

  const data = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate()); // Start from yesterday and go back 4 months

  for (let i = 0; i < 366; i++) {
    const currentDateKey = currentDate.toISOString().split('T')[0];

    data.unshift({ [currentDateKey]: dateCounts[currentDateKey] || 0 });
    currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
  }

  return data;
}

async function getTimeOfPledgesActivities(userId) {
  const records = await db.UserActivity.findAll({
    where: {
      userId,
      type: UserActivityType.QuranPledge,
    },
  });

  const dateCounts = {};

  records.forEach(record => {
    const dateKey = record.createdAt.toISOString().split('T')[0];
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + +record.value;
  });

  const data = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate()); // Start from yesterday and go back 4 months

  for (let i = 0; i < 366; i++) {
    const currentDateKey = currentDate.toISOString().split('T')[0];

    data.unshift({ [currentDateKey]: dateCounts[currentDateKey] || 0 });
    currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
  }

  return data;
}

module.exports = { appOverview, userOverview, getTelawat, progress };