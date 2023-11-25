const db = require("../data");

async function create(req, res) {
  try {
    const { name } = req.body;
    const { buffer } = req.file;

    await db.Achievement.create({ name, image: buffer });

    return res.status(200).json({ message: "achievement created!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function getAll(req, res) {
  try {
    const achievements = await db.Achievement.findAll({});
    return res.status(200).json({
      data: achievements.map(x => ({
        id: x.id,
        name: x.name,
        base64Image: x.image?.toString("base64"),
      }))
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { create, getAll };