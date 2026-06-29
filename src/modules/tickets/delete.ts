import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type ButtonInteraction,
  type GuildMember,
  type ThreadChannel,
} from 'discord.js';
import { isModuleEnabled } from '../../core/texts.js';
import { isClosedTicketThread } from './names.js';
import { DELETE_CONFIRM_PREFIX, DELETE_PREFIX } from './panel.js';
import { canStaffOrAdmin } from './permissions.js';
import { resolveTicketType, texts, NAMESPACE } from './types.js';

interface ParsedDeleteCustomId {
  threadId: string;
  typeId: string;
}

function parseDeleteCustomId(customId: string): ParsedDeleteCustomId | null {
  const confirm = customId.startsWith(DELETE_CONFIRM_PREFIX);
  const prefix = confirm ? DELETE_CONFIRM_PREFIX : DELETE_PREFIX;
  if (!customId.startsWith(prefix)) return null;

  const segments = customId.slice(prefix.length).split(':');
  if (segments.length < 2) return null;

  return { threadId: segments[0], typeId: segments.slice(1).join(':') };
}

function canDeleteTicket(interaction: ButtonInteraction, staffRoleIds: string[]): boolean {
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleIds);
}

export async function handleDeleteTicket(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseDeleteCustomId(interaction.customId);
  if (!parsed) return;

  const isConfirm = interaction.customId.startsWith(DELETE_CONFIRM_PREFIX);
  const ticketType = resolveTicketType(parsed.typeId);

  if (!isModuleEnabled(NAMESPACE)) {
    await interaction.reply({ content: texts().disabled, flags: MessageFlags.Ephemeral });
    return;
  }

  if (!ticketType) {
    await interaction.reply({
      content: texts().categoryUnpublished,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const thread = interaction.channel;
  if (!thread?.isThread()) {
    await interaction.reply({
      content: 'This action must be used inside a ticket thread.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!isClosedTicketThread(thread.name, thread.locked === true)) {
    await interaction.reply({
      content: texts().deleteNotClosed,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!canDeleteTicket(interaction, ticketType.staffRoleIds)) {
    await interaction.reply({
      content: texts().noDeletePermission,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const deletePayload = `${parsed.threadId}:${parsed.typeId}`;

  if (!isConfirm) {
    const yes = new ButtonBuilder()
      .setCustomId(`${DELETE_CONFIRM_PREFIX}${deletePayload}`)
      .setLabel(ticketType.confirmDeleteYes.slice(0, 80))
      .setStyle(ButtonStyle.Danger);

    const no = new ButtonBuilder()
      .setCustomId(`tickets:delete-cancel:${parsed.threadId}`)
      .setLabel(ticketType.confirmDeleteNo.slice(0, 80))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no);

    await interaction.reply({
      content: ticketType.confirmDeletePrompt,
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.update({ content: ticketType.ticketDeleted, components: [] });

  try {
    await (thread as ThreadChannel).delete();
  } catch (err) {
    console.error('[tickets] Failed to delete ticket thread:', err);
    await interaction.followUp({
      content: 'Something went wrong while deleting this ticket.',
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function handleDeleteCancel(interaction: ButtonInteraction): Promise<void> {
  await interaction.update({
    content: 'Delete cancelled.',
    components: [],
  });
}
