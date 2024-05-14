const jwt = require('jsonwebtoken');
const db = require('../data');
const { UserActivityType } = require('../models/enum/user-activity');
const { Op } = require('sequelize');

const generateToken = (user) => {
  return jwt.sign({ user: user.id }, process.env.SECRET_KEY, {});
};

const auth = async (req, res) => {
  try {
    const { email, phone, firebaseId, device_id, device_token, is_new_auth } = req.body;

    if (!is_new_auth && (!phone || !firebaseId)) {
      return res.status(400).json({ msg: 'Invalid phone or firebaseId' });
    }
    if (is_new_auth && !email && !device_id) return res.status({ msg: 'Invalid email or deviceId' });

    const query = { where: {} };
    // old way
    if (!is_new_auth) {
      query.where.phone = phone;
      query.where.firebaseId = firebaseId;
    }
    // new way
    else {
      if (email && device_id) {
        const orQuery = [];
        orQuery.push({ email }, { deviceId: device_id });
        if (phone) orQuery.push({ phone });
        query.where[Op.or] = orQuery;
      }
      else if (device_id) query.where.deviceId = device_id;
    }
    const users = await db.User.findAll(query);
    let user = null;
    if (users && users.length > 0) user = users[users.length - 1];
    if (users && users.length > 1) {
      await db.User.destroy({ where: { id: users[0].id } });
    }
    if (!user) {
      user = await db.User.create({
        email,
        firebaseId,
        phone,
        deviceId: device_id,
        device_token
      });
    }
    const updateQuery = { device_token, firebaseId };
    if (is_new_auth && user) {
      if (!user.email && email) updateQuery.email = email;
      if (!user.deviceId && device_id) updateQuery.deviceId = device_id;
      if (!user.phone && phone) updateQuery.phone = phone;
    }

    db.User.update(updateQuery, { where: { id: user.id } });
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