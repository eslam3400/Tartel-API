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
    const tasks = await db.Task.findAll({ where: { userId: req.userId }, order: [["updatedAt", "DESC"]], raw: true });
    const chapterTasks = await db.TaskChapter.findAll({
      attributes: ['chapter', 'page', 'updatedAt'],
      order: [['chapter'], ['page']],
      raw: true,
    });

    const groupedByChapter = chapterTasks.reduce((result, task) => {
      if (!result[task.chapter]) {
        result[task.chapter] = {
          chapter: task.chapter,
          pages: [],
        };
      }

      result[task.chapter].pages.push({
        page: task.page,
        updatedAt: task.updatedAt,
      });

      return result;
    }, {});

    const formattedResult = Object.values(groupedByChapter).map(chapter => ({
      chapter: chapter.chapter,
      pages: chapter.pages.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }));

    const orderedResult = [];

    for (const chapter of formattedResult) {
      for (const page of chapter.pages) {
        const task = tasks.find(x => x.page == page.page);
        if (!task) page.updatedAt = new Date();
        else page.updatedAt = task?.updatedAt;
      }
      orderedResult.push(chapter.pages.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)));
    }

    const data = {
      saved: [],
      within7Days: [],
      within10Days: [],
      mustReview: [],
      chapterLatestReview: orderedResult.map((x, i) => ({ chapter: i + 1, mostAwayDate: x[0].updatedAt })),
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
    console.log(error)
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { getChapterTasks, getUserTasks, createUserTasks };