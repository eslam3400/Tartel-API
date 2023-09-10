module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    firebaseId: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
  });

  return User;
};
