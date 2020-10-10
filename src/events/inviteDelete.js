module.exports = async function(guild, [ event ]) {

	const fields = [];

	fields.push({
		name: "Invite Code",
		value: `https://discord.gg/${event.code}`,
		inline: true
	})

	if(event.expiresAt) fields.push({
		name: "Expires",
		value: `\`${dayjs(event.expiresAt).format("MM/DD/YYYY HH:mm:ss")}\` • \`${dayjs(event.expiresAt).fromNow(true)}\``,
		inline: true
	})

	if(event.uses || event.maxUses) fields.push({
		name: "Uses",
		value: `\`${event.uses || 0}\``,
		inline: true
	})

	if(event.maxUses) fields.push({
		name: "Max Uses",
		value: `\`${event.maxUses}\``,
		inline: true
	})

	await sendAudit(guild, {
		sender: { user: event.inviter },
		color: "error",
		title: "Deleted an Invite to the Server",
		fields
	})

}