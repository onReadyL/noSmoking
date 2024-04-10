require("dotenv/config.js");
const { ScanStatus, WechatyBuilder, log } = require("wechaty");
const qrcodeTerminal = require("qrcode-terminal") ;
const express = require('express');

let roomName = "机器人测试群";
const botName = "[Bot]";
let hour = 16;
let minute = 0;
let second = 0;
let noticedNames = ["Monday"];
let timeInterval = 1; // 时间间隔

const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;

let qrcodeImageUrl ='';
/** 计算当前时间与规定时间的间隔 */
const calTimeInterval = (h, m, s) => {
  const nowTimes = new Date().getTime();
  let recent = new Date().setHours(h, m, s);
  recent >= nowTimes || (recent += 24 * 3600000);
  return recent - nowTimes;
};

const bot = WechatyBuilder.build({
  name: "no-smoking",
  puppet: "wechaty-puppet-wechat4u",
  puppetOptions: {
    uos: true,
  },
});

function onScan(qrcode, status) {
  log.info("onScan", "%s", ScanStatus[status]);
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    qrcodeImageUrl = [
      "https://wechaty.js.org/qrcode/",
      encodeURIComponent(qrcode),
    ].join(""); // 二维码
    qrcodeTerminal.generate(qrcode, { small: true });
  }
}

async function onLogin(ContactSelf) {
  log.info('onLogin', ContactSelf);
}

async function onMessage(msg) {
  log.info("onMessage", "%s",msg);
}

function onLogout() {
  log.info("onLogout");
}

const begin = async () => {
  const room = await bot.Room.find({ topic: roomName });
  const memberss = await room.memberAll();
  const someBody = memberss.filter((member) => {
    return noticedNames.includes(member.name());
  });
  await room.say(`${botName}: 亲，今天你戒烟了吗?`, ...someBody);
};

bot.on("scan", onScan);
bot.on("login", onLogin);
bot.on("message", onMessage);

bot.on("ready", async () => {
  const room = await bot.Room.find({ topic: roomName });
  if (room) {
    setTimeout(async () => {
      await begin();
      setInterval(async () => {
        await begin();
      }, timeInterval * 3600000);
    }, calTimeInterval(hour, minute, second));
  }
});

bot.on("room-invite", async (roomInvitation) => {
  const topic = await roomInvitation.topic();
  if (topic === roomName) {
    await roomInvitation.accept();
    setTimeout(async () => {
      await begin();
      setInterval(async () => {
        await begin();
      }, timeInterval * 3600000);
    }, calTimeInterval(hour, minute, second));
  }
});

bot.on("room-topic", async () => {
  //  roomName = await roomInterface.topic();
});

bot.on("logout", onLogout);

bot
  .start()
  .then(() => log.info("[机器人]", "启动成功"))
  .catch((e) => log.error("[机器人]", e));

const app = express();
const port = 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET, PUT, GET, POST, DELETE, OPTIONS');
  // 此处根据前端请求携带的请求头进行配置 
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
  next();
});
app.get('/', (req, res) => {
  res.send(qrcodeImageUrl)
});

app.listen(port, function () {
  console.log(`localhost:${port}`);
});
