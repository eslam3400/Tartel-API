'use strict';

const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const quran = await readFileAsync('quran.json', 'utf8');
    const quranData = JSON.parse(quran);
    const chapters = [];
    for (const item of quranData) {
      const existingPage = chapters.find(x => x.chapter == item.chapter && x.page == item.page);
      if (!existingPage) {
        chapters.push({ chapter: item.chapter, page: item.page, createdAt: new Date(), updatedAt: new Date() })
      }
    }
    await queryInterface.bulkInsert('task-chapters', chapters, {});
  },

  async down(queryInterface, Sequelize) { }
};
