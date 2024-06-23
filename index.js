const { Telegraf } = require('telegraf')

// redis connection
const redis = require("redis")
const client = redis.createClient();
client.connect();

const bot = new Telegraf("7281236571:AAEwm5RnmL5b6G6N9qW00zQwW5aPQgZnPkk")


// bot.start((ctx) => ctx.reply('Welcome'))

bot.on('new_chat_members', async (ctx) => {
    ctx.reply(`${ctx.message.new_chat_member.first_name} عزیز. \n به گروه ما خوش اومدی!`)

    // check invite
    const newMembers = ctx.message.new_chat_members
    const inviterId = ctx.message.from.id

    for(const member of newMembers) {
        await client.incr(`invited:${inviterId}`)
    }
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

    const invitedCount = await client.get(`invited:${chatId}`)
    console.log(invitedCount)
    if(invitedCount > 10) {
        if(ctx.message.reply_to_message){
            // get role 
            const chatMemberRole = await ctx.telegram.getChatMember(groupId, chatId)
    
            if(message.startsWith('/')){
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
                    }else if(message == "/promote"){
                        ctx.promoteChatMember(userId, {
                            can_promote_members: true,
                            can_pin_messages: true,
                            can_change_info: true,
                            can_send_polls: true
                        })
                    } else if(message == "/demote"){
                        ctx.restrictChatMember(userId,{
                            permissions: {
                                can_promote_members: false,
                                can_pin_messages: false,
                                can_change_info: false,
                                can_send_polls: false
                            }
                        })
                    }
                } else {
                    ctx.reply("شما دسترسی این کارو نداری!")
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
    }else {
        ctx.deleteMessage()
        ctx.reply(`کاربر عزیز ${ctx.message.from.first_name} \n شما برای استفاده از این گروه و ارسال پیام باید ابتدا 10 نفر رو به گروه اضافه کنی! \n تعداد نفراتی که تا الان دعوت کردی: ${invitedCount} \n تعداد نفراتی که باید اضافه کنی: ${(10 - invitedCount)}`)
    }

}) 

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))