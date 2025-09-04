const Eris = require('eris')
const { Util } = require('discord.js')


const Prefix = '22'/// بيرفكس
const MainToken = "MTQxMzE5NzU2ODg1NDQ2MjQ5NA.GCvWKX.HEhhGb9bouKpH3imYsCIuMt8VWkKYCf2OxygwQ"


const owners =
    [
        "1142429610882125874","1122453406569734144"
        

    ]



const TokensList = [
"MTQxMzE5NzU2ODg1NDQ2MjQ5NA.GCvWKX.HEhhGb9bouKpH3imYsCIuMt8VWkKYCf2OxygwQ",
"",
"",


];


const skipRole1 = ''// رتبة 1 الي ما توصلها برود
const skipRole2 = ''// رتبة 2 الي ما توصلها برود
///مش لازم تهط ايديات رتب

let Bots = []
let Senders = []

const client = new Eris(MainToken, { restMode: true, intents: ['guilds', 'directMessages', 'guildMembers', 'guildMessages', 'guildPresences'], getAllUsers: true });
client.on('ready', () => console.log(`\x1b[34m[MAIN BOT] ${client.user.username} (${client.user.id})\x1b[0m`));

(async () => {
    for (let token of TokensList) {
        let bot = new Eris(token, {
            restMode: true,
            intents: ['guilds', 'directMessages', 'guildMembers', 'guildMessages']
        });
        bot.editStatus('dnd', { name: "Dragon On Top", type: 0, url: "دراقوون" })
        bot.on('ready', () => {
            console.log(`\x1b[32m[${TokensList.indexOf(token) + 1}] ${bot.user.username} (${bot.user.id}). ${token} \x1b[0m`)
            //bot.editSelf({username: `${TokensList.indexOf(token) + 1}`})
        });
        await bot.connect();
        Bots.push(bot);
    }
    client.connect();
})()

client.on('messageCreate', async message => {
    if (!message?.channel?.guild) return;
    if (message.author.bot) return;
    if (message.content.startsWith(Prefix + 'bc') || message.content.startsWith(Prefix + 'obc')) {
        Senders = []
        if (!owners.includes(message.author.id)) return;
        let x = Bots.filter(bot => !bot.guilds.get(message.channel.guild.id))
        if (x.length > 0) {
            let msg = Bots.filter(bot => !bot.guilds.get(message.channel.guild.id)).map(c => `**\`-\` <@${c.user.id}> is not on this server :**\nhttps://discord.com/api/oauth2/authorize?client_id=${c.user.id}&permissions=0&integration_type=0&scope=bot`).join('\n')
            if (msg.length > 2000) {
                Util.splitMessage(msg).forEach(sp => {
                    client.createMessage(message.channel.id, sp)
                })
                return;
            }
            return client.createMessage(message.channel.id, msg)
        }
        let args = message.content.split(" ").slice(1).join(' ')
        if (!args) return client.createMessage(message.channel.id, `** Type Your Message ... **`)
        let members = await message.channel.guild.fetchMembers()
        members = members.filter(member => !member.bot && !member.roles.includes(skipRole1) && !member.roles.includes(skipRole2) && message.content.startsWith(Prefix + 'obc') ? (member?.status && member?.status !== 'offline') : true)
        members = members.filter(member => !member.bot && !member.roles.includes(skipRole1) && !member.roles.includes(skipRole2))
        const chunkSize = members.length / TokensList.length;
        const ChunkedMembers = members.reduce((resultArray, item, index) => {
            const chunkIndex = Math.floor(index / chunkSize)
            if (!resultArray[chunkIndex]) {
                resultArray[chunkIndex] = []
            }
            resultArray[chunkIndex].push(item)
            return resultArray
        }, [])
        ChunkedMembers.forEach(chunk => {
            Senders.push({
                client: Bots[ChunkedMembers.indexOf(chunk)],
                members: chunk,
                sent: 0,
                done: [],
                failed: 0
            })
        })
        await BroadCast(Senders, message, members.length, args, message.channel.guild.id)
    }
})

async function BroadCast(Sender, message, members, args, gid) {
    let failed = []
    Sender.forEach(async Send => {
        Send.members.forEach(async member => {
            let dm = await Send.client.getDMChannel(member.id).catch(err => null)
            if (!dm) {
                Send.failed += 1
                failed.push(member)
                return;
            }
            dm.createMessage({ content: `${args}\n<@${member.id}>` }).then(() => {
                Send.sent += 1
            }).catch(async () => {
                Send.failed += 1
                failed.push(member)
            })
        })
    })
    let msg;
    setTimeout(async () => {
        msg = await client.createMessage(message.channel.id, `${Senders.map(b => `${b.sent}/${b.members.length}`).join('\n')}`)
    }, 1000)
    let moved = false
    let int = setInterval(async () => {
        msg.edit(`${Senders.map(b => `${b.sent}/${b.members.length}`).join('\n')}`)
        let i = 0
        Sender.map(ss => i += (ss.failed + ss.sent))
        if (!moved && members == i) {
            await Move(msg, Sender, gid, failed, int, args, members, message)
            moved = true
        }
    }, 5000)
}

async function Move(msg, Sender, gid, failds, int, args, members, message, failed = []) {
    let done = []
    for (let x = 0; x < Sender.length; x++) {
        let Send = Sender[x]
        for (let xx = 0; xx < failds.length; xx++) {
            let member = failds[xx]
            let dm = await Send.client.getDMChannel(member.id).catch(err => null)
            if (!dm) {
                async function func1() {
                    if (failed.includes(member.id)) return;
                    failed.push(member.id)
                }
                await func1()
                return;
            }
            if (!done.includes(member.id)) dm.createMessage(`${args}\n<@${member.id}>`).then(async () => {
                async function func2() {
                    done.push(member.id)
                    Send.sent += 1
                }
                await func2()
            }).catch(async () => {
                async function func3() {
                    if (failed.includes(member.id)) return;
                    failed.push(member.id)
                }
                await func3()
            })
            if (failds.length == done.length || failds.length == failed.length || failds.length == failed.length + done.length) {
                //client.createMessage(msg.channel.id, `-❌\`${failds.length-done.length}\`\n-✅\`${members}\`\n -<@${msg.author.id}>`);
                msg.edit(`${Sender.map(b => `${b.sent}/${b.members.length}`).join('\n')}\n❌${failds.length - done.length}✅${members}`)
                clearInterval(int)
            }
        }
    }
}

/*Handle Errors*/
process.on('uncaughtException', e => console.log(e));
process.on('uncaughtRejection', e => console.log(e));
process.on('unhandledRejection', e => console.log(e));