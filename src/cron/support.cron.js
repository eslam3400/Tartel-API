const cron = require('node-cron');
const { assignSupports } = require('../controllers/support.controller');

function getRandomElement(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

async function continueAssignUsers() {
  try {
    const supportTrackers = await db.Support.findAll({ where: { need: { [Op.gt]: 0 } } });
    if (supportTrackers.length === 0) return;
    const finished = [];
    while (finished.length < supportTrackers.length) {
      const available = supportTrackers.filter(supportTracker => !finished.includes(supportTracker.id));
      const element = getRandomElement(available);
      await assignSupports(element.userId);
      finished.push(supportTracker.id);
    }
  } catch (error) {
    console.log("support cron error`", error);
  }
}

console.log("cron job started");
cron.schedule('0 0 * * *', continueAssignUsers);