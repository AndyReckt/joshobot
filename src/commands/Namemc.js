module.exports = class Command extends require("../Command.js") {

	constructor() {
		super("namemc", ...arguments);
		this.register("Look up a Minecraft player. 🎮", HelpSection.MISCELLANEOUS, [{
			argument: "Username",
			required: true,
		}]);
	}

	async onCommand({ args, sender, guildConfig, channel }) {

		// Get arguments
		const [ mcname ] = args;

		// Set embed constants
		const embed = new MessageEmbed();
		embed.setTitle("Minecraft Account Lookup")
		embed.setFooter(sender.displayName, sender.user.displayAvatarURL());

		// If no args
		if(args.length !== 1) {
			embed.setColor(guildConfig.theme.warn);
			embed.addField("Description", this.description, true)
			embed.addField("Usage", this.usage, true)
            return await channel.send(embed);
		}

		// Lookup user
		const mcuser = await fetch(`https://joshm.us.to/api/namemc/v1/lookup?query=${mcname}`).then(resp => resp.json());

		// If no user found
		if(mcuser.success === false) {
			return channel.send(new MessageEmbed()
			.setColor(guildConfig.theme.error)
			.setDescription(`Minecraft user "${mcname}" was not found!`)
			.setFooter(sender.displayName, sender.user.displayAvatarURL()))
		}

		// Send embed
		embed.setURL(`https://mine.ly/${mcuser.profileId}`);
		embed.setTitle(mcuser.currentName);
		embed.setColor(guildConfig.theme.info);
		embed.addField("UUID", `\`${mcuser.uuid}\``);
		embed.addField("Previous Names", mcuser.pastNames.map(({ name }) => `\`${name}\``), true);
		embed.addField("Changed At", mcuser.pastNames.map(({ changedAt }) => `${changedAt !== null ? "`" + dayjs(changedAt).fromNow() + "`" : "__Never__"}`), true);
		embed.setThumbnail(mcuser.imageUrls.head);
		embed.setFooter(sender.displayName, sender.user.displayAvatarURL());
		return channel.send(embed)

	}

}
