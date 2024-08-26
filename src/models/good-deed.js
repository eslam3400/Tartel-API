module.exports = (sequelize, Sequelize) => {
  const GoodDeed = sequelize.define('good-deed', {
    score: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    isShare: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    lastNotification: {
      type: Sequelize.BIGINT,
      defaultValue: 0,
    },
    notificationCap: {
      type: Sequelize.BIGINT,
      defaultValue: 1000,
    }
  });

  return GoodDeed;
};
