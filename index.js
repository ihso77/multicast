const Eris = require('eris');
const { Util } = require('discord.js');
const fs = require('fs');

const Prefix = '+';

// Main token for control panel only (doesn't send messages)
const MainToken = "MTQxMzE5NzU2ODg1NDQ2MjQ5NA.GNt4I_.L5EyK-2Fk426BkIQo5zaDwuR9o3FNaPypBkJPM";

// Load tokens from file or use default list
let TokensList = [];
try {
  const tokensData = fs.readFileSync('tokens.json', 'utf8');
  TokensList = JSON.parse(tokensData);
} catch (error) {
  // If file doesn't exist, create it with empty array
  TokensList = [];
  fs.writeFileSync('tokens.json', JSON.stringify(TokensList, null, 2));
}

const owners = [
  "1142429610882125874",
  "1122453406569734144",
  "819508960587284521"
];

const skipRole1 = ''; // رتبة 1 الي ما توصلها برود
const skipRole2 = ''; // رتبة 2 الي ما توصلها برود

let Bots = [];
let Senders = [];

// Main bot for control panel only
const client = new Eris(MainToken, {
  restMode: true,
  intents: ['guilds', 'directMessages', 'guildMembers', 'guildMessages', 'guildPresences'],
  getAllUsers: true
});

client.on('ready', () => {
  console.log(`\x1b[34m[CONTROL PANEL] ${client.user.username} (${client.user.id})\x1b[0m`);
  console.log('\x1b[36m========================================\x1b[0m');
  console.log('\x1b[36m      🐉 Dragon Broadcast System 🐉      \x1b[0m');
  console.log('\x1b[36m        Auto-Restart: ✅ Enabled        \x1b[0m');
  console.log('\x1b[36m========================================\x1b[0m');
});

// Function to save tokens to file
function saveTokens() {
  fs.writeFileSync('tokens.json', JSON.stringify(TokensList, null, 2));
}

// Function to connect sender bots
async function connectSenderBots() {
  // Disconnect existing bots
  Bots.forEach(bot => {
    if (bot.ws) bot.disconnect();
  });
  Bots = [];

  // Connect new bots
  for (let token of TokensList) {
    if (!token || token.trim() === "") continue;
    try {
      let bot = new Eris(token, {
        restMode: true,
        intents: ['guilds', 'directMessages', 'guildMembers', 'guildMessages']
      });
      
      bot.editStatus('dnd', { name: "Dragon On Top", type: 0, url: "دراقوون" });
      
      bot.on('ready', () => {
        console.log(`\x1b[32m[SENDER ${TokensList.indexOf(token) + 1}] ${bot.user?.username} (${bot.user?.id})\x1b[0m`);
      });
      
      await bot.connect();
      Bots.push(bot);
    } catch (error) {
      console.log(`\x1b[31m[ERROR] Failed to connect token: ${token.substring(0, 20)}...\x1b[0m`);
    }
  }
}

// Initialize sender bots
(async () => {
  await connectSenderBots();
  client.connect();
})();

client.on('messageCreate', async message => {
  if (!message?.channel?.guild) return;
  if (message.author.bot) return;
  if (!owners.includes(message.author.id)) return;

  // Help command
  if (message.content.startsWith(Prefix + 'help')) {
    return client.createMessage(message.channel.id, {
      embed: {
        title: "📋 قائمة الأوامر",
        description: `**إدارة التوكنز:**
        \`${Prefix}add-token <TOKEN>\` - إضافة توكن جديد
        \`${Prefix}remove-token <INDEX>\` - حذف توكن
        \`${Prefix}tokens\` - عرض قائمة التوكنز
        
        **البرودكاست:**
        \`${Prefix}bc <MESSAGE>\` - إرسال رسالة لجميع الأعضاء
        \`${Prefix}obc <MESSAGE>\` - إرسال رسالة لجميع الأعضاء
        
        **النظام:**
        \`${Prefix}restart\` - إعادة تشغيل البوت بالكامل
        \`${Prefix}help\` - عرض هذه القائمة`,
        color: 0x0099ff,
        footer: { text: "Dragon Broadcast System" }
      }
    });
  }

  // Add token command
  if (message.content.startsWith(Prefix + 'add-token')) {
    let args = message.content.split(" ").slice(1);
    if (args.length === 0) {
      return client.createMessage(message.channel.id, {
        embed: {
          title: "❌ خطأ",
          description: "```" + Prefix + "add-token <TOKEN>```",
          color: 0xff0000
        }
      });
    }

    let token = args[0];
    
    // Check if token already exists
    if (TokensList.includes(token)) {
      return client.createMessage(message.channel.id, {
        embed: {
          title: "⚠️ تحذير",
          description: "هذا التوكن موجود بالفعل!",
          color: 0xffaa00
        }
      });
    }

    // Test the token before adding
    try {
      let testBot = new Eris(token);
      await testBot.connect();
      
      TokensList.push(token);
      saveTokens();
      
      client.createMessage(message.channel.id, {
        embed: {
          title: "✅ نجح",
          description: `تم إضافة التوكن بنجاح!\n**اسم البوت:** ${testBot.user.username}\n**العدد الكلي:** ${TokensList.length}`,
          color: 0x00ff00
        }
      });
      
      testBot.disconnect();
      
      // Reconnect all sender bots with new token
      await connectSenderBots();
      
    } catch (error) {
      return client.createMessage(message.channel.id, {
        embed: {
          title: "❌ خطأ",
          description: "التوكن غير صحيح أو منتهي الصلاحية!",
          color: 0xff0000
        }
      });
    }
  }

  // Remove token command
  if (message.content.startsWith(Prefix + 'remove-token')) {
    let args = message.content.split(" ").slice(1);
    if (args.length === 0) {
      return client.createMessage(message.channel.id, {
        embed: {
          title: "❌ خطأ",
          description: "```" + Prefix + "remove-token <INDEX>```\nاستخدم `" + Prefix + "tokens` لعرض قائمة التوكنز",
          color: 0xff0000
        }
      });
    }

    let index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0 || index >= TokensList.length) {
      return client.createMessage(message.channel.id, {
        embed: {
          title: "❌ خطأ",
          description: "رقم التوكن غير صحيح!",
          color: 0xff0000
        }
      });
    }

    TokensList.splice(index, 1);
    saveTokens();
    
    client.createMessage(message.channel.id, {
      embed: {
        title: "✅ نجح",
        description: `تم حذف التوكن بنجاح!\n**العدد الكلي:** ${TokensList.length}`,
        color: 0x00ff00
      }
    });

    // Reconnect sender bots without removed token
    await connectSenderBots();
  }

  // List tokens command
  if (message.content.startsWith(Prefix + 'tokens')) {
    if (TokensList.length === 0) {
      return client.createMessage(message.channel.id, {
        embed: {
          title: "📝 قائمة التوكنز",
          description: "لا توجد توكنز مضافة حالياً",
          color: 0xffaa00
        }
      });
    }

    let tokenList = TokensList.map((token, index) => {
      let bot = Bots[index];
      let status = bot && bot.user ? `✅ ${bot.user.username}` : "❌ غير متصل";
      return `**${index + 1}.** ${token.substring(0, 20)}... - ${status}`;
    }).join('\n');

    client.createMessage(message.channel.id, {
      embed: {
        title: "📝 قائمة التوكنز",
        description: tokenList,
        color: 0x0099ff,
        footer: { text: `العدد الكلي: ${TokensList.length}` }
      }
    });
  }

  // Restart command
  if (message.content.startsWith(Prefix + 'restart')) {
    await client.createMessage(message.channel.id, {
      embed: {
        title: "🔄 إعادة تشغيل",
        description: "جاري إعادة تشغيل النظام بالكامل...\nالرجاء الانتظار...",
        color: 0xffaa00
      }
    });

    console.log(`\x1b[33m[RESTART] Restarting system requested by ${message.author.username} (${message.author.id})\x1b[0m`);

    // Disconnect all bots gracefully
    console.log('\x1b[33m[RESTART] Disconnecting all sender bots...\x1b[0m');
    Bots.forEach((bot, index) => {
      if (bot.ws) {
        console.log(`\x1b[33m[RESTART] Disconnecting bot ${index + 1}...\x1b[0m`);
        bot.disconnect();
      }
    });

    // Clear arrays
    Bots = [];
    Senders = [];

    console.log('\x1b[33m[RESTART] Disconnecting main bot...\x1b[0m');
    client.disconnect();

    // Wait a moment then restart
    setTimeout(() => {
      console.log('\x1b[33m[RESTART] Restarting process...\x1b[0m');
      process.exit(0); // This will cause the process to restart if using PM2 or similar
    }, 2000);
  }

  // Broadcast commands (using sender bots only, not main bot)
  if (message.content.startsWith(Prefix + 'bc') || message.content.startsWith(Prefix + 'obc')) {
    Senders = [];

    if (Bots.length === 0) {
      return client.createMessage(message.channel.id, {
        embed: {
          title: "❌ خطأ",
          description: "لا توجد بوتات متصلة للإرسال!\nاستخدم `" + Prefix + "add-token` لإضافة توكنز",
          color: 0xff0000
        }
      });
    }

    let notInServerBots = Bots.filter(bot => !bot.guilds.get(message.channel.guild.id) && bot.user);
    if (notInServerBots.length > 0) {
      let msg = notInServerBots
        .map(c => `**\`-\` <@${c.user.id}> is not on this server :**\nhttps://discord.com/api/oauth2/authorize?client_id=${c.user.id}&permissions=0&integration_type=0&scope=bot`)
        .join('\n');
      if (msg.length > 2000) {
        Util.splitMessage(msg).forEach(sp => client.createMessage(message.channel.id, sp));
        return;
      }
      return client.createMessage(message.channel.id, msg);
    }

    let args = message.content.split(" ").slice(1).join(' ');
    if (!args) return client.createMessage(message.channel.id, `**اكتب رسالتك...**`);

    let members = await message.channel.guild.fetchMembers();
    members = members.filter(member => !member.bot && !member.roles.includes(skipRole1) && !member.roles.includes(skipRole2));

    const chunkSize = Math.ceil(members.length / Bots.length);
    const ChunkedMembers = [];
    
    for (let i = 0; i < members.length; i += chunkSize) {
      ChunkedMembers.push(members.slice(i, i + chunkSize));
    }

    ChunkedMembers.forEach((chunk, index) => {
      if (Bots[index]) {
        Senders.push({
          client: Bots[index],
          members: chunk,
          sent: 0,
          done: [],
          failed: 0
        });
      }
    });

    await BroadCast(Senders, message, members.length, args, message.channel.guild.id);
  }
});

async function BroadCast(Sender, message, members, args, gid) {
  let failed = [];
  Sender.forEach(async Send => {
    Send.members.forEach(async member => {
      let dm = await Send.client.getDMChannel(member.id).catch(() => null);
      if (!dm) {
        Send.failed += 1;
        failed.push(member);
        return;
      }
      dm.createMessage({ content: `${args}\n<@${member.id}>` }).then(() => Send.sent += 1)
        .catch(() => { Send.failed += 1; failed.push(member); });
    });
  });

  let msg;
  setTimeout(async () => {
    msg = await client.createMessage(message.channel.id, {
      embed: {
        title: "📊 إحصائيات الإرسال",
        description: `${Senders.map(b => `**البوت ${Senders.indexOf(b) + 1}:** ${b.sent}/${b.members.length}`).join('\n')}`,
        color: 0x0099ff
      }
    });
  }, 1000);

  let moved = false;
  let int = setInterval(async () => {
    if (msg) {
      await msg.edit({
        embed: {
          title: "📊 إحصائيات الإرسال",
          description: `${Senders.map(b => `**البوت ${Senders.indexOf(b) + 1}:** ${b.sent}/${b.members.length}`).join('\n')}`,
          color: 0x0099ff
        }
      });
    }
    let i = 0;
    Sender.map(ss => i += (ss.failed + ss.sent));
    if (!moved && members == i) {
      await Move(msg, Sender, gid, failed, int, args, members, message);
      moved = true;
    }
  }, 5000);
}

async function Move(msg, Sender, gid, failds, int, args, members, message, failed = []) {
  let done = [];
  for (let x = 0; x < Sender.length; x++) {
    let Send = Sender[x];
    for (let xx = 0; xx < failds.length; xx++) {
      let member = failds[xx];
      let dm = await Send.client.getDMChannel(member.id).catch(() => null);
      if (!dm) {
        if (!failed.includes(member.id)) failed.push(member.id);
        continue;
      }
      if (!done.includes(member.id)) {
        dm.createMessage(`${args}\n<@${member.id}>`).then(() => {
          done.push(member.id);
          Send.sent += 1;
        }).catch(() => {
          if (!failed.includes(member.id)) failed.push(member.id);
        });
      }
      if (failds.length === done.length || failds.length === failed.length || failds.length === failed.length + done.length) {
        if (msg) {
          await msg.edit({
            embed: {
              title: "✅ تم الانتهاء من الإرسال",
              description: `${Sender.map(b => `**البوت ${Sender.indexOf(b) + 1}:** ${b.sent}/${b.members.length}`).join('\n')}\n\n❌ **فشل:** ${failds.length - done.length}\n✅ **نجح:** ${members - (failds.length - done.length)}`,
              color: 0x00ff00
            }
          });
        }
        clearInterval(int);
      }
    }
  }
}

// Handle Errors
process.on('uncaughtException', e => console.log(e));
process.on('unhandledRejection', e => console.log(e));
