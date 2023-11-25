module.exports = (sequelize, Sequelize) => {
  const UserActivity = sequelize.define('user-activity', {
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    value: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    meta: {
      type: Sequelize.JSON,
      allowNull: true,
    }
  });

  return UserActivity;
};
