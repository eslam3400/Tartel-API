const jwt = require('jsonwebtoken');
const db = require('../data');

const generateToken = (user) => {
  return jwt.sign({ user: user.id }, process.env.SECRET_KEY, {});
};

const auth = async (req, res) => {
  try {
    const { phone, firebaseId } = req.body;

    if (!phone || !firebaseId) return res.status({ msg: 'Invalid phone or firebaseId' });

    let user = await db.User.findOne({ where: { phone, firebaseId } });

    if (!user) {
      user = await db.User.create({
        phone,
        firebaseId,
      });
    }

    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const invitation = async (req, res) => {
  try {
    const { userId } = req;
    const { firebaseId } = req.params;
    const invitationSender = await db.User.findOne({ where: { firebaseId } });
    await db.User.update({ userId: invitationSender.id }, { where: { id: userId } });
    const userShareGoodDeed = await db.GoodDeed.findOne({ where: { userId, isShare: true } })
    if (userShareGoodDeed) {
      userShareGoodDeed.score += 10;
      await userShareGoodDeed.save();
    } else {
      await db.GoodDeed.create({ userId, score: 10, isShare: true });
    }
    return res.status(200).json();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { auth, invitation }