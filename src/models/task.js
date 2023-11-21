module.exports = (sequelize, Sequelize) => {
  const Task = sequelize.define('task', {
    page: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
  });

  return Task;
};
