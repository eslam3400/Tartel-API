const { exec } = require('child_process');
const cron = require('node-cron');
// const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// // Initialize Firebase Admin SDK
// const serviceAccount = require('./path/to/your/serviceAccountKey.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: 'your-project-id.appspot.com'
// });

// const bucket = admin.storage().bucket();

// async function uploadBackup() {
//   const backupFileName = `backup_${new Date().toISOString().split('T')[0]}.sql`;
//   const filePath = path.join(__dirname, backupFileName);

//   await bucket.upload(filePath, {
//     destination: backupFileName,
//     metadata: {
//       contentType: 'application/sql',
//     },
//   });

//   console.log(`Backup uploaded to Firestore: ${backupFileName}`);
// }

function createBackup() {
  const backupFileName = `backup_${new Date().toISOString().split('T')[0]}.sql`;
  const command = `pg_dump -U postgres -h localhost -p 5432 tartil > ${backupFileName}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating backup: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(`Backup created: ${backupFileName}`);
    // uploadBackup().catch(console.error);
  });
}

createBackup();

// Schedule the backup to run every day at 1 AM
// cron.schedule('0 1 * * *', createBackup);

// console.log('Backup script scheduled to run every day at 1 AM');