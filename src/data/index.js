const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('../models/user')(sequelize, Sequelize);
db.TaskChapter = require('../models/task-chapter')(sequelize, Sequelize);
db.GoodDeed = require('../models/good-deed')(sequelize, Sequelize);
db.Task = require('../models/task')(sequelize, Sequelize);
db.UserActivity = require('../models/user-activity')(sequelize, Sequelize);
db.Achievement = require('../models/achievement')(sequelize, Sequelize);
db.UserAchievement = require('../models/user-achievement')(sequelize, Sequelize);
db.Support = require('../models/support')(sequelize, Sequelize);

// relations
db.User.belongsTo(db.User);
db.GoodDeed.belongsTo(db.User);
db.User.hasMany(db.GoodDeed);
db.Task.belongsTo(db.User);
db.UserActivity.belongsTo(db.User);
db.UserAchievement.belongsTo(db.User);
db.UserAchievement.belongsTo(db.Achievement);
db.Support.belongsTo(db.User);

module.exports = db;