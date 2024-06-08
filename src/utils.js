const OneSignal = require('@onesignal/node-onesignal');

function getLastFourMonths() {
  const currentDate = new Date();
  const months = [];

  for (let i = 0; i < 4; i++) {
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(currentDate.getMonth() - i);
    months.push(previousMonth);
  }

  return months;
}

function getArabicMonthName(month) {
  const arabicMonthNames = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  return arabicMonthNames[month.getMonth()];
}

function sendNotification({title, message, userToken}) {
  const configuration = OneSignal.createConfiguration({
    restApiKey: process.env.ONESIGNAL_API_KEY,
    userAuthKey: process.env.ONESIGNAL_AUTH_KEY,
  });
  const client = new OneSignal.DefaultApi(configuration);
  return client.createNotification({
    app_id: process.env.ONESIGNAL_APP_ID,
    include_external_user_ids: [userToken],
    contents: { en: message },
    headings: { en: title },
  });
}

module.exports = { getLastFourMonths, getArabicMonthName, sendNotification }