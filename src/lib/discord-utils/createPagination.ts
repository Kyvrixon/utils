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
	MessageFlags,
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
import { randomUUIDv7 } from "bun";

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
	/**
	 * @default "--DATA_INPUT--"
	 */
	contentMarker?: string;
	/**
	 * @default 5
	 */
	entriesPerPage?: number;
	/**
	 * @default {}
	 */
	replacements?: Record<string, string>;
	styling?: Array<{ accent_color?: number; spoiler?: boolean }>;
	/**
	 * @default false
	 */
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
	uID: string,
	currentIndex: number,
	entriesPerPage: number,
	totalPages: number,
	listLength: number,
	ended: boolean,
): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`~PAGINATON_${uID}_back_button`)
			.setLabel("Prev")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(ended || currentIndex === 0),
		new ButtonBuilder()
			.setCustomId(`~PAGINATON_${uID}_page_info`)
			.setLabel(
				`${Math.floor(currentIndex / entriesPerPage) + 1}/${totalPages}`,
			)
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(ended || totalPages === 1),
		new ButtonBuilder()
			.setCustomId(`~PAGINATON_${uID}_forward_button`)
			.setLabel("Next")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(ended || currentIndex + entriesPerPage >= listLength),
	);
}

/**
 * If you need to filter out button interactions from this, all `customId` fields start with `~PAGINATON_`
 */
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
							uID,
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
		const buttonIds = [
			`~PAGINATON_${uID}_back_button`,
			`~PAGINATON_${uID}_page_info`,
			`~PAGINATON_${uID}_forward_button`,
		];

		if (!buttonIds.includes(btn.customId)) return;
		if (btn.user.id !== interaction.user.id) {
			return void btn.deferUpdate();
		}

		ended = false;
		collector.resetTimer();

		if (btn.customId === `~PAGINATON_${uID}_page_info`) {
			const modal = new ModalBuilder()
				.setCustomId(`~PAGINATON_${uID}_page_modal`)
				.setTitle("Page Indexer")
				.addLabelComponents(
					new LabelBuilder()
						.setDescription("Input a page number")
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId(`~PAGINATON_${uID}_page_number`)
								.setRequired(true)
								.setMinLength(1)
								.setStyle(TextInputStyle.Short),
						),
				);

			await btn.showModal(modal).catch(() => {});
			const modalSubmit = await btn
				.awaitModalSubmit({ time: 60_000 })
				.catch(() => null);

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
				modalSubmit.fields.getTextInputValue(`~PAGINATON_${uID}_page_number`),
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
							repliedUser: false
						}
					})
					.catch(() => null);
				return;
			}

			currentIndex = (pageNumber - 1) * entriesPerPage;
		} else {
			currentIndex +=
				btn.customId === `~PAGINATON_${uID}_back_button`
					? -entriesPerPage
					: entriesPerPage;
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

/*
##############################	
#          example           #
##############################	
	await createLeaderboard(
		Array.from({ length: 100 }, (_, i) => String(i + 1)),
		[
			[
				{
					type: "display",
					component: new TextDisplayBuilder().setContent("Numberssssss"),
				},
				{
					type: "separator",
					component: new SeparatorBuilder()
						.setDivider(true)
						.setSpacing(SeparatorSpacingSize.Small),
				},
				{
					component: new TextDisplayBuilder().setContent("--DATA_INPUT--"),
					type: "display",
				},
				{
					type: "buttons",
				},
			],
		],
		int,
		{
			entriesPerPage: 10,
			ephemeral: false,
		},
	);
*/
