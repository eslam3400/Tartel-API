module.exports = (sequelize, Sequelize) => {
    const Options = sequelize.define('option', {
        key: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        value: {
            type: Sequelize.STRING,
            allowNull: false,
        }
    });
    return Options;
};