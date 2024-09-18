const { exec } = require('child_process');
const cron = require('node-cron');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');

const backupsFolder = path.join(__dirname, '../../db-backups');
const serviceAccount = require('../../firestore-key.json');
const bucketName = 'db.taahad';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName,
});

const bucket = admin.storage().bucket();
const storage = new Storage({ keyFile: serviceAccount });

async function ensureBucketExists() {
  const [exists] = await storage.bucket(bucketName).exists();
  if (!exists) {
    await storage.createBucket(bucketName);
    console.log(`Bucket ${bucketName} created.`);
  } else {
    console.log(`Bucket ${bucketName} already exists.`);
  }
}

async function ensureBackupsFolderExists() {
  if (!fs.existsSync(backupsFolder)) {
    fs.mkdirSync(backupsFolder);
  }
}

async function uploadBackup() {
  const backupFileName = `backup_${new Date().toISOString().split('T')[0]}.dump`;
  const filePath = `${backupsFolder}/${backupFileName}`;
  try {
    await ensureBucketExists();
    await bucket.upload(filePath, {
      destination: backupFileName,
      metadata: {
        contentType: 'application/sql',
      },
    });
  } catch (error) {
    console.error('Error uploading backup:', error);
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
    uploadBackup()
      .then(() => console.log('Backup uploaded to Firebase Storage'))
      .catch(console.error);
  });
}

createBackup();

// Schedule the backup to run every day at 1 AM
// cron.schedule('0 1 * * *', createBackup);

// console.log('Backup script scheduled to run every day at 1 AM');