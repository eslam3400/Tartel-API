const db = require("../data");
const sequelize = require("sequelize")

async function getChapterTasks(req, res) {
  try {
    const chapterTasks = await db.TaskChapter.findAll({
      attributes: ['chapter', [sequelize.fn('ARRAY_AGG', sequelize.col('page')), 'pages']],
      group: ['chapter'],
      order: ['chapter'],
    });
    return res.status(200).json({ data: chapterTasks });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
}

async function createUserTasks(req, res) {
  try {
    const { page } = req.body;
    if (page == null) return res.status(400).json({ message: "page is missing!" });
    const existingTask = await db.Task.findOne({ where: { userId: req.userId, page } })
    if (existingTask) {
      existingTask.page = +page;
      await existingTask.save();
    } else await db.Task.create({ userId: req.userId, page });
    return res.status(200).json({ message: "task updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Server error' });
  }
}

async function getUserTasks(req, res) {
  try {
    const tasks = await db.Task.findAll({ where: { userId: req.userId } });
    console.log(req.userId);
    const data = {
      saved: [],
      within7Days: [],
      within10Days: [],
      mustReview: []
    }
    for (const task of tasks) {
      const lastUpdateDate = new Date(task.updatedAt);
      const currentDate = new Date();
      const timeDifference = lastUpdateDate - currentDate;
      const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
      if (new Date(task.createdAt) - lastUpdateDate == 0) {
        data.saved.push(+task.page)
      } else if (daysDifference <= 7) {
        data.within7Days.push(+task.page)
      } else if (daysDifference <= 10) {
        data.within10Days.push(+task.page)
      } else {
        data.mustReview.push(+task.page)
      }
    }
    return res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { getChapterTasks, getUserTasks, createUserTasks };