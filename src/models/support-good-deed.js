module.exports = (sequelize, Sequelize) => {
    const SupportGoodDeed = sequelize.define('support-good-deed', {
        score: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        },
    });

    return SupportGoodDeed;
};