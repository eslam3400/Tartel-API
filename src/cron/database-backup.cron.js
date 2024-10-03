const { exec } = require('child_process');
const cron = require('node-cron');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('../../firestore-key.json');
const backupsFolder = path.join(__dirname, '../../db-backups');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://quran-6b2e3.appspot.com',
});

const bucket = admin.storage().bucket();

async function ensureBackupsFolderExists() {
  if (!fs.existsSync(backupsFolder)) {
    fs.mkdirSync(backupsFolder);
  }
}

async function uploadBackup(backupFileName) {
  const filePath = `${backupsFolder}/${backupFileName}`;

  await bucket.upload(filePath, {
    destination: backupFileName,
    metadata: {
      contentType: 'application/sql',
    },
  });

  // Delete the local backup file after uploading it to Firebase Storage
  fs.unlinkSync(`${backupsFolder}/${backupFileName}`);
}

async function deleteOldBackups() {
  const [files] = await bucket.getFiles();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const fileDate = new Date(metadata.timeCreated);
    if (fileDate < oneWeekAgo) {
      await file.delete();
    }
  }
}

function createBackup() {
  ensureBackupsFolderExists();
  const backupFileName = `backup_${new Date().toISOString().split('T')[0]}.dump`;
  const command = `pg_dump -U postgres -h localhost -p 5432 tartil > ${backupsFolder}/${backupFileName}`;
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
    uploadBackup(backupFileName)
      .then(() => deleteOldBackups())
      .then(() => console.log('Backup uploaded and old backups deleted'))
      .catch(console.error);
  });
}

// Schedule the backup to run every day at 1 AM
cron.schedule('0 1 * * *', createBackup);