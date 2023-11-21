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
  });

  return GoodDeed;
};
