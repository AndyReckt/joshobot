module.exports = class Command extends require("../Command.js") {

	constructor() {
		super("pause", ...arguments);
	}

	async onCommand({ args, sender, guildConfig, root, channel, guild, audit }) {

		const stream = streams[guild.id];
		if(stream === undefined) return channel.send(new MessageEmbed()
		.setColor(guildConfig.theme.info)
		.setDescription(`Nothing to pause.`)
		.setFooter(sender.displayName, sender.user.displayAvatarURL()));

		const { dispatcher, songInfo } = stream;
		const song = { title: songInfo.videoDetails.title, url: songInfo.videoDetails.video_url };

		dispatcher.pausedSince === null ? dispatcher.pause(true) : dispatcher.resume();

		return channel.send(new MessageEmbed()
		.setColor(guildConfig.theme.info)
		.setTitle(`${dispatcher.pausedSince ? "Paused" : "Playing"}:`)
		.setThumbnail(songInfo.videoDetails.thumbnail.thumbnails[0].url)
		.setDescription(`${song.url}`)
		.addField("Now Playing", `${song.title} ― **${songInfo.videoDetails.author.name}**`, true)
		.addField("Up Next", `${songInfo.related_videos[0].title} ― **${songInfo.related_videos[0].author}**`, true)
		.setFooter(sender.displayName, sender.user.displayAvatarURL()));

	}

}
