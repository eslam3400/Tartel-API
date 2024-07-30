// src/models/support.js
module.exports = (sequelize, Sequelize) => {
    const Support = sequelize.define('support', {
        paid: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        need: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        gained: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    });

    return Support;
};