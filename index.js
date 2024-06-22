const { Telegraf } = require('telegraf')

// redis connection
const redis = require("redis")
const client = redis.createClient();
client.connect();

const bot = new Telegraf("7281236571:AAEwm5RnmL5b6G6N9qW00zQwW5aPQgZnPkk")


// bot.start((ctx) => ctx.reply('Welcome'))

bot.on('new_chat_members', (ctx) => {
    ctx.reply(`${ctx.message.new_chat_member.first_name} عزیز. \n به گروه ما خوش اومدی!`)
});

bot.on('left_chat_member', (ctx) => {
    ctx.reply(`${ctx.message.left_chat_member.first_name} از گروه لفت داد!⛔`)
});

// delete forbidden words
const forbiddenWords = ["بی ادب", "بی تریبت"]
bot.on("text", async (ctx) => {
    const message = ctx.message.text
    const chatId = ctx.message.from.id
    const groupId = ctx.chat.id

    const untilDate = Math.floor(Date.now() / 1000) + 1800

    if(ctx.message.reply_to_message){
        // get role 
        const chatMemberRole = await ctx.telegram.getChatMember(groupId, chatId)

        if(chatMemberRole.status == "creator" || chatMemberRole.status == "adminstrator"){
            const userId = ctx.message.reply_to_message.from.id
            if(message == "/ban") {
                    ctx.restrictChatMember(userId, {
                    until_date: untilDate,
                    can_send_messages: false
                })
                ctx.reply(`کاربر ${ctx.message.reply_to_message.from.first_name} با موفقیت بن شد`)
            }
            else if(message == "/unban"){
                ctx.restrictChatMember(userId, {
                    can_send_messages: true
                })
                ctx.reply(`کاربر ${ctx.message.reply_to_message.from.first_name} با موفقیت آزاد شد`)
            }
        }
    }

    if(forbiddenWords.some(word => message.includes(word))){
        // set and check forbidden keys
        await client.incr(`user:${chatId}:forbiddenWord`)
        const countForbidden = await client.get(`user:${chatId}:forbiddenWord`)

        if(countForbidden >= 500) {
            ctx.banChatMember(chatId)
        } else {
            ctx.deleteMessage();
            ctx.reply("پیام شما حاوی کلمات نامناسب بود و حذف شد!")
        }
    } 
}) 

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))