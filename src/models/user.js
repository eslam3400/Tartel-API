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
    device_token: {
      type: Sequelize.STRING,
      allowNull: true,
    }
  });

  return User;
};
