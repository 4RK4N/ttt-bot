import { type ButtonInteraction } from "discord.js";

export async function handleTicketCancel(
  interaction: ButtonInteraction,
  cancelledText: string,
): Promise<void> {
  await interaction.update({
    content: cancelledText,
    components: [],
  });
}
