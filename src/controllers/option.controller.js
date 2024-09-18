const db = require("../data");

async function create(req, res) {
  try {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ message: "Key and value are required" });
    const existingOption = await db.Option.findOne({ where: { key } });
    if (existingOption) return res.status(400).json({ message: "Option already exists" });
    const option = await db.Option.create({ key, value });
    return res.status(201).json(option);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function getAll(req, res) {
  try {
    const options = await db.Option.findAll();
    return res.status(200).json(options);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function getByKey(req, res) {
  try {
    const { key } = req.params;
    if (!key) return res.status(400).json({ message: "Key is required" });
    const option = await db.Option.findOne({ where: { key } });
    if (!option) return res.status(404).json({ message: "Option not found" });
    return res.status(200).json(option);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { key, value } = req.body;
    const option = await db.Option.findByPk(id);
    if (!option) return res.status(404).json({ message: "Option not found" });
    option.key = key;
    option.value = value;
    await option.save();
    return res.status(200).json(option);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const option = await db.Option.findByPk(id);
    if (!option) return res.status(404).json({ message: "Option not found" });
    await option.destroy();
    return res.status(200).json({ message: "Option deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { create, getAll, getByKey, update, remove };