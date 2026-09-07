import axios, { type AxiosError } from "axios";
import type { Client } from "&/DiscordClient";
import type { Command } from "?/command";
import config from "$config";
import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";

export default {
	name: "ask",
	requires: ["ai"],

	async execute(_client: Client, int: ChatInputCommandInteraction) {
		const ai = config.ai;
		if (!ai?.baseUrl || !ai.model)
			return await int.reply({ content: "AI_BASE_URL and AI_MODEL must be configured" });

		const question = int.options.getString("question", true);
		const ephemeral = int.options.getBoolean("personal") || false;
		await int.deferReply({ flags: ephemeral ? MessageFlags.Ephemeral : undefined });

		try {
			const headers: Record<string, string> = { "Content-Type": "application/json" };
			if (ai.apiKey) headers.Authorization = `Bearer ${ai.apiKey}`;
			const response = await axios.post(
				`${ai.baseUrl.replace(/\/+$/, "")}/chat/completions`,
				{ model: ai.model, messages: [{ role: "user", content: question }] },
				{ headers },
			);
			const content = response.data?.choices?.[0]?.message?.content;
			if (typeof content !== "string") throw new Error("Invalid AI response");
			const description = `**Prompt**\n> ${question.split("\n").join("\n> ")}\n\n**Response**\n${content}`;
			const truncated = description.length > 4096 ? `${description.slice(0, 4093)}...` : description;
			await int.editReply({
				embeds: [new EmbedBuilder().setTitle(`${ai.model}'s response`).setDescription(truncated).setFooter({ text: `Requested by ${int.user.username}` })],
			});
		} catch (e) {
			const error = e as AxiosError;
			if (error.response?.status)
				return await int.editReply({ content: `The AI API request failed with status ${error.response.status} (${error.response.statusText})` });
			if (e instanceof Error && e.message === "Invalid AI response")
				return await int.editReply({ content: "The AI API returned an invalid response" });
			console.log(error);
			await int.editReply({ content: "Something went wrong..." });
		}
	},
} as Command;
