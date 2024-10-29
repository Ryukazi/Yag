const fs = require("fs-extra");
const path = require("path");
const { utils } = global;
const playSound = require("play-sound")(); // Initialize with default options

module.exports = {
	config: {
		name: "prefix",
		version: "1.5",
		author: "NTKhang, modified by Ryuken",
		countDown: 5,
		role: 0,
		description: "Change the command prefix for your chat or the entire bot system (admin only) and add a music prefix with song link support",
		category: "config",
		guide: {
			// guides here...
		}
	},
	langs: {
		// language definitions here...
	},
	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0]) return message.SyntaxError();

		// Reset prefix
		if (args[0] === 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		// Handle music prefix and link
		if (args[0] === 'music') {
			if (args[1] === 'reset') {
				await threadsData.set(event.threadID, null, "data.musicPrefix");
				return message.reply(getLang("resetMusic", "$"));
			}
			if (args[1] === 'link') {
				const songLink = args[2] || "https://www.youtube.com/watch?v=eKFN-aqPJH8"; // Your Name theme song link
				await threadsData.set(event.threadID, songLink, "data.songLink");
				return message.reply(getLang("successLink", songLink));
			}
			const musicPrefix = args[1];
			await threadsData.set(event.threadID, musicPrefix, "data.musicPrefix");
			return message.reply(getLang("successMusic", musicPrefix));
		}

		if (args[0] === 'playMusic') {
			return this.playMusic({ message });
		}

		const newPrefix = args[0];
		const formSet = { commandName, author: event.senderID, newPrefix, setGlobal: args[1] === "-g" };

		if (formSet.setGlobal && role < 2) return message.reply(getLang("onlyAdmin"));

		return message.reply(
			formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread"),
			(err, info) => {
				if (!err) {
					formSet.messageID = info.messageID;
					global.GoatBot.onReaction.set(info.messageID, formSet);
				}
			}
		);
	},
	
	// Play "Your Name" Theme Song
	playMusic: function({ message }) {
		const songPath = path.join(__dirname, "your_name_theme_song.mp3"); // Local path to "Your Name" theme song file

		playSound.play(songPath, (err) => {
			if (err) {
				console.error("Error playing song:", err);
				return message.reply("Failed to play song. Please check the file path and ensure a supported audio player is installed (e.g., mpg123).");
			}
			return message.reply("Playing 'Your Name' theme song.");
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, threadsData, getLang }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const imageUrl = "https://i.ibb.co/fXR2gHw/image.gif";
			const prefix = await threadsData.get(event.threadID, "data.prefix") || global.GoatBot.config.prefix;
			const musicPrefix = await threadsData.get(event.threadID, "data.musicPrefix") || "$";
			const songLink = await threadsData.get(event.threadID, "data.songLink") || "Not set";

			const prefixInfo = `┏𝗣𝗥𝗘𝗙𝗜𝗫\n┗━━━⦿【${prefix}】\n🎶 Music Prefix: 【 $ { , } 】\n🎵 Song Link: ${https://youtu.be/-pHfPJGatgE?si=CzLcIwrPDlDn5_wM}`;
			return message.reply({
				body: prefixInfo,
				attachment: await utils.getStreamFromURL(imageUrl)
			});
		}
	}
};
