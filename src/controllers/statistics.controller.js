const db = require('../data');
const { Op, BaseError } = require('sequelize');
const { UserActivityType, TrackingFilter } = require('../models/enum/user-activity');
const { getAchievementsService } = require('./achievement.controller');

const appOverview = async (req, res) => {
  try {
    const usersCount = await db.User.count();
    const topIndividualUsers = await db.GoodDeed.findAll({
      order: [['score', 'DESC']],
      limit: 9,
      where: { isShare: false }
    });
    const topShareUsers = await db.GoodDeed.findAll({
      order: [['score', 'DESC']],
      limit: 9,
      where: { isShare: true }
    });
    const currentUser = await db.User.findOne({ where: { id: req.userId } })
    if (!topShareUsers.find(x => x.userId == currentUser.id)) {
      topShareUsers.push({
        score: 0,
        userId: currentUser.id,
      })
    }
    if (!topIndividualUsers.find(x => x.userId == currentUser.id)) {
      topIndividualUsers.push({
        score: 0,
        userId: currentUser.id,
      })
    }
    if (topShareUsers.length < 9 || topIndividualUsers.length < 9) {
      const users = await db.User.findAll({
        order: [['createdAt', 'ASC']],
        limit: 9,
      })
      for (const user of users) {
        if (topShareUsers.length < 9 && !topShareUsers.find(x => x.userId == user.id)) {
          topShareUsers.push({
            score: 0,
            userId: user.id,
          })
        }
        if (topIndividualUsers.length < 9 && !topIndividualUsers.find(x => x.userId == user.id)) {
          topIndividualUsers.push({
            score: 0,
            userId: user.id,
          })
        }
      }
    }
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
    if (i - 1 < 0) break;
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

const getQuranPercentageCompletion = async (userId, filter = null) => {
  let completedPages
  if (filter) {
    completedPages = await db.UserActivity.count({ where: { userId, type: UserActivityType.QuranCompletion, createdAt: filter } });
  }
  else {
    completedPages = await db.UserActivity.count({ where: { userId, type: UserActivityType.QuranCompletion } });
  }
  return (completedPages / 604) * 100;
}

const getEarnedBadgesCount = async (userId, filter = null) => {
  let earnedBadges
  if (filter) {
    earnedBadges = await db.UserAchievement.count({ where: { userId, createdAt: filter } });
  }
  else {
    earnedBadges = await db.UserAchievement.count({ where: { userId } });
  }
  return earnedBadges;
}

const getSearchCount = async (userId, filter = null) => {
  let searchCount
  if (filter) {
    searchCount = await db.UserActivity.count({ where: { userId, type: UserActivityType.Search, createdAt: filter } });
  }
  else {
    searchCount = await db.UserActivity.count({ where: { userId, type: UserActivityType.Search } });
  }
  return searchCount;
}

const getAyahShareCount = async (userId, filter = null) => {
  let ayahShareCount
  if (filter) {
    ayahShareCount = await db.UserActivity.count({ where: { userId, type: UserActivityType.AyahSharing, createdAt: filter } });
  }
  else {
    ayahShareCount = await db.UserActivity.count({ where: { userId, type: UserActivityType.AyahSharing } });
  }
  return ayahShareCount;
}

const getQuranTelawaDuration = async (userId, filter = null) => {
  let telawat
  if (filter) {
    telawat = await db.UserActivity.findAll({ where: { userId, type: UserActivityType.QuranReading, createdAt: filter } });
  }
  else {
    telawat = await db.UserActivity.findAll({ where: { userId, type: UserActivityType.QuranReading } });
  }
  if (!telawat) return null;
  return getPlayingTimeFromSeconds(telawat.reduce((sum, obj) => sum + +obj["value"], 0));
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

const getQuranPledgeInHours = async (userId, filter = null) => {
  let quranPledge
  if (filter) {
    quranPledge = await db.UserActivity.findAll({ where: { userId, type: UserActivityType.QuranPledge, createdAt: filter } });
  }
  else {
    quranPledge = await db.UserActivity.findAll({ where: { userId, type: UserActivityType.QuranPledge } });
  }
  if (!quranPledge) return null;
  return getPlayingTimeFromSeconds(quranPledge.reduce((sum, obj) => sum + +obj["value"], 0));
}

const getLatestActivityService = async (userId) => {
  const latest = await db.UserActivity.findOne({
    where: { userId, type: { [Op.or]: [UserActivityType.Telawa, UserActivityType.QuranReading] } },
    order: [['createdAt', 'DESC']],
    raw: true
  });
  if (!latest) return null;
  return {
    type: latest.type,
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

const getActivities = async (req, res) => {
  try {
    const { userId } = req;
    const { filter } = req.query;

    const activities = await db.UserActivity.findAll({
      where: {
        userId,
        type: filter != null ? filter : { [Op.or]: [UserActivityType.Telawa, UserActivityType.QuranReading] }
      },
      order: [['createdAt', 'DESC']],
      raw: true
    });
    const data = [];
    for (const activity of activities) {
      data.push({
        type: activity.type,
        seconds: activity.value,
        meta: activity.meta,
        createdAt: activity.createdAt
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
      latest_activity: await getLatestActivityService(userId),
      // achievements: await getAchievementsService(userId)
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
};

async function activitiesTracking(req, res) {
  try {
    const { userId } = req;

    res.status(200).json({ data: await getActivitiesWithin4Months(userId) });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ msg: "Server error" });
  }
}

async function pagesTracking(req, res) {
  try {
    const { userId } = req;
    res.status(200).json({ data: await getNumberOfPagesActivitiesService(userId) });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ msg: "Server error" });
  }
}

async function pledgesTracking(req, res) {
  try {
    const { userId } = req;
    res.status(200).json({ data: await getValueOfPledgeActivitiesService(userId) });
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
  const monthsData = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  let months = [];

  for (let i = 0; i < 120; i++) {
    const currentDateKey = currentDate.toISOString().split('T')[0];
    const month = monthsData[new Date(currentDateKey).getMonth()];
    if (!months.includes(month)) {
      months.push(month);
    }
    data.unshift({ [currentDateKey]: dateCounts[currentDateKey] || 0 });
    currentDate.setDate(currentDate.getDate() - 1); // Move to the previous day
  }
  months = months.reverse();
  return { months, data };
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

async function getNumberOfPagesActivitiesService(userId) {
  const records = await db.UserActivity.findAll({
    where: {
      userId,
      type: UserActivityType.QuranCompletion,
    },
  });
  const dayCounts = {};
  const weekCounts = {};
  const monthCounts = {};

  records.forEach(record => {
    const dateKey = record.createdAt.toISOString().split('T')[0];
    dayCounts[dateKey] = (dayCounts[dateKey] || 0) + 1;
  });

  const days = [];
  const weeks = [];
  const months = [];

  for (const key in dayCounts) {
    if (Object.hasOwnProperty.call(dayCounts, key)) {
      const element = dayCounts[key];
      days.push({ [key]: element });
    }
  }

  days.forEach(item => {
    const date = Object.keys(item)[0];
    const value = item[date];

    const week = getWeekNumber(new Date(date));
    const month = new Date(date).getMonth() + 1; // Months are 0-indexed in JavaScript

    // Group by week
    if (!weekCounts[week]) {
      weekCounts[week] = 0;
    }
    weekCounts[week] += value

    // Group by month
    if (!monthCounts[month]) {
      monthCounts[month] = 0;
    }
    monthCounts[month] += value;
  });

  for (const key in weekCounts) {
    if (Object.hasOwnProperty.call(weekCounts, key)) {
      const element = weekCounts[key];
      weeks.push({ [key]: element });
    }
  }

  for (const key in monthCounts) {
    if (Object.hasOwnProperty.call(monthCounts, key)) {
      const element = monthCounts[key];
      months.push({ [key]: element });
    }
  }

  return { days, weeks, months };
}

async function getValueOfPledgeActivitiesService(userId) {
  const records = await db.UserActivity.findAll({
    where: {
      userId,
      type: UserActivityType.QuranPledge,
    },
  });
  const dayCounts = {};
  const weekCounts = {};
  const monthCounts = {};

  records.forEach(record => {
    const dateKey = record.createdAt.toISOString().split('T')[0];
    dayCounts[dateKey] = (dayCounts[dateKey] || 0) + +record.value;
  });

  const days = [];
  const weeks = [];
  const months = [];

  for (const key in dayCounts) {
    if (Object.hasOwnProperty.call(dayCounts, key)) {
      const element = dayCounts[key] / 60;
      days.push({ [key]: element });
    }
  }

  days.forEach(item => {
    const date = Object.keys(item)[0];
    const value = item[date];

    const week = getWeekNumber(new Date(date));
    const month = new Date(date).getMonth() + 1; // Months are 0-indexed in JavaScript

    // Group by week
    if (!weekCounts[week]) {
      weekCounts[week] = 0;
    }
    weekCounts[week] += value

    // Group by month
    if (!monthCounts[month]) {
      monthCounts[month] = 0;
    }
    monthCounts[month] += value;
  });

  for (const key in weekCounts) {
    if (Object.hasOwnProperty.call(weekCounts, key)) {
      const element = weekCounts[key] / (60 * 60);
      weeks.push({ [key]: element });
    }
  }

  for (const key in monthCounts) {
    if (Object.hasOwnProperty.call(monthCounts, key)) {
      const element = monthCounts[key] / (60 * 60);
      months.push({ [key]: element });
    }
  }

  return { days, weeks, months };
}

async function progress(req, res) {
  try {
    const { userId } = req;
    const { duration } = req.query;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), (today.getDate()) - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 0);
    const filter = {
      [Op.between]: duration == TrackingFilter.Day ? [startOfDay, endOfDay] : (duration == TrackingFilter.Week ? [startOfWeek, endOfWeek] : [startOfYear, endOfYear])
    }
    res.status(200).json({
      quran_pledge: await getQuranPledgeInHours(userId, duration ? filter : null),
      quran_completion: await getQuranPercentageCompletion(userId, duration ? filter : null),
      quran_telawa: await getQuranTelawaDuration(userId, duration ? filter : null),
      earned_badges: await getEarnedBadgesCount(userId, duration ? filter : null),
      search_count: await getSearchCount(userId, duration ? filter : null),
      ayah_share_count: await getAyahShareCount(userId, duration ? filter : null)
    })
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ msg: "Server error" });
  }
}

module.exports = {
  appOverview,
  userOverview,
  getActivities,
  activitiesTracking,
  pagesTracking,
  pledgesTracking,
  progress
};