require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const util = require('util');
// const db = require('./data');
const authRoutes = require('./routes/auth.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const tasksRoutes = require('./routes/tasks.routes');
const readFileAsync = util.promisify(fs.readFile);

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use('/api/tasks', tasksRoutes);

app.get("/api/ayat", async (req, res) => {
  try {
    const { translation, type } = req.query;
    const data = []
    const typeName = type == null || type == 1 ? "uthmani" : "indopak";
    const [response, translationResponse, quran] = await Promise.all([
      axios.get(`https://api.quran.com/api/v4/quran/verses/${typeName}`),
      axios.get(`https://api.quran.com/api/v4/quran/translations/${translation ?? 131}`),
      readFileAsync('quran.json', 'utf8')
    ]);
    const quranData = JSON.parse(quran);
    const { translations } = translationResponse.data
    for (let i = 0; i < response.data.verses.length; i++) {
      const item = response.data.verses[i];
      const surah = item.verse_key.split(":")[0];
      const ayah = item.verse_key.split(":")[1];
      const existingSurah = data.find(x => x.surah === surah)
      if (existingSurah) {
        existingSurah.ayat.push({
          ayah,
          arabic: item[`text_${typeName}`],
          translation: translations[i].text,
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter
        })
        continue;
      }
      data.push({
        surah,
        ayat: [{
          ayah, arabic: item[`text_${typeName}`],
          translation: translations[i].text,
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter
        }]
      })
    }
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
});

app.get("/api/translations", async (req, res) => {
  try {
    const data = [];
    const response = await axios.get("https://api.quran.com/api/v4/resources/translations");
    for (const translation of response.data.translations) {
      const existingTranslation = data.find(x => x.language == translation.language_name);
      if (existingTranslation) {
        existingTranslation.translations.push({ id: translation.id, name: translation.name, author: translation.author_name })
        continue;
      }
      data.push({
        language: translation.language_name,
        translations: [{ id: translation.id, name: translation.name, author: translation.author_name }]
      })
    }
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/chapters", async (req, res) => {
  try {
    const { language } = req.params
    const response = await axios.get(`https://api.quran.com/api/v4/chapters?language=${language ?? "ar"}`)
    const chapters = []
    for (const item of response.data.chapters) {
      chapters.push({
        name_arabic: item.name_arabic,
        name_translate: item.translated_name.name,
        place: item.revelation_place,
        ayat: item.verses_count,
        start_page: item.pages[0],
        end_page: item.pages[item.pages.length - 1]
      });
    }
    res.json({ chapters });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`))

// db.sequelize
//   .sync()
//   .then(() => {
//     app.listen(PORT, () =>
//       console.log(`Server is running on http://localhost:${PORT}`)
//     );
//   })
//   .catch((error) => console.error('Unable to connect to the database:', error));
