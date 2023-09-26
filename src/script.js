const { Pool } = require('pg');
const fs = require('fs');

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tarteel',
  password: 'Eslam@3400',
  port: 5432, // Change the port if necessary
});

const tableName = 'quran';

pool.query(`SELECT * FROM ${tableName}`, (error, result) => {
  if (error) {
    console.error('Error executing query', error);
    pool.end(); // Close the pool
    return;
  }

  const data = result.rows.filter(x => x.ayah != 0).sort((a, b) => {
    if (a.surah !== b.surah) {
      return a.surah - b.surah;
    } else {
      return a.ayah - b.ayah;
    }
  });
  const jsonData = JSON.stringify(data, null, 2);

  // Save the JSON data to a file
  fs.writeFile('quran.json', jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to file', err);
    } else {
      console.log('Data written to output.json');
    }

    // Close the pool after saving the data to a file
    pool.end();
  });
});
