module.exports = (sequelize, Sequelize) => {
  const Achievement = sequelize.define('achievement', {
    name: { type: Sequelize.STRING },
    image: { type: Sequelize.BLOB('long') },
  });

  return Achievement;
};
