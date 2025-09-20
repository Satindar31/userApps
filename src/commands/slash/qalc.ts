import { execSync, type ExecException } from "node:child_process";
import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Client } from "&/DiscordClient";
import type { Command } from "?/command";

const cleanRegex = /[`$"\\\n]/g;

export default {
    name: "qalc",
    requires: [],

    async execute(_client: Client, int: ChatInputCommandInteraction) {
        const calculation = int.options.getString("calculation", true).replace(cleanRegex, "");

        await int.deferReply();

        const command = `qalc "${calculation}"`;

        let output: string;

        try {
            output = execSync(command).toString().trim();
        } catch (e) {
            const err = e as ExecException;

            const error = err.stderr?.toString().trim() || "";

            if (error.includes("not found"))
                return await int.editReply({
                    content: "`qalc` is not installed on the system",
                });

            console.log(error);

            return await int.editReply({
                content: "Something went wrong...",
            });
        }

        if (!output || output.length <= 0)
            return await int.editReply({
                content: "This query returned no response",
            });

        if (output.length > 4060) output = `${output.substr(0, 4060)}...`;

        const embed = new EmbedBuilder().setDescription(
            `\`${command}\`\n\`\`\`txt\n${output}\n\`\`\``,
        );

        await int.editReply({
            embeds: [embed],
        });
    },
} as Command;
