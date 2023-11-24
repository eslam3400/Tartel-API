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
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false, // For self-signed certificates
    //   },
    // },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('../models/user')(sequelize, Sequelize);
db.TaskChapter = require('../models/task-chapter')(sequelize, Sequelize);
db.GoodDeed = require('../models/good-deed')(sequelize, Sequelize);
db.Task = require('../models/task')(sequelize, Sequelize);

// relations
db.GoodDeed.belongsTo(db.User);
db.User.hasMany(db.GoodDeed);
db.Task.belongsTo(db.User);

sequelize.sync({ alter: true });

module.exports = db;