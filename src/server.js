require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const util = require('util');
const db = require('./data');
const authRoutes = require('./routes/auth.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const tasksRoutes = require('./routes/tasks.routes');
const userActivityRoutes = require('./routes/user-activity.routes');
const achievementRoutes = require('./routes/achievement.routes');
const readFileAsync = util.promisify(fs.readFile);
const multer = require('multer');

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/user-activities', userActivityRoutes);
app.use('/api/achievements', upload.single('image'), achievementRoutes);

app.get("/api/ayat", async (req, res) => {
  try {
    let { translation, type } = req.query;
    translation = translation ?? 131;
    const data = []
    const typeName = type == null || type == 1 ? "uthmani" : "indopak";
    const [response, translationResponse, quran, translationsResponse] = await Promise.all([
      axios.get(`https://api.quran.com/api/v4/quran/verses/${typeName}`),
      axios.get(`https://api.quran.com/api/v4/quran/translations/${translation}`),
      readFileAsync('quran.json', 'utf8'),
      axios.get("https://api.quran.com/api/v4/resources/translations")
    ]);
    const quranData = JSON.parse(quran);
    const { translations } = translationResponse.data
    const translationsList = translationsResponse.data.translations
    for (let i = 0; i < response.data.verses.length; i++) {
      const item = response.data.verses[i];
      const surah = item.verse_key.split(":")[0];
      const ayah = item.verse_key.split(":")[1];
      const existingSurah = data.find(x => x.surah === surah)
      if (existingSurah) {
        existingSurah.ayat.push({
          surah,
          surah_name: quranData[i].surrahname_no_diacratic.split(" ")[1],
          ayah,
          arabic: item[`text_${typeName}`],
          arabic_words: item[`text_${typeName}`].split(" "),
          translation: translations[i].text.replace(/<sup(\s+foot_note=\d+)?>.*?<\/sup>/g, ''),
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter,
          translator: translationsList.find(x => x.id == translation).name
        })
        continue;
      }
      data.push({
        surah,
        surah_name: quranData[i].surrahname,
        translation_id: translation,
        ayat: [{
          surah,
          surah_name: quranData[i].surrahname_no_diacratic.split(" ")[1],
          ayah,
          arabic: item[`text_${typeName}`],
          arabic_words: item[`text_${typeName}`].split(" "),
          translation: translations[i].text.replace(/<sup(\s+foot_note=\d+)?>.*?<\/sup>/g, ''),
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter,
          translator: translationsList.find(x => x.id == translation).name
        }]
      })
    }
    res.json({ translation_id: translation, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
});

app.get("/api/page-ayat", async (req, res) => {
  try {
    let { translation, type } = req.query;
    translation = translation ?? 131;
    const data = []
    const typeName = type == null || type == 1 ? "uthmani" : "indopak";
    const [response, translationResponse, quran, translationsResponse] = await Promise.all([
      axios.get(`https://api.quran.com/api/v4/quran/verses/${typeName}`),
      axios.get(`https://api.quran.com/api/v4/quran/translations/${translation}`),
      readFileAsync('quran.json', 'utf8'),
      axios.get("https://api.quran.com/api/v4/resources/translations")
    ]);
    const quranData = JSON.parse(quran);
    const { translations } = translationResponse.data
    const translationsList = translationsResponse.data.translations
    for (let i = 0; i < response.data.verses.length; i++) {
      const item = response.data.verses[i];
      const surah = item.verse_key.split(":")[0];
      const ayah = item.verse_key.split(":")[1];
      const page = quranData.find(x => x.surah == surah && x.ayah == ayah).page
      const existingPage = data.find(x => x.page === page)
      if (existingPage) {
        existingPage.ayat.push({
          surah,
          surah_name: quranData[i].surrahname_no_diacratic.split(" ")[1],
          ayah,
          arabic: item[`text_${typeName}`],
          arabic_words: item[`text_${typeName}`].split(" "),
          translation: translations[i].text.replace(/<sup(\s+foot_note=\d+)?>.*?<\/sup>/g, ''),
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter,
          translator: translationsList.find(x => x.id == translation).name
        })
        continue;
      }
      data.push({
        surah,
        surah_name: quranData[i].surrahname,
        translation_id: translation,
        page,
        ayat: [{
          surah,
          surah_name: quranData[i].surrahname_no_diacratic.split(" ")[1],
          ayah,
          arabic: item[`text_${typeName}`],
          arabic_words: item[`text_${typeName}`].split(" "),
          translation: translations[i].text.replace(/<sup(\s+foot_note=\d+)?>.*?<\/sup>/g, ''),
          page: quranData[i].page,
          hizb: quranData[i].hizb,
          chapter: quranData[i].chapter,
          translator: translationsList.find(x => x.id == translation).name
        }]
      })
    }
    res.json({ translation_id: translation, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
});

app.get("/api/translations", async (req, res) => {
  try {
    const data = [];
    const response = await axios.get("https://api.quran.com/api/v4/resources/translations");
    let counter = 1;
    for (const translation of response.data.translations) {
      const existingTranslation = data.find(x => x.language == translation.language_name);
      if (existingTranslation) {
        existingTranslation.translations.push({
          id: translation.id,
          name: translation.name,
          author: translation.author_name,
          language: translation.language_name,
        })
        continue;
      }
      data.push({
        id: counter++,
        language: translation.language_name,
        translations: [{
          id: translation.id,
          name: translation.name,
          author: translation.author_name,
          language: translation.language_name,
        }]
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
      let name_arabic = quranData.find(x => x.surah == item.id).surrahname.split(' ');
      let name_no_diacratic = quranData.find(x => x.surah == item.id).surrahname_no_diacratic.split(' ');
      name_arabic.shift();
      name_no_diacratic.shift();
      name_arabic = name_arabic.join(" ");
      name_no_diacratic = name_no_diacratic.join(" ");
      data.surahs.push({
        name_arabic,
        name_no_diacratic,
        name_translate: item.translated_name.name.split(' ')[1],
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
    const { id } = req.params;
    const requests = [];
    for (let i = 1; i <= 114; i++) {
      requests.push(axios.get(`http://api.quran-tafseer.com/tafseer/${id}/${i}/1/1000`))
    }
    const quran = await readFileAsync('quran.json', 'utf8');
    const quranData = JSON.parse(quran);
    const responses = await Promise.all(requests);
    const data = [];
    let counter = 1;
    for (const response of responses) {
      const ayat = quranData.filter(x => x.surah == counter);
      counter++;
      data.push(...response.data.map(x => ({
        ...x,
        sura: +x.ayah_url.split('/')[2],
        sura_name: ayat[0].surrahname_no_diacratic,
        ayah: ayat.find(y => y.ayah == x.ayah_number).ayah_text
      })))
    }
    res.json({ tafseer_id: id, data })
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/telawat", async (req, res) => {
  try {
    const response = await axios.get(`https://api.quran.com/api/v4/resources/recitations?language=ar`)
    const data = response.data.recitations
    res.json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/telawat/:id", async (req, res) => {
  try {
    const { id } = req.params
    const response = await axios.get(`https://api.quran.com/api/v4/chapter_recitations/${id}`)
    const data = response.data.audio_files
    res.json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

app.get("/api/telawat-ayat/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { page, surah, juz, from_ayah, to_ayah, from_surah, to_surah } = req.query;
    const requests = [];
    if (surah) {
      requests.push(axios.get(`https://api.quran.com/api/v4/recitations/${id}/by_chapter/${surah}?per_page=1000`))
    } else {
      for (let i = 1; i <= 114; i++) {
        requests.push(axios.get(`https://api.quran.com/api/v4/recitations/${id}/by_chapter/${i}?per_page=1000`))
      }
    }
    const quran = await readFileAsync('quran.json', 'utf8');
    const quranData = JSON.parse(quran);
    const responses = await Promise.all(requests);
    let data = [];
    for (const response of responses) {
      let filteredData;
      const { audio_files } = response.data;
      const mapping = x => {
        const surah = +x.verse_key.split(":")[0];
        const ayah = +x.verse_key.split(":")[1];
        const ayahDetails = quranData.find(x => x.ayah == ayah && x.surah == surah);
        return {
          url: `https://verses.quran.com/${x.url}`,
          surah,
          ayah,
          page: ayahDetails.page,
          chapter: ayahDetails.chapter,
          surah_name: ayahDetails.surrahname_no_diacratic,
        }
      }
      if (juz) {
        filteredData = audio_files.map(mapping).filter(x => x.chapter == juz)
      } else if (page) {
        filteredData = audio_files.map(mapping).filter(x => x.page == page)
      } else if (from_ayah && to_ayah && from_surah && to_surah) {
        filteredData = audio_files
          .map(mapping)
          .filter(x => x.surah >= from_surah && x.surah <= to_surah)
      } else {
        filteredData = audio_files.map(mapping)
      }
      data.push(...filteredData);
    }
    if (from_ayah && to_ayah && from_surah && to_surah) {
      data = data.slice(from_ayah - 1)
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        if (element.ayah == to_ayah && element.surah == to_surah) {
          data = data.slice(0, i + 1);
        }
      }
    }
    res.json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 80;

db.sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server is running on http://localhost:${PORT}`)
    );
  })
  .catch((error) => console.error('Unable to connect to the database:', error));
