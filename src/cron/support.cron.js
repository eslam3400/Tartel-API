const cron = require('node-cron');
const db = require('../data');
const { Op } = require('sequelize');
const { assignSupports } = require('../controllers/support.controller');

function getRandomElement(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

async function continueAssignUsers() {
  try {
    const supportTrackers = await db.Support.findAll({ where: { need: { [Op.gt]: 0 } } });
    const finished = [];
    if (supportTrackers.length === 0) return;
    const users = await db.User.findAll({
      include: db.GoodDeed,
      order: db.sequelize.random(),
    });
    while (finished.length < supportTrackers.length) {
      const available = supportTrackers.filter(supportTracker => !finished.includes(supportTracker.id));
      const element = getRandomElement(available);
      await assignSupports(element.userId, users);
      finished.push(element.id);
    }
  } catch (error) {
    console.log("support cron error`", error);
  }
}

cron.schedule('0 */6 * * *', continueAssignUsers);