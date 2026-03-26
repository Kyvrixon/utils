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
	FileBuilder,
	LabelBuilder,
	MediaGalleryBuilder,
	type MentionableSelectMenuBuilder,
	ModalBuilder,
	type RoleSelectMenuBuilder,
	SectionBuilder,
	SeparatorBuilder,
	type StringSelectMenuBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
	type UserSelectMenuBuilder,
} from "discord.js";

/** An action row containing any interactive message component. */
export type MessageActionRow = ActionRowBuilder<
	| ButtonBuilder
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder
	| RoleSelectMenuBuilder
	| ChannelSelectMenuBuilder
	| MentionableSelectMenuBuilder
>;

const BUTTONS_SYMBOL: unique symbol = Symbol("pagination-buttons");
const DATA_SYMBOL: unique symbol = Symbol("pagination-data");

/** Valid component types that can appear in a pagination page layout. */
export type PaginationInput =
	| string
	| TextDisplayBuilder
	| SectionBuilder
	| SeparatorBuilder
	| FileBuilder
	| MediaGalleryBuilder
	| MessageActionRow
	| typeof BUTTONS_SYMBOL
	| typeof DATA_SYMBOL;

type InternalComponent =
	| { type: "buttons" }
	| { type: "data" }
	| { type: "display"; component: TextDisplayBuilder }
	| { type: "section"; component: SectionBuilder }
	| { type: "separator"; component: SeparatorBuilder }
	| { type: "file"; component: FileBuilder }
	| { type: "gallery"; component: MediaGalleryBuilder }
	| { type: "actionrow"; component: MessageActionRow };

export interface PaginationOptions {
	/** Number of list entries shown per page (default: 5). */
	entriesPerPage?: number;
	/** Key-value pairs replaced in rendered content. */
	replacements?: Record<string, string>;
	/** Per-page container styling overrides. */
	styling?: Array<{ accent_color?: number; spoiler?: boolean }>;
	/** Whether the pagination message is ephemeral. */
	ephemeral?: boolean;
}

/**
 * Discord Components V2 paginator. Renders a `ContainerBuilder`-based layout
 * with Prev/Next/page-jump buttons. Collector expires after 60 seconds.
 *
 * Use `DiscordPagination.BUTTONS` and `DiscordPagination.DATA` as sentinel
 * values in the structure array to position the navigation row and list data.
 *
 * @example
 * const pagination = new DiscordPagination(
 *    entries,
 *    [
 *        [
 *            "# Leaderboard",
 *            new SeparatorBuilder(),
 *            DiscordPagination.DATA,
 *            new SeparatorBuilder(),
 *            DiscordPagination.BUTTONS,
 *        ],
 *    ],
 *    {
 *        entriesPerPage: 5,
 *        ephemeral: false,
 *        styling: [{ accent_color: 0x5865f2 }],
 *    },
 * );
 */
export class DiscordPagination {
	/** Sentinel — marks where the pagination buttons should render. */
	static readonly BUTTONS: typeof BUTTONS_SYMBOL = BUTTONS_SYMBOL;
	/** Sentinel — marks where the paginated list entries should render. */
	static readonly DATA: typeof DATA_SYMBOL = DATA_SYMBOL;

	private readonly list: string[];
	private readonly structure: Array<Array<InternalComponent>>;
	private readonly entriesPerPage: number;
	private readonly replacements?: Record<string, string>;
	private readonly styling?: PaginationOptions["styling"];
	private readonly ephemeral: boolean;
	private readonly prefix: string;
	private readonly totalPages: number;

	private currentIndex = 0;
	private ended = false;
	private interaction!: ButtonInteraction | ChatInputCommandInteraction;

	constructor(
		list: string[],
		structure: Array<Array<PaginationInput>>,
		options: PaginationOptions = {},
	) {
		const {
			entriesPerPage = 5,
			replacements,
			styling,
			ephemeral = false,
		} = options;

		if (entriesPerPage <= 0)
			throw new Error("entriesPerPage must be greater than 0");

		this.list = list;
		this.entriesPerPage = entriesPerPage;
		this.replacements = replacements;
		this.styling = styling;
		this.ephemeral = ephemeral;
		this.prefix = `~PAGINATION_${randomUUIDv7()}_`;
		this.totalPages = Math.ceil(list.length / entriesPerPage);
		this.structure = this.expandStructure(
			structure.map((page) => page.map((input) => this.normalize(input))),
		);
	}

	/**
	 * Sends the paginated message and starts the button collector.
	 * @param interaction - The interaction to reply to.
	 */
	public async send(
		interaction: ButtonInteraction | ChatInputCommandInteraction,
	): Promise<void> {
		this.interaction = interaction;

		if (!this.list.length) {
			await interaction
				.reply({
					allowedMentions: { parse: [], repliedUser: false },
					components: [
						new ContainerBuilder().addTextDisplayComponents(
							new TextDisplayBuilder().setContent("No data to show"),
						),
					],
					flags: this.ephemeral
						? ["Ephemeral", "IsComponentsV2"]
						: ["IsComponentsV2"],
				})
				.catch(() => {});
			return;
		}

		if (!interaction.replied && !interaction.deferred) {
			await interaction
				.deferReply({
					withResponse: true,
					flags: this.ephemeral ? ["Ephemeral"] : [],
				})
				.catch(() => null);
		}

		const channel = interaction.channel;
		if (!channel || !("createMessageComponentCollector" in channel)) {
			throw new Error("Invalid channel type");
		}

		await this.render();

		const collector = channel.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000,
		});

		collector.on("collect", async (btn) => {
			if (btn.user.id !== interaction.user.id) {
				return void btn.deferUpdate();
			}
			if (!btn.customId.startsWith(this.prefix)) return;

			this.ended = false;
			collector.resetTimer();

			if (btn.customId === `${this.prefix}info`) {
				await this.handlePageJump(btn);
			} else {
				this.currentIndex +=
					btn.customId === `${this.prefix}back`
						? -this.entriesPerPage
						: this.entriesPerPage;
				this.currentIndex = Math.max(
					0,
					Math.min(
						this.currentIndex,
						(this.totalPages - 1) * this.entriesPerPage,
					),
				);
				await btn.deferUpdate().catch(() => {});
			}

			await this.render();
		});

		collector.on("end", async () => {
			this.ended = true;
			await this.render();
		});
	}

	private normalize(input: PaginationInput): InternalComponent {
		if (input === BUTTONS_SYMBOL) return { type: "buttons" };
		if (input === DATA_SYMBOL) return { type: "data" };
		if (typeof input === "string")
			return {
				type: "display",
				component: new TextDisplayBuilder().setContent(input),
			};
		if (input instanceof TextDisplayBuilder)
			return { type: "display", component: input };
		if (input instanceof SeparatorBuilder)
			return { type: "separator", component: input };
		if (input instanceof SectionBuilder)
			return { type: "section", component: input };
		if (input instanceof FileBuilder) return { type: "file", component: input };
		if (input instanceof MediaGalleryBuilder)
			return { type: "gallery", component: input };
		return { type: "actionrow", component: input };
	}

	private expandStructure(
		structure: Array<Array<InternalComponent>>,
	): Array<Array<InternalComponent>> {
		const lastPage = structure[structure.length - 1];
		if (!lastPage) throw new Error("Structure must have at least one page");

		while (structure.length < this.totalPages) {
			structure.push(this.clonePage(lastPage));
		}

		return structure;
	}

	private clonePage(page: Array<InternalComponent>): Array<InternalComponent> {
		return page.map((comp) =>
			comp.type === "display"
				? {
						type: "display" as const,
						component: new TextDisplayBuilder(comp.component.toJSON()),
					}
				: comp,
		);
	}

	private async handlePageJump(btn: ButtonInteraction): Promise<void> {
		const modal = new ModalBuilder()
			.setCustomId(`${this.prefix}modal`)
			.setTitle("Page Indexer")
			.addLabelComponents(
				new LabelBuilder()
					.setLabel("Input a page number")
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId(`${this.prefix}number`)
							.setRequired(true)
							.setMinLength(1)
							.setStyle(TextInputStyle.Short),
					),
			);

		await btn.showModal(modal).catch((e) => console.error(e));
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

		const pageNumber = Number(
			modalSubmit.fields.getTextInputValue(`${this.prefix}number`),
		);

		if (
			!Number.isInteger(pageNumber) ||
			pageNumber < 1 ||
			pageNumber > this.totalPages
		) {
			await modalSubmit
				.reply({
					content: `Invalid page! Choose a number between **1** and **${this.totalPages}**.`,
					flags: ["Ephemeral"],
					allowedMentions: { parse: [], repliedUser: false },
				})
				.catch(() => null);
			return;
		}

		await modalSubmit.deferUpdate().catch(() => null);
		this.currentIndex = (pageNumber - 1) * this.entriesPerPage;
	}

	private generateContainer(page: number): ContainerBuilder {
		const pageStructure = this.structure[page];
		if (!pageStructure) throw new Error(`Page ${page} structure not found`);

		return new ContainerBuilder({
			components: pageStructure.map((comp) => {
				switch (comp.type) {
					case "buttons":
						return this.getPaginationRow().toJSON();

					case "data": {
						const content = this.list
							.slice(
								page * this.entriesPerPage,
								(page + 1) * this.entriesPerPage,
							)
							.join("\n");
						return new TextDisplayBuilder()
							.setContent(this.applyReplacements(content))
							.toJSON();
					}

					// !! Default clause applies to the below as well
					// case "display":
					// case "section":
					// case "separator":
					// case "file":
					// case "gallery":
					// case "actionrow":
					default:
						return comp.component.toJSON();
				}
			}),
			accent_color: this.styling?.[page]?.accent_color,
			spoiler: this.styling?.[page]?.spoiler,
		});
	}

	private getPaginationRow(): ActionRowBuilder<ButtonBuilder> {
		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`${this.prefix}back`)
				.setLabel("Prev")
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(this.ended || this.currentIndex === 0),
			new ButtonBuilder()
				.setCustomId(`${this.prefix}info`)
				.setLabel(
					`${Math.floor(this.currentIndex / this.entriesPerPage) + 1}/${this.totalPages}`,
				)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(this.ended || this.totalPages === 1),
			new ButtonBuilder()
				.setCustomId(`${this.prefix}forward`)
				.setLabel("Next")
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(
					this.ended ||
						this.currentIndex + this.entriesPerPage >= this.list.length,
				),
		);
	}

	private applyReplacements(content: string): string {
		if (!this.replacements) return content;
		return Object.entries(this.replacements).reduce(
			(acc, [key, value]) => acc.replaceAll(key, value),
			content,
		);
	}

	private async render(): Promise<void> {
		try {
			await this.interaction.editReply({
				components: [
					this.generateContainer(
						Math.floor(this.currentIndex / this.entriesPerPage),
					),
				],
				flags: ["IsComponentsV2"],
				allowedMentions: { parse: [], repliedUser: false },
			});
		} catch (error) {
			const e = error as Error;
			if (!e.message.includes("Unknown Message")) {
				console.error("Failed to render pagination:", error);
			}
		}
	}
}
