module.exports = (sequelize, Sequelize) => {
  const Achievement = sequelize.define('achievement', {
    name: { type: Sequelize.STRING }
  });

  return Achievement;
};
