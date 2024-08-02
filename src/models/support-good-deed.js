module.exports = (sequelize, Sequelize) => {
    const SupportGoodDeed = sequelize.define('support', {
        score: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
    });

    return SupportGoodDeed;
};