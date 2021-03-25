const Discord = require('discord.js');
const client = new Discord.Client();
const weather = require('weather-js');
const fetch = require('node-fetch');
const math = require('mathjs');
const ytdl = require('ytdl-core');
const FFmpeg = require('ffmpeg');
const { config, title, disconnect } = require('process');
const queue = new Map();
const default_prefix = '!'
const db = require('quick.db')
const redditImageFetcher = require('reddit-image-fetcher');
const currency = require('./currency.json');
const { time } = require('console');
const minedrecently = new Set();
const ytsr = require('ytsr')
const ytpl = require('ytpl');

client.once('ready', () => {
	console.log('Ready!');
});

client.login('Nzc3NzQxMDg5NjQxNDYzODEx.X7H11Q.ckRsKGFPYcZ8GH36g9SH8TFmx3w');

client.on('ready', () => {
  client.user.setActivity('the stars', { type: "WATCHING" });
})

function play(guild, song) {
  const serverQueue = queue.get(guild.id)

  if(!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }

  const dispatcher = serverQueue.connection.play(ytdl(song.url, {
		filter: "audioonly",
		highWaterMark: 1024 * 1024
	}))
      .on('finish', () => {
        if(!serverQueue.loop) serverQueue.songs.shift()
        play(guild, serverQueue.songs[0])
      })
      .on('error', error => {
        console.log(error)
      })
      dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)

      const queueembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`**Started Playing**: ${serverQueue.songs[0].title}`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setThumbnail(serverQueue.songs[0].thumbnail)
      if(serverQueue.songs[1]) queueembed.setDescription(`**Started Playing**: ${serverQueue.songs[0].title} \n \n **Next song**: ${serverQueue.songs[1].title}`)
      serverQueue.textChannel.send(queueembed)
}

async function getcoin(userId) {
  let coins = await db.get(`coins_${userId}`)
  if(coins === null) db.set(`coins_${userId}`, '0')
  if(coins === null) return '0'
  return coins
}

async function addcoin(userId, amount) {
  let coins = await getcoin(userId)
  let coin = parseInt(coins, 10);
  let total = amount + coin
  db.set(`coins_${userId}`, total)
}

async function getgalaxy(userId) {
  let gal = await db.get(`galaxy_${userId}`)
  if(gal === null) db.set(`galaxy_${userId}`, '0')
  if(gal === null) return '0'
  return gal
}

client.on('messageDelete', async (msg) => {
  if(msg.channel.name === undefined) return
  const channel = await db.get(`logchannel_${msg.guild.id}`)
  if(channel === null) return
  if(msg.author.bot) return
  const loggingembed = new Discord.MessageEmbed()
    .setAuthor(`${msg.author.username}#${msg.author.discriminator} - Deleted message`, msg.author.avatarURL())
    .setDescription(`<@${msg.author.id}>: ${msg.content}`)
    .addField('Channel', `<#${msg.channel.id}>`)
    .setFooter(`Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
    .setColor(0xae0028)
  client.channels.cache.get(channel).send(loggingembed);
})

client.on('messageUpdate', async (msg) => {
  if(msg.channel.name === undefined) return
  const channel = await db.get(`logchannel_${msg.guild.id}`)
  if(channel === null) return
  if(msg.author.bot) return
  const loggingembed = new Discord.MessageEmbed()
    .setAuthor(`${msg.author.username}#${msg.author.discriminator} - Edited message`, msg.author.avatarURL())
    .setDescription(`<@${msg.author.id}>: ${msg.content}`)
    .addField('Channel', `<#${msg.channel.id}>`, true)
    .addField('Edited Message:',`[Click here to see the new message](${msg.url})`, true)
    .setFooter(`Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
    .setColor(0xf4a261)
  client.channels.cache.get(channel).send(loggingembed);
})

client.on('guildMemberAdd', async (member) => {
  const channel = await db.get(`logchannel_${member.guild.id}`)
  if(channel === null) return
  const loggingembed = new Discord.MessageEmbed()
    .setAuthor(`${member.user.username}#${member.user.discriminator} - Joined Guild`, member.user.avatarURL())
    .setDescription(`<@${member.id}> has joined the Guild`)
    .addField('Total Users', member.guild.memberCount, true)
    .addField('Account Creation',member.user.createdAt, true)
    .setFooter(`Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
    .setColor(0x00AE86)
  client.channels.cache.get(channel).send(loggingembed);
})

client.on('guildMemberRemove', async (member) => {
  const channel = await db.get(`logchannel_${member.guild.id}`)
  if(channel === null) return
  const loggingembed = new Discord.MessageEmbed()
    .setAuthor(`${member.user.username}#${member.user.discriminator} - Left Guild`, member.user.avatarURL())
    .setDescription(`<@${member.id}> has left the Guild`)
    .addField('Total Users', member.guild.memberCount, true)
    .setFooter(`Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
    .setColor(0xae0028)
  client.channels.cache.get(channel).send(loggingembed);
})

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const channel = await db.get(`logchannel_${newMember.guild.id}`)
  if(channel === null) return
  if(newMember.displayName === oldMember.displayName) return
  const loggingembed = new Discord.MessageEmbed()
    .setAuthor(`${newMember.user.username}#${newMember.user.discriminator} - Changed Nickname`, newMember.user.avatarURL()) 
    .setDescription(`<@${newMember.id}> has changed their nickname`)
    .addField('Old Nickname', oldMember.displayName, true)
    .addField('New Nickname', newMember.displayName, true)
    .setFooter(`Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
    .setColor(0xa8dadc)
  client.channels.cache.get(channel).send(loggingembed);
})

client.on('guildBanAdd', async (guild, user) => {
  const channel = await db.get(`logchannel_${guild.id}`)
  if(channel === null) return
  const loggingembed = new Discord.MessageEmbed()
    .setAuthor(`${user.username}#${user.discriminator} - Banned`, user.avatarURL()) 
    .setDescription(`${user.username}#${user.discriminator} was banned from ${guild.name}`)
    .setFooter(`Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
    .setColor(0xae0028)
  client.channels.cache.get(channel).send(loggingembed);
})

client.on('guildBanRemove', async (guild, user) => {
  const channel = await db.get(`logchannel_${guild.id}`)
  if(channel === null) return
  const loggingembed = new Discord.MessageEmbed()
    .setAuthor(`${user.username}#${user.discriminator} - Unbanned`, user.avatarURL()) 
    .setDescription(`${user.username}#${user.discriminator} was unbanned from ${guild.name}`)
    .setFooter(`Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
    .setColor(0x00AE86)
  client.channels.cache.get(channel).send(loggingembed);
})

client.on(`voiceStateUpdate`, async (oldVoiceState, newVoiceState) => {
  try{
    var voiceGuild = oldVoiceState.guild
  } catch {
    var voiceGuild = newVoiceState.guild
  }
  const serverQueue = queue.get(voiceGuild.id)

  if(oldVoiceState.id === '777741089641463811') {
    if(newVoiceState.channel === undefined) {
      if(!serverQueue) return
      serverQueue.songs = []
      serverQueue.connection.dispatcher.end()
      return
    }
    return
  }

  if(!voiceGuild.voice || !voiceGuild.voice.connection) return

  if(voiceGuild.voice.connection.channel.members.size == 1) {
    serverQueue.songs = []
    serverQueue.connection.dispatcher.end()
  }
})

client.on('message', async (msg) => {
    if(msg.mentions.users.has('777741089641463811')) {
      let prefix = await db.get(`prefix_${msg.guild.id}`);
      if(prefix === null) prefix = default_prefix;
        msg.channel.send(`Hi, I'm Nebula, and my prefix is ${prefix}. Use ${prefix}help for more help!`)
    }
})

client.on('message', async (msg) => {
  const args = msg.content.slice(1).trim().split(/ +/g); 
  const command = args.shift().toLowerCase();
  if(msg.channel.name == undefined) {
    if(msg.author.id === '467041336571461655') {
        if(command === 'servers') {
          client.guilds.cache.forEach(guild => {
            const embed = new Discord.MessageEmbed()
              .setTitle(guild.name)
              .addField('Members', guild.memberCount, true)
              .addField('Owner', `${guild.owner.user.username}#${guild.owner.user.discriminator}`, true)
              .setThumbnail(guild.iconURL())
              .setColor(0x00AE86)
            msg.channel.send(embed)
          })
      }
      return
    }
      if(msg.author.id === '777741089641463811') {
        return
      }
      else {
        const img = msg.attachments.first() ? msg.attachments.first().proxyURL : null
        const embed = new Discord.MessageEmbed()
          .setAuthor(`${msg.author.username}#${msg.author.discriminator}`, msg.author.displayAvatarURL())
          .setDescription(msg)
          .setFooter(`${msg.author.id} | Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
          .setColor(0x00AE86)
        
        if (img) {
          embed.setImage(img)
        }
          
          client.channels.fetch('778028539760083004').then(channel => {
            channel.send(embed);
          });

      }
    }
  else {
    let prefix = await db.get(`prefix_${msg.guild.id}`);
    if(prefix === null) prefix = default_prefix;
    const serverQueue = queue.get(msg.guild.id)
    if(!msg.content.startsWith(prefix)) return

    if (command === 'weather') {

        weather.find({search: args.join(" "), degreeType: 'F'}, function(err, result) {
            if (err) msg.channel.send(err);
    
            if (!args.length === 0) {
                msg.channel.send('**Please enter a valid location.**')
                return; 
            }
            if(!result) return msg.channel.send('Please enter a valid location or try again')
    
            var current = result[0].current; 
            var location = result[0].location; 
    
            const embed = new Discord.MessageEmbed()
                .setDescription(`**${current.skytext}**`) 
                .setAuthor(`Weather for ${current.observationpoint}`)  
                .setColor(0x00AE86) 
                .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
                .addField('Timezone',`UTC${location.timezone}`, true) 
                .addField('Temperature',`${current.temperature} Degrees`, true)
                .addField('Feels Like', `${current.feelslike} Degrees`, true)
                .addField('Winds',current.winddisplay, true)
                .addField('Humidity', `${current.humidity}%`, true)
    
                msg.channel.send({embed});
        });
    }

    if (command === 'forecast') {

        weather.find({search: args.join(" "), degreeType: 'F'}, function(err, result) {
            if (err) msg.channel.send(err);
    
            if (!args.length === 0) {
                msg.channel.send('**Please enter a valid location.**')
                return; 
            }
    
            var current = result[0].current; 
            var location = result[0].location;
            var forecast = result[0].forecast; 
    
            const embed = new Discord.MessageEmbed() 
                .setAuthor(`Forecast for ${current.observationpoint}`)  
                .setColor(0x00AE86) 
                .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
                .addField(`${forecast[1].day}`,`${forecast[1].skytextday} \n ${forecast[1].low}-${forecast[1].high}`, true) 
                .addField(`${forecast[2].day}`,`${forecast[2].skytextday} \n ${forecast[2].low}-${forecast[2].high}`, true) 
                .addField(`${forecast[3].day}`,`${forecast[3].skytextday} \n ${forecast[3].low}-${forecast[3].high}`, true) 
    
                msg.channel.send({embed});
        });
    }

    if (command === 'say') {
        if (!args.length) {
            return msg.channel.send(`You didn't provide any arguments`);
        }
        if(isNaN(args[0].replace('<#','').replace('>',''))) {
          return msg.channel.send('Please specify a Channel to send this message')
        }
        else {
          if (msg.member.hasPermission('ADMINISTRATOR')) {
            const message = args.slice(1).join(' ');
            client.channels.cache.get(args[0].replace('<#','').replace('>','')).send(message)
          }
          else {
            if (msg.author.id === '467041336571461655') {
                const message = args.slice(1).join(' ');
                client.channels.cache.get(args[0].replace('<#','').replace('>','')).send(message)
            }
            else {
                msg.channel.send('You do not have permission to use this command')
            }
           }
        }
    }

    if (command === 'avatar') {
        if (!msg.mentions.users.size) {
            const AvatarEmbed = new Discord.MessageEmbed()
                .setImage(msg.author.displayAvatarURL({ format: "png", dynamic: true }))
                .setTitle('Your avatar')
                .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
                .setColor(0x00AE86)
            return msg.channel.send(AvatarEmbed);
        }
    
        const avatarList = msg.mentions.users.map(user => {
            const AvatarEmbed = new Discord.MessageEmbed()
            .setImage(user.displayAvatarURL({ format: "png", dynamic: true }))
            .setTitle(`${user.username}'s avatar`)
            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            .setColor(0x00AE86)
        return msg.channel.send(AvatarEmbed);
        });
    }

    if (command === 'nebula') {
        const num = Math.floor(Math.random() * 99);
        const body = { a: 1 };
        fetch('https://images-api.nasa.gov/search?q=nebula', (body))
            .then(res => res.json()) // expecting a json response
            .then(data =>{
                const NebulaEmbed = new Discord.MessageEmbed()
                .setImage(data.collection.items[num].links[0].href)
                .setTitle('Nebula')
                .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
                .setColor(0x00AE86)

                msg.channel.send(NebulaEmbed)
            });
    }

    if (command === 'iss') {
        const body = { a: 1 };
        fetch('http://api.open-notify.org/iss-now.json', (body))
            .then(res => res.json()) // expecting a json response
            .then(data =>{
                const IssEmbed = new Discord.MessageEmbed()
                .setImage('https://cdn.vox-cdn.com/thumbor/3H1sk-igAeRU7tmNNCY_fs-WIlM=/0x0:4256x2832/1400x1400/filters:focal(1788x1076:2468x1756):format(jpeg)/cdn.vox-cdn.com/uploads/chorus_image/image/53838901/s135e011814.0.jpg')
                .setTitle('ISS Location')
                .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
                .setColor(0x00AE86)
                .addField('Latitude', data.iss_position.latitude, true)
                .addField('Longitude', data.iss_position.longitude, true)

                msg.channel.send(IssEmbed)
            });
    }
    
    if (command === 'apod') {
        const body = { a: 1 };
        fetch('https://api.nasa.gov/planetary/apod?api_key=DhVYk77Mj8DgiURG3tmVFUXeM7xqfc6bqpC0N7DU', (body))
            .then(res => res.json())
            .then(data =>{
                const ApodEmbed = new Discord.MessageEmbed()
                .setImage(data.hdurl)
                .setTitle('Astronomy Picture of the Day')
                .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
                .setColor(0x00AE86)
                .setDescription(`[Click Here for More Info](https://apod.nasa.gov/)`)

                msg.channel.send(ApodEmbed)
            });
    }

    if (command === 'kick') {
        if (msg.member.hasPermission("KICK_MEMBERS")) {
            const user = msg.mentions.users.first();
            if(user.id === msg.member.id) {
              return msg.channel.send(`You can't kick yourself`)
            }
            if (args.slice(1).join(' ')) {
                if (user) {
                    const member = msg.guild.member(user);
                    if (member) {
                      member
                        .kick({
                          reason: args.slice(1).join(' '),
                        })
                        .then(() => {
                            const kickembed = new Discord.MessageEmbed()
                            .setTitle('User Kicked')
                            .setColor(0x00AE86)
                            .setDescription(`Member Kicked: ${args[0]} \n Reason: ${args.slice(1).join(' ')}`)
                            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            
                            msg.channel.send(kickembed);
                        })
                        .catch(err => {
                          msg.reply('I was unable to kick the user');
                        });
                    } else {
                      msg.reply("That user isn't in this guild!");
                    }
                  } else {
                    msg.reply("You didn't mention the user to kick!");
                  }
            }
            else {
                if (user) {
                    const member = msg.guild.member(user);
                    if (member) {
                      member
                        .kick({
                          reason: `None`,
                        })
                        .then(() => {
                            const kickembed = new Discord.MessageEmbed()
                            .setTitle('User Kicked')
                            .setColor(0x00AE86)
                            .setDescription(`Member Kicked: ${args[0]} \n Reason: None`)
                            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            
                            msg.channel.send(kickembed);
                        })
                        .catch(err => {
                          msg.reply('I was unable to kick the user');
                        });
                    } else {
                      msg.reply("That user isn't in this guild!");
                    }
                  } else {
                    msg.reply("You didn't mention the user to kick!");
                  }
            }
        }
        else {
            return msg.channel.send('You do not have the ability to use this command')
        }

    }

    if (command === 'ban') {
        if (msg.member.hasPermission("BAN_MEMBERS")) {
            const user = msg.mentions.users.first();
            if(user.id === msg.member.id) {
              return msg.channel.send(`You can't ban yourself`)
            }
            if (args.slice(1).join(' ')) {
                if (user) {
                    const member = msg.guild.member(user);
                    if (member) {
                      member
                        .ban({
                          reason: args.slice(1).join(' '),
                        })
                        .then(() => {
                            const kickembed = new Discord.MessageEmbed()
                            .setTitle('User Banned')
                            .setColor(0x00AE86)
                            .setDescription(`Member Banned: ${args[0]} \n Reason: ${args.slice(1).join(' ')}`)
                            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            
                            msg.channel.send(kickembed);
                        })
                        .catch(err => {
                          msg.reply('I was unable to ban the user');
                        });
                    } else {
                      msg.reply("That user isn't in this guild!");
                    }
                  } else {
                    msg.reply("You didn't mention the user to ban!");
                  }
            }
            else {
                if (user) {
                    const member = msg.guild.member(user);
                    if (member) {
                      member
                        .ban({
                          reason: `None`,
                        })
                        .then(() => {
                            const kickembed = new Discord.MessageEmbed()
                            .setTitle('User Banned')
                            .setColor(0x00AE86)
                            .setDescription(`Member Banned: ${args[0]} \n Reason: None`)
                            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            
                            msg.channel.send(kickembed);
                        })
                        .catch(err => {
                          msg.reply('I was unable to ban the user');
                        });
                    } else {
                      msg.reply("That user isn't in this guild!");
                    }
                  } else {
                    msg.reply("You didn't mention the user to ban!");
                  }
            }
        }
        else {
            return msg.channel.send('You do not have the ability to use this command')
        }

    }

    if(command === 'invite') {
        const inviteembed = new Discord.MessageEmbed()
            .setTitle('Nebula Invite Link')
            .setThumbnail('https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            .setColor(0x00AE86)
            .setDescription('[Invite Link](https://discord.com/api/oauth2/authorize?client_id=777741089641463811&permissions=8198&scope=bot)')
        msg.channel.send(inviteembed)
    }

    if(command === 'website') {
      const websiteembed = new Discord.MessageEmbed()
            .setTitle('Nebula Website')
            .setThumbnail('https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            .setColor(0x00AE86)
            .setDescription('[Website](https://nebulabot.github.io/)')
        msg.channel.send(websiteembed)
    }

    if(command === 'dm') {
      if(msg.author.id === '467041336571461655') {
        msg.delete();
        const user = args[0]
        const message = args.slice(1).join(' ')

        client.users.fetch(user)
          .then((user) => {user.send(message);
        
        client.users.fetch(args[0])
          .then((user) => {
            const sentembed = new Discord.MessageEmbed()
              .setAuthor(`Sent message to ${user.username}#${user.discriminator}`, user.displayAvatarURL())
              .setDescription(message)
              .setFooter(`${user.id} | Today at ${new Date().toLocaleDateString("en-US", { dataStyle: "full", timeStyle: "short"})}`)
              .setColor(0xae0028)

          msg.channel.send(sentembed)
          })

        })
      }
    }

    if(command === 'clear') {
      const amount = args.join(" ");
      if(!msg.member.hasPermission("MANAGE_MESSAGES")) return msg.channel.send('Lack of Perms!')
      if(!msg.guild.me.hasPermission("MANAGE_MESSAGES")) return msg.channel.send(`I don't have the perms to do that`)
      if(!amount) return msg.channel.send('Please specify an amount of messages to delete')
      if(amount > 100) return msg.channel.send('Sorry, I can only delete 100 messages at once')
      if(amount < 1) return msg.channel.send(`I can't delete less than one message`)

      await msg.channel.messages.fetch({limit: amount}).then(messages => {
        msg.channel.bulkDelete(messages
      )})

      const deleteembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`I have successfully deleted **${amount}** messages`)
      return msg.reply(deleteembed).then(embed => {
        embed.delete({ timeout: 2000 });
      })

    }

    if(command === 'math') {
      if (!args[0]) return msg.channel.send('Please input a calculation');

      let resp;
      try {
        resp = math.evaluate(args.join(' '));
      } 
      catch (e) {
        return msg.channel.send('Sorry, please input a valid calculation')
      }
      const mathembed = new Discord.MessageEmbed()
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setColor(0x00AE86)
        .setTitle('Calculator')
        .addField('Input', `\`\`\`\n${args.join(' ')}\`\`\``)
        .addField('Output', `\`\`\`\n${resp}\`\`\``)
      msg.channel.send(mathembed)
    }

    if(command === 'play') {
      const voiceChannel = msg.member.voice.channel
      if(!voiceChannel) return msg.channel.send('You need to be in a voice channel!')
      const permissions = voiceChannel.permissionsFor(msg.client.user)
      if(!permissions.has('CONNECT')) return msg.channel.send('I don\'t have permission to join the voice channel')
      if(!permissions.has('SPEAK')) return msg.channel.send('I don\'t have permission to talk in the voice channel')

      const query = args.join(' ')

      try {
          const videos = (await ytpl(query)).items
          var x;

          if(!serverQueue) {
            const queueConstruct = {
              textChannel: msg.channel,
              voiceChannel: voiceChannel,
              connection: null,
              songs: [],
              volume: 5,
              playing: true
            }
            queue.set(msg.guild.id, queueConstruct)
            
            for(x in videos) {
              const video = {
                title: videos[x].title,
                url: videos[x].url,
                thumbnail: videos[x].bestThumbnail.url
              }
              queueConstruct.songs.push(video)
            }

            try {
              var connection = await voiceChannel.join()
              queueConstruct.connection = connection
              play(msg.guild, queueConstruct.songs[0])
            } catch (error) {
                console.log(`There was an error connecting to the voice channel: ${error}`)
                queue.delete(msg.guild.id)
            }
          } else {
              for(x in videos) {
                const video = {
                  title: videos[x].title,
                  url: videos[x].url,
                  thumbnail: videos[x].bestThumbnail.url
                }
                serverQueue.songs.push(video)
              }
              const queueembed = new Discord.MessageEmbed()
                .setColor(0x00AE86)
                .setDescription(`**${videos[0].title}** has been added to the queue`)
                .setThumbnail(videos[0].bestThumbnail.url)
                .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
              msg.channel.send(queueembed)
          }
          return
      } catch{e => console.log(e)}
      try {
        var videoinfo = (await ytdl.getInfo(query)).videoDetails
        var video = {
          url: videoinfo.video_url,
          title: videoinfo.title,
          thumbnail: videoinfo.thumbnail.thumbnails[0].url
        }
      } catch {
        try {
          const res = await ytsr(query, {limit: 5})

          const nores = new Discord.MessageEmbed()
            .setTitle('No Results')
            .setColor(0x00AE86)
          
          if(!res.items) return msg.channel.send(nores)

          const videoinfo = res.items.filter(i => i.type === 'video')[0]
          if(!videoinfo) return msg.channel.send(nores)

          var video = {
            url: videoinfo.url,
            title: videoinfo.title,
            thumbnail: videoinfo.bestThumbnail.url
          }
        } catch (error) {
          const novid = new Discord.MessageEmbed()
            .setTitle('No Results')
            .setColor(0x00AE86)
          return msg.channel.send(novid)
        }
      }

      const song = {
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnail
      }
      if(!serverQueue) {
        const queueConstruct = {
          textChannel: msg.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true
        }
        queue.set(msg.guild.id, queueConstruct)

        queueConstruct.songs.push(song)

        try {
          var connection = await voiceChannel.join()
          queueConstruct.connection = connection
          play(msg.guild, queueConstruct.songs[0])
        } catch (error) {
            console.log(`There was an error connecting to the voice channel: ${error}`)
            queue.delete(msg.guild.id)
        }
      } else {
        serverQueue.songs.push(song)
        const queueembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`**${song.title}** has been added to the queue`)
        .setThumbnail(song.thumbnail)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        return msg.channel.send(queueembed)
      }
      return undefined
    }

    if(command === 'dc') {
      if(!msg.member.voice.channel) return msg.channel.send('You need to be in a voice channel to stop the music')
      if(!serverQueue) return msg.channel.send('There is nothing playing')
      serverQueue.songs = []
      serverQueue.connection.dispatcher.end()
      const dcembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`I have disconnected`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
      msg.channel.send(dcembed)
      return undefined
    }

    if(command === 'skip') {
      if(!msg.member.voice.channel) return msg.channel.send('You need to be in a voice channel to skip')
      if(!serverQueue) return msg.channel.send('There is nothing playing')
      const skipembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`**Skipped**: ${serverQueue.songs[0].title}`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setThumbnail(serverQueue.songs[0].thumbnail)
      msg.channel.send(skipembed)
      serverQueue.connection.dispatcher.end()
      return undefined
    }

    if(command === 'np') {
      if(!serverQueue) return msg.channel.send('There is nothing playing')
      const pauseembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`Now Playing: **${serverQueue.songs[0].title}**`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setThumbnail(serverQueue.songs[0].thumbnail)
      msg.channel.send(pauseembed)
      return undefined
    }

    if(command === 'queue') {
      if(!serverQueue) return msg.channel.send('There is nothing playing')
      var y = serverQueue.songs.length
      var x = 1
      const queueLength = y - x
      var lines = serverQueue.songs.slice(0, 10).map(song => `${song.title}`).join(`\n`).split('\n')
      lines.splice(0,1)
      const songQueue = lines.join('\n \n')
      const queueembed = new Discord.MessageEmbed()
        .setAuthor(`${msg.guild.name} Song Queue`, msg.guild.iconURL())
        .setColor(0x00AE86)
        .setDescription(`**Now Playing** \n ${serverQueue.songs[0].title}`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .addField('Up Next', `${songQueue} \n \n **${queueLength} songs in queue**`)
      msg.channel.send(queueembed)
      return undefined
    }

    if(command === 'pause') {
      if(!msg.member.voice.channel) return msg.channel.send('You need to be in a voice channel to pause')
      if(!serverQueue) return msg.channel.send('There is nothing playing')
      if(!serverQueue.playing) return msg.channel.send('The music is already paused, use !resume to resume')
      serverQueue.playing = false
      serverQueue.connection.dispatcher.pause()
      const pauseembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`**Paused**: ${serverQueue.songs[0].title}`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
      msg.channel.send(pauseembed)
      return undefined
    }

    if(command === 'resume') {
      if(!msg.member.voice.channel) return msg.channel.send('You need to be in a voice channel to resume')
      if(!serverQueue) return msg.channel.send('There is nothing playing')
      if(serverQueue.playing) return msg.channel.send('The song is already playing')
      serverQueue.playing = true
      serverQueue.connection.dispatcher.resume()
      const pauseembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`**Resumed**: ${serverQueue.songs[0].title}`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
      msg.channel.send(pauseembed)
      return undefined
    }

    if(command === 'loop') {
      if(!msg.member.voice.channel) return msg.channel.send('You need to be in a voice channel to loop')
      if(!serverQueue) return msg.channel.send('There is nothing playing')
      
      serverQueue.loop = !serverQueue.loop

      const loopembed = new Discord.MessageEmbed()
        .setColor(0x00AE86)
        .setDescription(`I have ${serverQueue.loop ? `**Enabled**` : `**Disabled**`} loop for: ${serverQueue.songs[0].title}`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
      return msg.channel.send(loopembed)
      }

    if(command === 'prefix') {
      if(!msg.member.hasPermission("MANAGE_GUILD")) return msg.channel.send('You don\'t have permission to use that')
      if(!args[0]) return msg.channel.send('Please provide a new prefix')
      if(args[1]) return msg.channel.send('Please provide a one character prefix')
      if(args[0].length > 1) return msg.channel.send('The prefix can only be 1 character!')

      db.set(`prefix_${msg.guild.id}`, args[0])
      msg.channel.send(`Successfully changed prefix to **${args[0]}**`)
    }

    if(command === 'meme') {
      const memes = await redditImageFetcher.fetch({
        type: 'custom', 
        subreddit: ['memes', 'dankmemes']
      });
      const memeembed = new Discord.MessageEmbed() 
        .setTitle(memes[0].title)
        .setURL(memes[0].postLink)
        .setColor(0x00AE86) 
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setImage(memes[0].image)
      msg.channel.send(memeembed)
    }

    if(command === 'help') {
      if(!args[0]) {
        const helpembed = new Discord.MessageEmbed()
          .setAuthor('Nebula Help Menu', 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .addField('Music', `\`\`\`${prefix}help music\`\`\``, true)
          .addField('Fun', `\`\`\`${prefix}help fun\`\`\``, true)
          .addField('Moderation', `\`\`\`${prefix}help mod\`\`\``, true)
          .addField('Weather', `\`\`\`${prefix}help weather\`\`\``, true)
          .addField('Space', `\`\`\`${prefix}help space\`\`\``, true)
          .addField('Misc', `\`\`\`${prefix}help misc\`\`\``, true)
        
        msg.channel.send(helpembed)
      }
      if(args[0] === 'music') {
        const helpembed = new Discord.MessageEmbed()
          .setAuthor('Nebula Music Commands', 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setDescription(`\`${prefix}play\`: Play a song, or add one to the queue \n \`${prefix}skip\`: Skip a song \n \`${prefix}dc\`: Disconnect from Voice Channel \n \`${prefix}pause\`: Pause the music \n \`${prefix}resume\`: Resume the music \n \`${prefix}np\`: See what is playing \n \`${prefix}queue\`: Check the queue \n \`${prefix}loop\`: Loop the current song \n \`${prefix}musicreset\`: Reset the music (If it isn't working)`)
        msg.channel.send(helpembed)
      }
      if(args[0] === 'fun') {
        const helpembed = new Discord.MessageEmbed()
          .setAuthor('Nebula Fun Commands', 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setDescription(`\`${prefix}meme\`: Get a random meme \n \`${prefix}bal\`: Show your balance of credits with Nebula's currency system \n \`${prefix}mine\`: Mine planets for credits, expand your intergalactic empire`)
        msg.channel.send(helpembed)
      }
      if(args[0] === 'mod') {
        const helpembed = new Discord.MessageEmbed()
          .setAuthor('Nebula Moderator Commands', 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setDescription(`\`${prefix}kick [user] <reason(optional)>\`: Kick a user \n \`${prefix}ban [user] <reason(optional)\`: Ban a user \n \`${prefix}clear\`: Bulk delete messages in a channel (1-100) \n \`${prefix}say [channel] <message>\`: Send a message through the bot in a specified channel \n \`${prefix}log\`: set or manage a logs channel`)
        msg.channel.send(helpembed)
      }
      if(args[0] === 'weather') {
        const helpembed = new Discord.MessageEmbed()
          .setAuthor('Nebula Weather Commands', 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setDescription(`\`${prefix}weather [location]\`: Get the weather of a specified location \n \`${prefix}forecast [location]\`: Get a 3-day forecast of a specified location`)
        msg.channel.send(helpembed)
      }
      if(args[0] === 'space') {
        const helpembed = new Discord.MessageEmbed()
        .setAuthor('Nebula Space Commands', 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setColor(0x00AE86)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setDescription(`\`${prefix}nebula\`: Get a random image of a Nebula \n \`${prefix}iss\`: Get the current location of the ISS \n \`${prefix}apod\`: Get a Nasa's picture of the day`)
      msg.channel.send(helpembed)
      }
      if(args[0] === 'misc') {
        const helpembed = new Discord.MessageEmbed()
          .setAuthor('Nebula Misc Commands', 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setDescription(`\`${prefix}avatar [user(optional)]\`: Get the profile picture of a user, if left empty you get your own \n \`${prefix}invite\`: get the link to invite the bot to your server \n \`${prefix}website\`: Link to Nebula's website (I don't know html, don't judge) \n \`${prefix}math [problem]\`: Calculate an answer for a given problem`)
        msg.channel.send(helpembed)
      }
    }
    if(command === 'musicreset') {
      queue.delete(msg.guild.id)
      msg.channel.send('The music has been reset')
    }
    if(command === 'bal') {
      const user = msg.mentions.users.first() || msg.author
      const coins = await getcoin(user.id)
      const num = await getgalaxy(user.id)
      const balembed = new Discord.MessageEmbed()
        .setAuthor(`${user.username}'s balance`, user.avatarURL())
        .setDescription(`**Credits**: ${new Intl.NumberFormat().format(coins)} \n **Galaxy**: ${currency.galaxy[num].galaxyname}`)
        .setColor(0x00AE86)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
      msg.channel.send(balembed)
    }
    if(command === 'mine') {
      if(minedrecently.has(msg.author.id)) {
        const cooldownembed = new Discord.MessageEmbed()
          .setTitle('Cooldown')
          .setDescription('You can\'t use this command just yet, the cooldown for this command is 45s')
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
        msg.channel.send(cooldownembed)
        return
      }
      const user = msg.author
      const coins = await getcoin(user.id)
      const num = await getgalaxy(user.id)
      const mineembed = new Discord.MessageEmbed()
        .setTitle(`${currency.galaxy[num].galaxyname} Planet Mining`)
        .setDescription(`Which planet do you want to mine? \`${currency.galaxy[num].planets[1]}\`, \`${currency.galaxy[num].planets[0]}\`, or \`${currency.galaxy[num].planets[2]}\``)
        .setColor(0x00AE86)
        .setFooter(`Planet's in Galaxies other than the Milky Way are FAKE`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
      let sent = await msg.channel.send(mineembed)
      try {
        var response = await msg.channel.awaitMessages(message => message.author === msg.author, {
          max: 1,
          time: 10000,
          errors: ['time']
        })
      } catch {
          const minedembed = new Discord.MessageEmbed()
            .setTitle(`${currency.galaxy[num].galaxyname} Planet Mining`)
            .setDescription(`No planet specified, halting mining`)
            .setColor(0x00AE86)
            .setFooter(`Planet's in Galaxies other than the Milky Way are FAKE`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            msg.channel.messages.fetch(sent.id).then(m => m.edit(minedembed))
          return
      }
      if(!currency.galaxy[num].planets.includes(response.first().content)) {
        const minedembed = new Discord.MessageEmbed()
            .setTitle(`${currency.galaxy[num].galaxyname} Planet Mining`)
            .setDescription(`No planet exists, halting mining`)
            .setColor(0x00AE86)
            .setFooter(`Planet's in Galaxies other than the Milky Way are FAKE`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            msg.channel.send(minedembed)
          return
      }
      var x = Math.floor(Math.random() * currency.galaxy[num].mineran);
      var y = currency.galaxy[num].mineval;
      var z = x + y;
      addcoin(user.id, z)
      const capitalize = (s) => {
        if (typeof s !== 'string') return ''
        return s.charAt(0).toUpperCase() + s.slice(1)
      }
      const planet = capitalize(response.first().content)
      const minerembed = new Discord.MessageEmbed()
        .setTitle(`${planet} Mining`)
        .setDescription(`Mined planet ${planet} for valuable assets worth **${new Intl.NumberFormat().format(z)}** credits \n The credits are being transacted into your account as we speak`)        
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setColor(0x00AE86)
      msg.channel.send(minerembed)
      minedrecently.add(msg.author.id);
      setTimeout(() => {
        minedrecently.delete(msg.author.id)
      }, 45000);
    }
    if(command === 'log') {
      if(!msg.member.hasPermission("MANAGE_GUILD")) return msg.channel.send('You don\'t have permission to set/delete a logging channel')
      let channel = await db.get(`logchannel_${msg.guild.id}`)
      if(channel === null) {
        if(!args[0]) return msg.channel.send('Please provide a channel to set for logs')
        if(isNaN(args[0].replace('<#','').replace('>',''))) return msg.channel.send('Please provide a channel to set for logs')
        db.set(`logchannel_${msg.guild.id}`, (args[0].replace('<#','').replace('>','')))
        const logembed = new Discord.MessageEmbed()
          .setTitle(`${msg.guild.name} server logging`)
          .setDescription(`You set ${args[0]} to your logging channel. Make sure I can type there.`)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
        msg.channel.send(logembed)
        return
      }
      const log1embed = new Discord.MessageEmbed()
        .setTitle(`${msg.guild.name} server logging`)
        .setDescription(`Your current logging channel is <#${channel}>.`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setColor(0x00AE86)
        .addField('Delete', 'type \`delete\` to delete this logging channel', true)
        .addField('Edit', 'Enter a new channel to make it the logging channel', true)
        .addField('Nothing', 'don\'t type anything to keep this logging channel', true)
      let sent = await msg.channel.send(log1embed)
      try {
        var response = await msg.channel.awaitMessages(message => message.author === msg.author, {
          max: 1,
          time: 15000,
          errors: ['time']
        })
      } catch {
          const log2embed = new Discord.MessageEmbed()
            .setTitle(`${msg.guild.name} server logging`)
            .setDescription(`Keeping logging channel <#${channel}>`)
            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            .setColor(0x00AE86)
          msg.channel.messages.fetch(sent.id).then(m => m.edit(log2embed))
        return
      }
      if(response.first().content === 'delete') {
        const log3embed = new Discord.MessageEmbed()
            .setTitle(`${msg.guild.name} server logging`)
            .setDescription(`Deleting logging channel <#${channel}>`)
            .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
            .setColor(0x00AE86)
          msg.channel.send(log3embed)
          db.delete(`logchannel_${msg.guild.id}`)
        return
      }
      if(isNaN(response.first().content.replace('<#','').replace('>',''))) {
        const log4embed = new Discord.MessageEmbed()
          .setTitle(`${msg.guild.name} server logging`)
          .setDescription(`Keeping logging channel <#${channel}>`)
          .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
          .setColor(0x00AE86)
        msg.channel.send(log4embed)
        return
      }
      db.set(`logchannel_${msg.guild.id}`, response.first().content.replace('<#','').replace('>',''))
      const log5embed = new Discord.MessageEmbed()
        .setTitle(`${msg.guild.name} server logging`)
        .setDescription(`You set ${response.first().content} to your logging channel`)
        .setFooter(`Nebula Bot`, 'https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .setColor(0x00AE86)
      msg.channel.send(log5embed)
    }

    if(command === 'impersonate') {
      const user = msg.mentions.users.first()
      msg.channel.send('Hello user, impersonate is temporarily removed. Please contact @zephans#0001 if you have any issues :)')
      if(!msg.guild.me.hasPermission("MANAGE_WEBHOOKS")) return msg.channel.send('I don\'t have permission to manage webhooks')
        if(user) {
          try {
            const webs = await msg.channel.fetchWebhooks();
            const web = webs.first();
            if(!web) {msg.channel.createWebhook('Impersonation')}

            const webhooks = await msg.channel.fetchWebhooks();
            const webhook = webhooks.first();

            await webhook.send(args.slice(1).join(' '), {
              username: msg.guild.member(user).displayName,
              avatarURL: user.avatarURL(),
            })
          } catch (error) {
            console.error(error)
          }
        }
        else {
          msg.channel.send('No user mentioned')
        }
        msg.delete();
    }

    if(command === 'bw') {
      if(!args[0]) return msg.channel.send('Specify a player')
      const url = 'https://api.hypixel.net/player?key=220986b8-7656-4d7f-a1d7-dc2ef20ba7a8&name=' + args[0]
      const body = { a: 1 };

        fetch(url, (body))
            .then(res => res.json())
            .then(data =>{
              let image = 'https://visage.surgeplay.com/full/' + data.player.uuid + '.png'

              if(!data.player.stats.Bedwars) return msg.channel.send(`${args[0]} has never played bedwars`)

              const embed = new Discord.MessageEmbed()
                .setTitle(`${data.player.displayname}'s hypixel bedwars stats (${data.player.achievements.bedwars_level}✫)`)
                .setColor(0x00AE86)
                .setThumbnail(image)
                .addField('Games Won', data.player.stats.Bedwars.wins_bedwars || '0', true)
                .addField('Beds Broken', data.player.stats.Bedwars.beds_broken_bedwars || '0', true)
                .addField('Final Kills', data.player.stats.Bedwars.final_kills_bedwars || '0', true)
                .addField('WLR', Math.round(data.player.stats.Bedwars.wins_bedwars / data.player.stats.Bedwars.losses_bedwars * 100) / 100 || '0', true)
                .addField('KDR', Math.round(data.player.stats.Bedwars.kills_bedwars / data.player.stats.Bedwars.deaths_bedwars * 100) / 100 || '0', true)
                .addField('FKDR', Math.round(data.player.stats.Bedwars.final_kills_bedwars/data.player.stats.Bedwars.final_deaths_bedwars * 100) / 100 || '0', true)
                msg.channel.send(embed)
              })
    }

    if(command === 'bs') {
      let totalSeconds = (client.uptime / 1000);
      let days = Math.floor(totalSeconds / 86400);
      totalSeconds %= 86400;
      let hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = Math.floor(totalSeconds % 60);

      const stats = new Discord.MessageEmbed()
        .setTitle('Nebula Stats')
        .setThumbnail('https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .addField('Uptime', `${days}:${hours}:${minutes}:${seconds}`, true)
        .addField('Servers', client.guilds.cache.size, true)
        .addField('Ping', 'pinging...', true)
        .setColor(0x00AE86)
      msg.channel.send(stats).then(m => {
        const ping = m.createdTimestamp - msg.createdTimestamp

        const stat = new Discord.MessageEmbed()
        .setTitle('Nebula Stats')
        .setThumbnail('https://cdn.discordapp.com/avatars/777741089641463811/22528105555c847c2dd1a10194ff37f5.webp?size=256')
        .addField('Uptime', `${days}:${hours}:${minutes}:${seconds}`, true)
        .addField('Servers', client.guilds.cache.size, true)
        .addField('Ping', `${ping}ms`, true)
        .setColor(0x00AE86)
        
        m.edit(stat)

      })
    }
  }
})