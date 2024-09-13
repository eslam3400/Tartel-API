const db = require('../data');
const { Op } = require('sequelize');
const { UserActivityType, TrackingFilter } = require('../models/enum/user-activity');

const getTop10GoodDeeds = async (isShare = false) => {
  return db.GoodDeed.findAll({
    order: [['score', 'DESC']],
    limit: 30,
    where: { isShare },
    raw: true
  })
}

const updateUserGoodDeedInfo = async (info, iteration = 0) => {
  const limit = 1000;
  const goodDeeds = await db.GoodDeed.findAll({
    order: [['score', 'DESC']],
    limit,
    offset: iteration * limit
  });
  if (goodDeeds.length == 0) return;
  const goodDeedsFilter = goodDeeds.filter(x => x.userId == info.id);
  if (goodDeedsFilter.length == 2) {
    info.shareRank = (iteration * 1000) + goodDeeds.findIndex(x => x.userId == info.id && x.isShare);
    info.individualRank = (iteration * 1000) + goodDeeds.findIndex(x => x.userId == info.id && !x.isShare);
    info.shareGoodDeed = goodDeedsFilter.find(x => x.isShare);
    info.individualGoodDeed = goodDeedsFilter.find(x => !x.isShare);
  }
  else {
    const index = goodDeeds.findIndex(x => x.userId == info.id);
    if (index == -1) return updateUserGoodDeedInfo(info, ++iteration);
    if (goodDeeds[index].isShare) {
      info.shareRank = (iteration * 1000) + index;
      info.shareGoodDeed = goodDeeds[index];
    } else {
      info.individualRank = (iteration * 1000) + index;
      info.individualGoodDeed = goodDeeds[index];
    }
  }
  if (!info.shareGoodDeed || !info.individualGoodDeed) {
    return updateUserGoodDeedInfo(info, ++iteration);
  }
}

const getTasksCount = async (userId) => {
  const currentDate = new Date();
  const tenDaysAgo = new Date(currentDate);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  return db.Task.count({
    where: {
      userId,
      updatedAt: { [Op.lt]: tenDaysAgo },
    }
  });
}

const getUserFullGoodDeed = (goodDeed, otherGoodDeed) => {
  return {
    shareScore: goodDeed.isShare ? goodDeed.score : otherGoodDeed?.score ?? 0,
    personalScore: !goodDeed.isShare ? goodDeed.score : otherGoodDeed?.score ?? 0,
    userId: goodDeed.userId
  }
}

const appOverviewV2 = async (req, res) => {
  try {
    const { userId } = req;
    const currentUserInfo = { id: userId, shareRank: 0, individualRank: 0, shareGoodDeed: null, individualGoodDeed: null };
    const [usersCount, topIndividualUsers, topShareUsers, tasks, total_personal_good_deeds, total_share_good_deeds] = await Promise.all([
      db.User.count(),
      getTop10GoodDeeds(false),
      getTop10GoodDeeds(true),
      getTasksCount(userId),
      db.GoodDeed.sum('score', { where: { isShare: false } }),
      db.GoodDeed.sum('score', { where: { isShare: true } }),
      updateUserGoodDeedInfo(currentUserInfo)
    ]);
    if (currentUserInfo.shareRank == 0) {
      currentUserInfo.shareRank = usersCount;
    }
    if (currentUserInfo.individualRank == 0) {
      currentUserInfo.individualRank = usersCount;
    }
    const individualGoodDeeds = await db.GoodDeed.findAll({ where: { userId: { [Op.in]: topIndividualUsers.map(x => x.userId) }, isShare: false }, raw: true });
    const shareGoodDeeds = await db.GoodDeed.findAll({ where: { userId: { [Op.in]: topShareUsers.map(x => x.userId) }, isShare: true }, raw: true });
    const finalTopIndividualUsers = [];
    const finalTopShareUsers = [];
    for (let current of topIndividualUsers) {
      finalTopIndividualUsers.push(getUserFullGoodDeed(current, shareGoodDeeds.find(x => x.userId == current.userId)));
    }
    for (let current of topShareUsers) {
      finalTopShareUsers.push(getUserFullGoodDeed(current, individualGoodDeeds.find(x => x.userId == current.userId)));
    }
    res.json({
      usersCount,
      topIndividualUsers: finalTopIndividualUsers,
      topShareUsers: finalTopShareUsers,
      tasks,
      total_personal_good_deeds,
      total_share_good_deeds,
      currentUserInfo
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

const appOverview = async (req, res) => {
  try {
    const { is_share } = req.query;
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
    if (!topShareUsers?.find(x => x?.userId == currentUser?.id)) {
      topShareUsers.push({
        score: 0,
        userId: currentUser.id,
      })
    }
    if (!topIndividualUsers?.find(x => x?.userId == currentUser?.id)) {
      topIndividualUsers.push({
        score: 0,
        userId: currentUser.id,
      })
    }
    if (topShareUsers.length < 9) {
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
    const users = [];
    const shareUserIds = topShareUsers.map(x => x.userId);
    const shareGoodDeeds = await db.GoodDeed.findAll({ where: { userId: { [Op.in]: shareUserIds }, isShare: true }, raw: true });
    const individualUserIds = topIndividualUsers.map(x => x.userId);
    const individualGoodDeeds = await db.GoodDeed.findAll({ where: { userId: { [Op.in]: individualUserIds }, isShare: false }, raw: true });
    if (is_share == 'true') {
      for (const user of topShareUsers) {
        users.push({
          score: +(shareGoodDeeds.find(x => x.userId == user.userId)?.score || 0),
          personal: +(individualGoodDeeds.find(x => x.userId == user.userId)?.score || 0),
          userId: user.userId,
          isCurrentUser: user.userId == req.userId
        });
      }
    }
    else {
      for (const user of topIndividualUsers) {
        users.push({
          score: +(shareGoodDeeds.find(x => x.userId == user.userId)?.score || 0),
          personal: +(individualGoodDeeds.find(x => x.userId == user.userId)?.score || 0),
          userId: user.userId,
          isCurrentUser: user.userId == req.userId
        });
      }
    }
    res.json({
      usersCount,
      users,
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
      total_personal_good_deeds: await db.GoodDeed.sum('score', { where: { isShare: false } }),
      total_share_good_deeds: await db.GoodDeed.sum('score', { where: { isShare: true } })
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

const getGoodDeedsService = async (userId, filter = null) => {
  let activities
  if (filter) {
    activities = await db.UserActivity.findAll({ where: { userId, createdAt: filter } });
  }
  else {
    activities = await db.UserActivity.findAll({ where: { userId } });
  }
  if (!activities) return null;
  return activities.reduce((sum, obj) => {
    if (obj.meta?.good_deeds) {
      return sum + obj.meta.good_deeds;
    } else {
      return sum;
    }
  }, 0);
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
      ayah_share_count: await getAyahShareCount(userId, duration ? filter : null),
      good_deeds: await getGoodDeedsService(userId, duration ? filter : null)
    })
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ msg: "Server error" });
  }
}

function getStartDateOfCurrentWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);
  return startDate;
}

async function activitiesScoreQuery(options) {
  return db.UserActivity.findAll({
    where: {
      type: {
        [Op.in]: [
          UserActivityType.AyahSharing,
          UserActivityType.QuranPledge,
          UserActivityType.QuranReading
        ],
      },
      createdAt: {
        [Op.gte]: options.date,
      },
    },
    attributes: [
      'userId',
      [db.Sequelize.fn('SUM', db.Sequelize.cast(db.Sequelize.json('meta.good_deeds'), 'INTEGER')), 'totalValue']
    ],
    group: ['userId'],
    having: db.Sequelize.where(db.Sequelize.fn('SUM', db.Sequelize.cast(db.Sequelize.json('meta.good_deeds'), 'INTEGER')), {
      [Op.ne]: null
    }),
    order: [['totalValue', 'DESC']],
    limit: options.limit ?? 5,
    offset: options.offset ?? 0,
    raw: true,
  });
}

async function getActivitiesScore(req, res) {
  try {
    const { userId } = req;
    const { duration } = req.query;
    let date = new Date();
    if (duration == TrackingFilter.Week) date = getStartDateOfCurrentWeek();
    else if (duration == TrackingFilter.Month) date.setDate(1);
    else if (duration == TrackingFilter.Year) {
      date.setMonth(0);
      date.setDate(1);
    }
    date.setHours(0, 0, 0, 0);
    const activities = await activitiesScoreQuery({ date });
    const currentUserInfo = { userId, rank: 0, score: 0 }
    const currentUserIndex = activities?.findIndex(x => x.userId == userId);
    if (currentUserIndex > -1) {
      currentUserInfo.rank = currentUserIndex + 1;
      currentUserInfo.score = activities[currentUserIndex].totalValue;
    }
    else {
      let offset = 5;
      let limit = 1000;
      while (true) {
        const newActivities = await activitiesScoreQuery({ date, limit, offset });
        const currentUserIndex = newActivities?.findIndex(x => x.userId == userId);
        if (currentUserIndex > -1) {
          currentUserInfo.rank = offset + currentUserIndex + 1;
          currentUserInfo.score = newActivities[currentUserIndex].totalValue;
          break;
        }
        if (newActivities.length == 0) break;
        offset += limit;
      }
    }
    if (currentUserInfo.rank == 0) {
      currentUserInfo.rank = await db.User.count();
    }
    res.json({ activities, currentUserInfo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function getUserOwnedUsers(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User id is required' });
    const user = await db.User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const ownedUsers = await db.User.findAll({ where: { userId }, include: db.GoodDeed });
    return res.status(200).json({ user, ownedUsers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
}

async function recentlyJoinedUsers(req, res) {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const users = await db.User.findAll({
      where: {
        createdAt: {
          [Op.gte]: twentyFourHoursAgo
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 1000,
      include: db.GoodDeed
    });

    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = {
  appOverview,
  userOverview,
  getActivities,
  activitiesTracking,
  pagesTracking,
  pledgesTracking,
  progress,
  appOverviewV2,
  getActivitiesScore,
  activitiesScoreQuery,
  getStartDateOfCurrentWeek,
  getUserOwnedUsers,
  recentlyJoinedUsers
};