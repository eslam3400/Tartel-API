module.exports = (sequelize, Sequelize) => {
  const GoodDeeds = sequelize.define('good-deeds', {
    score: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    isShare: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
  });

  GoodDeeds.belongsTo(db.User, { foreignKey: 'userId' });

  return GoodDeeds;
};
