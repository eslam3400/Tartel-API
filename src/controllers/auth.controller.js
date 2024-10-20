const jwt = require('jsonwebtoken');
const db = require('../data');
const { UserActivityType } = require('../models/enum/user-activity');

const generateToken = (user) => {
  return jwt.sign({ user: user.id }, process.env.SECRET_KEY, {});
};

const auth = async (req, res) => {
  try {
    const { phone, firebaseId, device_token } = req.body;

    if (!phone || !firebaseId) return res.status({ msg: 'Invalid phone or firebaseId' });

    let user = await db.User.findOne({ where: { phone, firebaseId } });

    if (!user) {
      user = await db.User.create({
        phone,
        firebaseId,
        device_token
      });
    }

    db.User.update({ device_token }, { where: { id: user.id } });
    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'Server error' });
  }
};

const invitation = async (req, res) => {
  try {
    const { userId } = req;
    const { firebaseId } = req.params;
    const user = await db.User.findOne({ where: { id: userId } });
    if (user?.userId) return res.status(200).json();
    const invitationSender = await db.User.findOne({ where: { firebaseId } });
    await db.User.update({ userId: invitationSender.id }, { where: { id: userId } });
    const userShareGoodDeed = await db.GoodDeed.findOne({ where: { userId: invitationSender.id, isShare: true } })
    if (userShareGoodDeed) {
      userShareGoodDeed.score = +userShareGoodDeed.score + 10;
      await userShareGoodDeed.save();
    } else {
      await db.GoodDeed.create({ userId: invitationSender.id, score: 10, isShare: true });
    }
    await db.UserActivity.create({ type: UserActivityType.AppShare, value: "1", meta: { good_deeds: 10 }, userId: invitationSender.id });
    return res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { auth, invitation }