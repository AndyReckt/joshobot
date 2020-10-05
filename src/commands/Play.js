function search(str) {
	return new Promise(function(resolve, reject) {
		ytsearch(str, { maxResults: 1, key: process.env.GOOGLE_APIS }, function(error, results) {
			if(error) return reject(error);
			resolve(results);
		})
	});
}

module.exports = class Command extends require("../Command.js") {

	constructor() {
		super("play", ...arguments);
	}

	async onCommand({ args, sender, guildConfig, root, channel, guild, audit }) {

		const runningStream = streams[guild.id];
		if(runningStream !== undefined && args[0] === undefined) {

			const { dispatcher, songInfo } = runningStream;
			const song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url };

			dispatcher.pausedSince === null ? dispatcher.pause(true) : dispatcher.resume();

			return channel.send(new MessageEmbed()
			.setColor(guildConfig.theme.info)
			.setTitle(`${dispatcher.pausedSince ? "Paused" : "Playing"}:`)
			.setThumbnail(songInfo.videoDetails.thumbnail.thumbnails[0].url)
			.setDescription(`${song.url}\n**${song.title}** By **${songInfo.videoDetails.author.name}**`)
			.setFooter(sender.displayName, sender.user.displayAvatarURL()));

		}

		let url;
		if(args[0].match(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm)) {
			url = args[0];
		} else {

			try {
				const resp = await search(args.join(" "));
				url = resp[0].link;
			} catch(err) {
				return channel.send(new MessageEmbed()
				.setColor(guildConfig.theme.error)
				.setDescription(`No results for "${args.join(" ")}" were found 😮.`)
				.setFooter(sender.displayName, sender.user.displayAvatarURL()));
			}

		}

		if(!sender.voice.channel) {
			return channel.send(new MessageEmbed()
			.setColor(guildConfig.theme.error)
			.setDescription(`You must be in a voice channel to use this command.`)
			.setFooter(sender.displayName, sender.user.displayAvatarURL()));
		}

		if(!url) {
			return channel.send(new MessageEmbed()
			.setColor(guildConfig.theme.warn)
			.setDescription(`Usage: \`${root} <YouTube url>\`.`)
			.setFooter(sender.displayName, sender.user.displayAvatarURL()));
		}

		let songInfo;
		try {
			songInfo = await ytdl.getInfo(url);
		} catch(e) {
			return channel.send(new MessageEmbed()
			.setColor(guildConfig.theme.error)
			.setDescription(`Uh oh! This search yielded age-restricted content.`)
			.setFooter(sender.displayName, sender.user.displayAvatarURL()));
		}

		const song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url };

		await channel.send(new MessageEmbed()
		.setColor(guildConfig.theme.info)
		.setThumbnail(songInfo.videoDetails.thumbnail.thumbnails[0].url)
		.setTitle(`Now Playing:`)
		.setThumbnail(songInfo.videoDetails.thumbnail.thumbnails[0].url)
		.setDescription(`${song.url}`)
		.addField("Now Playing", `${song.title} ― **${songInfo.videoDetails.author.name}**`, true)
		.addField("Up Next", `${songInfo.related_videos[0].title} ― **${songInfo.related_videos[0].author}**`, true)
		.setFooter(sender.displayName, sender.user.displayAvatarURL()));

		const connection = await sender.voice.channel.join();
		const stream = ytdl(song.url, { filter: "audioonly" });
		const dispatcher = connection.play(stream);

		const skip = setTimeout(function() {
			streams[guild.id].skip();
		}, parseInt(songInfo.videoDetails.lengthSeconds) * 1000);

		streams[guild.id] = {
			dispatcher,
			stream,
			songInfo,
			channel,
			voice: sender.voice.channel,
			skip: () => {
				clearTimeout(skip)
				dispatcher.destroy();
				streams[guild.id] = undefined;
				this.onCommand({ args: [`https://www.youtube.com/watch?v=${songInfo.related_videos[0].id}`], sender, guildConfig, root, channel, guild, audit })
			}
		}

	}

}