import { randomUUIDv7 } from "bun";
import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type ChannelSelectMenuBuilder,
	type ChatInputCommandInteraction,
	ComponentType,
	ContainerBuilder,
	type FileBuilder,
	LabelBuilder,
	type MediaGalleryBuilder,
	type MentionableSelectMenuBuilder,
	ModalBuilder,
	type RoleSelectMenuBuilder,
	type SectionBuilder,
	type SeparatorBuilder,
	type StringSelectMenuBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
	type UserSelectMenuBuilder,
} from "discord.js";

export type MessageActionRow = ActionRowBuilder<
	| ButtonBuilder
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder
	| RoleSelectMenuBuilder
	| ChannelSelectMenuBuilder
	| MentionableSelectMenuBuilder
>;

export type LeaderboardComponentType =
	| { type: "buttons" }
	| { type: "display"; component: TextDisplayBuilder }
	| { type: "section"; component: SectionBuilder }
	| { type: "separator"; component: SeparatorBuilder }
	| { type: "file"; component: FileBuilder }
	| { type: "gallery"; component: MediaGalleryBuilder }
	| { type: "actionrow"; component: MessageActionRow };

export interface LeaderboardOptions {
	contentMarker?: string;
	entriesPerPage?: number;
	replacements?: Record<string, string>;
	styling?: Array<{ accent_color?: number; spoiler?: boolean }>;
	ephemeral?: boolean;
}

function applyReplacements(
	content: string,
	replacements?: Record<string, string>,
): string {
	if (!replacements) return content;
	return Object.entries(replacements).reduce(
		(acc, [key, value]) => acc.replaceAll(key, value),
		content,
	);
}

function getPaginationRow(
	prefix: string,
	currentIndex: number,
	entriesPerPage: number,
	totalPages: number,
	listLength: number,
	ended: boolean,
): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`${prefix}back`)
			.setLabel("Prev")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(ended || currentIndex === 0),
		new ButtonBuilder()
			.setCustomId(`${prefix}info`)
			.setLabel(
				`${Math.floor(currentIndex / entriesPerPage) + 1}/${totalPages}`,
			)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(ended || totalPages === 1),
		new ButtonBuilder()
			.setCustomId(`${prefix}forward`)
			.setLabel("Next")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(ended || currentIndex + entriesPerPage >= listLength),
	);
}

export async function createPagination(
	list: Array<string>,
	structure: Array<Array<LeaderboardComponentType>>,
	interaction: ButtonInteraction | ChatInputCommandInteraction,
	options: LeaderboardOptions = {},
) {
	const {
		entriesPerPage = 5,
		replacements,
		styling,
		ephemeral = false,
		contentMarker = "--DATA_INPUT--",
	} = options;

	if (entriesPerPage <= 0)
		throw new Error("entriesPerPage must be greater than 0");

	const uID = randomUUIDv7();
	const prefix = `~PAGINATION_${uID}_`;
	let currentIndex = 0;
	let ended = false;

	if (!list.length) {
		await interaction
			.reply({
				allowedMentions: {
					parse: [],
					repliedUser: false,
				},
				components: [
					new ContainerBuilder().addTextDisplayComponents(
						new TextDisplayBuilder().setContent("No data to show"),
					),
				],
				flags: ephemeral ? ["Ephemeral", "IsComponentsV2"] : ["IsComponentsV2"],
			})
			.catch(() => {});
		return;
	}

	const totalPages = Math.ceil(list.length / entriesPerPage);
	const lastPage = structure[structure.length - 1];

	if (!lastPage) throw new Error("createLeaderboard is in a corrupted state");

	while (structure.length < totalPages) {
		structure.push(
			lastPage.map((comp) => {
				if (comp.type === "display") {
					return {
						type: "display",
						component: new TextDisplayBuilder(comp.component.toJSON()),
					};
				}
				return comp;
			}),
		);
	}

	function generateContainer(page: number): ContainerBuilder {
		const pageStructure = structure[page];
		if (!pageStructure) throw new Error(`Page ${page} structure not found`);

		return new ContainerBuilder({
			components: pageStructure.map((comp) => {
				switch (comp.type) {
					case "buttons":
						return getPaginationRow(
							prefix,
							currentIndex,
							entriesPerPage,
							totalPages,
							list.length,
							ended,
						).toJSON();

					case "display": {
						if (comp.component.data.content !== contentMarker) {
							return comp.component.toJSON();
						}

						const content = list
							.slice(
								page * entriesPerPage,
								page * entriesPerPage + entriesPerPage,
							)
							.join("\n");
						comp.component.data.content = applyReplacements(
							content,
							replacements,
						);
						return comp.component.toJSON();
					}

					case "section":
					case "separator":
					case "file":
					case "gallery":
					case "actionrow":
						return comp.component.toJSON();

					default: {
						return comp;
					}
				}
			}),
			accent_color: styling?.[page]?.accent_color,
			spoiler: styling?.[page]?.spoiler,
		});
	}

	if (!interaction.replied && !interaction.deferred) {
		await interaction
			.deferReply({
				withResponse: true,
				flags: ephemeral ? ["Ephemeral"] : [],
			})
			.catch(() => null);
	}

	const channel = interaction.channel;
	if (!channel || !("createMessageComponentCollector" in channel)) {
		throw new Error("Invalid channel type");
	}

	async function render(): Promise<void> {
		try {
			await interaction.editReply({
				components: [
					generateContainer(Math.floor(currentIndex / entriesPerPage)),
				],
				flags: ["IsComponentsV2"],
				allowedMentions: {
					parse: [],
					repliedUser: false,
				},
			});
		} catch (error) {
			const e = error as Error;
			if (!e.message.includes("Unknown Message")) {
				console.error("Failed to render leaderboard:", error);
			}
		}
	}

	await render();

	const collector = channel.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 60000,
	});

	collector.on("collect", async (btn) => {
		if (btn.user.id !== interaction.user.id) {
			return void btn.deferUpdate();
		}

		if (!btn.customId.startsWith(prefix)) return;

		ended = false;
		collector.resetTimer();

		if (btn.customId === `${prefix}info`) {
			const modal = new ModalBuilder()
				.setCustomId(`${prefix}modal`)
				.setTitle("Page Indexer")
				.addLabelComponents(
					new LabelBuilder()
						// .setDescription("Input a page number")
						.setLabel("Input a page number")
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId(`${prefix}number`)
								.setRequired(true)
								.setMinLength(1)
								.setStyle(TextInputStyle.Short),
						),
				);

			await btn.showModal(modal).catch((e) => console.error(e));
			const modalSubmit = await btn
				.awaitModalSubmit({ time: 60_000 })
				.catch((e) => console.error(e));

			if (!modalSubmit) {
				await btn
					.followUp({
						content: "Modal timed out.",
						flags: ["Ephemeral"],
					})
					.catch(() => null);
				return;
			}

			await modalSubmit.deferUpdate().catch(() => null);
			const pageNumber = Number(
				modalSubmit.fields.getTextInputValue(`${prefix}number`),
			);

			if (
				Number.isNaN(pageNumber) ||
				pageNumber < 1 ||
				pageNumber > totalPages
			) {
				await modalSubmit
					.reply({
						content: `Invalid page! Choose a number between **1** and **${totalPages}**.`,
						flags: ["Ephemeral"],
						allowedMentions: {
							parse: [],
							repliedUser: false,
						},
					})
					.catch(() => null);
				return;
			}

			currentIndex = (pageNumber - 1) * entriesPerPage;
		} else {
			currentIndex +=
				btn.customId === `${prefix}back` ? -entriesPerPage : entriesPerPage;
			currentIndex = Math.max(
				0,
				Math.min(currentIndex, (totalPages - 1) * entriesPerPage),
			);
			await btn.deferUpdate().catch(() => {});
		}

		await render();
	});

	collector.on("end", async () => {
		ended = true;
		await render();
	});
}