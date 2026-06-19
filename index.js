const {
    Client,
    GatewayIntentBits,
    Partials,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

// ---------- CLIENT ----------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// ---------- MOD ROLES ----------
const modRoles = [
    "1517295293526442186",
    "1517295139322597507",
    "1517294993323065545",
    "1517294778520305774",
    "1512150329234559207"
];

// ---------- BUMP COOLDOWNS ----------
const bumpCooldowns = new Map(); // userId → timestamp

// ---------- SIMPLE ms() PARSER ----------
function ms(str) {
    if (!str) return 0;
    const match = str.match(/(\d+)(s|m|h|d)/i);
    if (!match) return 0;
    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return num * (map[unit] || 0);
}

// ---------- SLASH COMMANDS ----------
const commands = [
    new SlashCommandBuilder().setName("help").setDescription("Shows all available commands."),
    new SlashCommandBuilder().setName("ping").setDescription("Check bot latency."),
    new SlashCommandBuilder().setName("debug").setDescription("Shows bot system status."),
    new SlashCommandBuilder().setName("serverinfo").setDescription("Shows information about this server."),
    new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Shows information about a user.")
        .addUserOption(o => o.setName("user").setDescription("Select a user").setRequired(false)),
    new SlashCommandBuilder()
        .setName("xp")
        .setDescription("XP system commands.")
        .addSubcommand(sub => sub.setName("profile").setDescription("Shows your XP profile.")),
    new SlashCommandBuilder().setName("xpleaderboard").setDescription("Shows the XP leaderboard."),
    new SlashCommandBuilder()
        .setName("xpadd")
        .setDescription("Add XP to a user.")
        .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
        .addIntegerOption(o => o.setName("amount").setDescription("XP amount").setRequired(true)),
    new SlashCommandBuilder()
        .setName("xpremove")
        .setDescription("Remove XP from a user.")
        .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
        .addIntegerOption(o => o.setName("amount").setDescription("XP amount").setRequired(true)),
    new SlashCommandBuilder().setName("modpanel").setDescription("Opens the moderation panel."),
    new SlashCommandBuilder().setName("uptime").setDescription("Shows how long the bot has been online."),
    new SlashCommandBuilder().setName("bump").setDescription("Bump the server and earn 40 XP (24h cooldown).")
].map(c => c.toJSON());

// ---------- REGISTER COMMANDS ----------
client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
    );

    console.log("Slash commands registered.");
});

// ---------- INTERACTION HANDLER ----------
client.on("interactionCreate", async interaction => {

    // ---------------- SLASH COMMANDS ----------------
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // /help
        if (commandName === "help") {
            const embed = new EmbedBuilder()
                .setTitle("AAIG Bot — Help Menu")
                .setColor("Blue")
                .addFields(
                    { name: "General", value: "/ping, /debug, /serverinfo, /userinfo, /uptime" },
                    { name: "XP System", value: "/xp profile, /xpleaderboard, /xpadd, /xpremove, /bump" },
                    { name: "Moderation", value: "/modpanel" }
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // /ping
        if (commandName === "ping") {
            return interaction.reply(`🏓 Pong! Latency: **${Date.now() - interaction.createdTimestamp}ms**`);
        }

        // /debug
        if (commandName === "debug") {
            const embed = new EmbedBuilder()
                .setTitle("AAIG Bot — Debug Info")
                .setColor("Purple")
                .addFields(
                    { name: "Ping", value: `${client.ws.ping}ms` },
                    { name: "Servers", value: `${client.guilds.cache.size}` },
                    { name: "Users", value: `${client.users.cache.size}` },
                    { name: "Uptime", value: `${Math.floor(client.uptime / 1000)} seconds` }
                );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // /serverinfo
        if (commandName === "serverinfo") {
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setTitle(`${guild.name} — Server Info`)
                .setColor("Green")
                .addFields(
                    { name: "Server ID", value: guild.id },
                    { name: "Owner", value: `<@${guild.ownerId}>` },
                    { name: "Members", value: `${guild.memberCount}` },
                    { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>` }
                );
            return interaction.reply({ embeds: [embed] });
        }

        // /userinfo
        if (commandName === "userinfo") {
            const user = interaction.options.getUser("user") || interaction.user;
            const member = await interaction.guild.members.fetch(user.id);

            const embed = new EmbedBuilder()
                .setTitle(`${user.username} — User Info`)
                .setColor("Yellow")
                .addFields(
                    { name: "User ID", value: user.id },
                    { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` },
                    { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>` },
                    { name: "Roles", value: member.roles.cache.map(r => r.toString()).join(", ") || "None" }
                );
            return interaction.reply({ embeds: [embed] });
        }

        // /xp profile
        if (commandName === "xp") {
            return interaction.reply("📊 XP Profile system placeholder.");
        }

        // /xpleaderboard
        if (commandName === "xpleaderboard") {
            return interaction.reply("🏆 XP Leaderboard placeholder.");
        }

        // /xpadd
        if (commandName === "xpadd") {
            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount");
            return interaction.reply(`➕ XP added: **${amount}** to **${user.tag}** (placeholder).`);
        }

        // /xpremove
        if (commandName === "xpremove") {
            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount");
            return interaction.reply(`➖ XP removed: **${amount}** from **${user.tag}** (placeholder).`);
        }

        // /uptime
        if (commandName === "uptime") {
            const totalSeconds = Math.floor(client.uptime / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return interaction.reply(
                `⏱️ **Bot Uptime:**\n${days}d ${hours}h ${minutes}m ${seconds}s`
            );
        }

        // /bump
        if (commandName === "bump") {
            const userId = interaction.user.id;
            const now = Date.now();
            const cooldown = 86400000; // 24h

            if (bumpCooldowns.has(userId)) {
                const lastUsed = bumpCooldowns.get(userId);
                const remaining = cooldown - (now - lastUsed);

                if (remaining > 0) {
                    const hours = Math.floor(remaining / 3600000);
                    const minutes = Math.floor((remaining % 3600000) / 60000);

                    return interaction.reply({
                        content: `⛔ You must wait **${hours}h ${minutes}m** before bumping again.`,
                        ephemeral: true
                    });
                }
            }

            bumpCooldowns.set(userId, now);

            return interaction.reply(
                `📢 **Server bumped!**\nYou earned **+40 XP**.\nCome back in **24 hours** for another bump.`
            );
        }

        // /modpanel
        if (commandName === "modpanel") {
            if (!interaction.member.roles.cache.some(r => modRoles.includes(r.id))) {
                return interaction.reply({ content: "❌ You do not have permission.", ephemeral: true });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("warn").setLabel("Warn").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("timeout").setLabel("Timeout").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("mute").setLabel("Mute").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("kick").setLabel("Kick").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("ban").setLabel("Ban").setStyle(ButtonStyle.Danger)
            );

            return interaction.reply({ content: "🛠️ **Moderation Panel**", components: [row] });
        }
    }

    // ---------------- BUTTONS ----------------
    if (interaction.isButton()) {
        if (!interaction.member.roles.cache.some(r => modRoles.includes(r.id))) {
            return interaction.reply({ content: "❌ You do not have permission.", ephemeral: true });
        }

        const action = interaction.customId;

        const modal = new ModalBuilder()
            .setCustomId(`modal_${action}`)
            .setTitle(`Moderation: ${action}`);

        const userInput = new TextInputBuilder()
            .setCustomId("targetUser")
            .setLabel("User ID")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const durationRequired = !["warn", "kick"].includes(action);

        const durationInput = new TextInputBuilder()
            .setCustomId("duration")
            .setLabel("Duration (e.g., 10m, 1h, 1d)")
            .setStyle(TextInputStyle.Short)
            .setRequired(durationRequired);

        const evidenceInput = new TextInputBuilder()
            .setCustomId("evidence")
            .setLabel("Evidence (optional)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const timestampInput = new TextInputBuilder()
            .setCustomId("timestamp")
            .setLabel("Timestamp (optional)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(userInput),
            new ActionRowBuilder().addComponents(durationInput),
            new ActionRowBuilder().addComponents(evidenceInput),
            new ActionRowBuilder().addComponents(timestampInput)
        );

        return interaction.showModal(modal);
    }

    // ---------------- MODALS ----------------
    if (interaction.isModalSubmit()) {
        const action = interaction.customId.replace("modal_", "");
        const userId = interaction.fields.getTextInputValue("targetUser");
        const duration = interaction.fields.getTextInputValue("duration") || "N/A";
        const evidence = interaction.fields.getTextInputValue("evidence") || "None";
        const timestamp = interaction.fields.getTextInputValue("timestamp") || "Not provided";

        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) {
            return interaction.reply({ content: "❌ Invalid user ID.", ephemeral: true });
        }

        const logEmbed = new EmbedBuilder()
            .setTitle(`Moderation Action: ${action}`)
            .setColor("Red")
            .addFields(
                { name: "Staff", value: `${interaction.user.tag}` },
                { name: "Target", value: `${target.user.tag}` },
                { name: "Duration", value: duration },
                { name: "Evidence", value: evidence },
                { name: "Timestamp", value: timestamp }
            )
            .setTimestamp();

        const logChannel = interaction.guild.channels.cache.find(c => c.name === "mod-logs");
        if (logChannel) logChannel.send({ embeds: [logEmbed] });

        try {
            switch (action) {
                case "warn":
                    return interaction.reply({ content: `⚠️ Warned ${target.user.tag}`, ephemeral: true });

                case "timeout":
                    await target.timeout(ms(duration));
                    return interaction.reply({ content: `⏳ Timed out ${target.user.tag} for ${duration}`, ephemeral: true });

                case "mute":
                    return interaction.reply({ content: `🔇 Muted ${target.user.tag} (add mute role logic).`, ephemeral: true });

                case "kick":
                    await target.kick(evidence);
                    return interaction.reply({ content: `👢 Kicked ${target.user.tag}`, ephemeral: true });

                case "ban":
                    await target.ban({ reason: evidence });
                    return interaction.reply({ content: `⛔ Banned ${target.user.tag}`, ephemeral: true });
            }
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "❌ Failed to perform action. Check my permissions.", ephemeral: true });
        }
    }
});

// ---------- LOGIN ----------
client.login(process.env.TOKEN);
