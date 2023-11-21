module.exports = (sequelize, Sequelize) => {
  const TaskChapter = sequelize.define('task-chapter', {
    chapter: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    page: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
  });

  return TaskChapter;
};
