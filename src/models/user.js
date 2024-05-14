module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('user', {
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    firebaseId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    device_token: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deviceId: {
      type: Sequelize.STRING,
      allowNull: true,
    }
  });

  return User;
};
