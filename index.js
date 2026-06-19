const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    Routes,
    REST
} = require("discord.js");
const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let startTime = Date.now();

// XP storage
let xpData = {};
const xpFile = "xp.json";

if (fs.existsSync(xpFile)) {
    xpData = JSON.parse(fs.readFileSync(xpFile));
}

function saveXP() {
    fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 4));
}

// XP system (10 XP per word)
client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    const words = message.content.trim().split(/\s+/).length;
    const gainedXP = words * 10;

    const id = message.author.id;
    xpData[id] = (xpData[id] || 0) + gainedXP;
    saveXP();
});

// Slash commands
const commands = [
    new SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Shows how long the bot has been online."),
    new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Shows information about this server."),
    new SlashCommandBuilder()
        .setName("joined")
        .setDescription("Shows when a user joined the server.")
        .addUserOption(option =>
            option.setName("user").setDescription("Select a user")
        ),
    new SlashCommandBuilder()
        .setName("xp")
        .setDescription("Shows a user's XP.")
        .addUserOption(option =>
            option.setName("user").setDescription("Select a user")
        ),
    new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Shows information about AAIG Bot.")
].map(cmd => cmd.toJSON());

// Register slash commands
client.once("ready", async () => {
    console.log("AAIG Bot is online.");

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
    );

    console.log("Slash commands synced.");
});

// Slash command handler
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "uptime") {
        const total = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;

        return interaction.reply(`🟢 Bot Uptime: **${hours}h ${minutes}m ${seconds}s**`);
    }

    if (interaction.commandName === "serverinfo") {
        const guild = interaction.guild;
        return interaction.reply(
            `📌 **Server Name:** ${guild.name}\n` +
            `👥 **Members:** ${guild.memberCount}\n` +
            `📅 **Created:** ${guild.createdAt.toDateString()}\n` +
            `🆔 **Server ID:** ${guild.id}`
        );
    }

    if (interaction.commandName === "joined") {
        const member = interaction.options.getUser("user") || interaction.user;
        const guildMember = await interaction.guild.members.fetch(member.id);

        return interaction.reply(
            `👤 **${member.username}** joined on **${guildMember.joinedAt.toDateString()}**`
        );
    }

    if (interaction.commandName === "xp") {
        const member = interaction.options.getUser("user") || interaction.user;
        const userXP = xpData[member.id] || 0;

        return interaction.reply(`⭐ **${member.username}** has **${userXP} XP**`);
    }

    if (interaction.commandName === "botinfo") {
        return interaction.reply("🤖 **AAIG Bot** — uptime, XP, server info, and user stats.");
    }
});

client.login(process.env.TOKEN);
