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
          arabic_words: item[`text_${typeName}`].split(" "),
          translation: translations[i].text,
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter
        })
        continue;
      }
      data.push({
        surah,
        surah_name: quranData[i].surrahname,
        ayat: [{
          ayah,
          arabic: item[`text_${typeName}`],
          arabic_words: item[`text_${typeName}`].split(" "),
          translation: translations[i].text,
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter
        }]
      })
    }
    res.json({ data });
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
    res.json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/chapters", async (req, res) => {
  try {
    const { language } = req.params
    const [chapterResponse, quran] = await Promise.all([
      axios.get(`https://api.quran.com/api/v4/chapters?language=${language ?? "ar"}`),
      readFileAsync('quran.json', 'utf8')
    ])
    const quranData = JSON.parse(quran);
    const data = {
      surahs: [],
      juzs: [],
      hizbs: []
    }
    for (const item of chapterResponse.data.chapters) {
      data.surahs.push({
        name_arabic: quranData.find(x => x.surah == item.id).surrahname,
        name_translate: item.translated_name.name,
        place: item.revelation_place,
        ayat: item.verses_count,
        start_page: item.pages[0],
        end_page: item.pages[item.pages.length - 1]
      });
    }
    for (const item of quranData) {
      const existingItem = data.juzs.find(x => x.number == item.chapter)
      if (existingItem) continue;
      data.juzs.push({
        number: item.chapter,
        ayah: item.ayah_text.split(" ").slice(0, 4).join(" ").replace("۞", ""),
        surah: item.surrahname_no_diacratic.split(" ")[1],
        start: item.ayah,
        page: item.page
      });
    }
    for (const item of quranData) {
      const existingItem = data.hizbs.find(x => x.number == item.hizb)
      if (existingItem || item.hizb % 1 != .25) continue;
      data.hizbs.push({
        number: item.hizb,
        ayah: item.ayah_text.split(" ").slice(0, 4).join(" ").replace("۞", ""),
        surah: item.surrahname_no_diacratic.split(" ")[1],
        start: item.ayah,
        page: item.page
      });
    }
    data.hizbs.forEach((item, index) => item.number = index + 1)
    res.json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/tafseers", async (req, res) => {
  try {
    const response = await axios.get(`http://api.quran-tafseer.com/tafseer/`)
    const data = response.data
    res.json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/tafseers/:id", async (req, res) => {
  try {
    x``
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 80;

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`))

// db.sequelize
//   .sync()
//   .then(() => {
//     app.listen(PORT, () =>
//       console.log(`Server is running on http://localhost:${PORT}`)
//     );
//   })
//   .catch((error) => console.error('Unable to connect to the database:', error));
