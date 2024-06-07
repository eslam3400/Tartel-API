const OneSignal = require('@onesignal/node-onesignal');

const configuration = OneSignal.createConfiguration({
  restApiKey: "MzJlZGE3NTAtYWU1Yy00NzYwLTgxYjktOTE4NjM2Y2ZkY2Qy",
  userAuthKey: "N2M5NmE4ZDctZGI2OS00NWM1LWE5MTQtOTdjNThkNGU5MTQy",
});
const client = new OneSignal.DefaultApi(configuration);

(async () => {
  const apps = await client.getApps()
  console.log(apps);
  client.createNotification({
    app_id: "ec7d5320-1172-4f79-858c-9b163fc640df",
    include_subscription_ids: ["<subscription_id>"]
  })
})()