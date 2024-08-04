module.exports = (sequelize, Sequelize) => {
  const UserAchievement = sequelize.define('user-achievement', {
    count: {
      type: Sequelize.INTEGER,
      defaultValue: 1
    }
  });

  return UserAchievement;
};
