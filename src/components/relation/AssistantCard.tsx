import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { Colors, Radius, Spacing } from '../../theme/tokens';

/**
 * `offline` = la dernière requête n'est pas partie.
 * `closed`  = l'assistance n'a pas encore ouvert.
 * `online`  = le service répond.
 */
export type Presence = 'online' | 'offline' | 'closed';

/**
 * Heure d'ouverture de l'assistance, en heure locale de l'appareil (le Togo est
 * à UTC+0, sans changement d'heure).
 *
 * `null` tant que l'équipe n'a pas communiqué les vraies heures. Dans cet état
 * l'écran n'annonce **jamais** de créneau : la pastille se limite à ce qu'on
 * sait vraiment, à savoir si le service répond ou non. Renseigner l'heure ici
 * suffira à réactiver l'affichage « Disponible à partir de … ».
 */
export const SUPPORT_OPENS_AT: number | null = null;

export function isBeforeOpening(now: Date = new Date()): boolean {
  if (SUPPORT_OPENS_AT === null) return false;
  return now.getHours() < SUPPORT_OPENS_AT;
}

const LABELS: Record<Presence, string> = {
  online: 'En ligne',
  offline: 'Hors ligne — messages gardés',
  closed:
    SUPPORT_OPENS_AT === null
      ? 'Bientôt disponible'
      : `Disponible à partir de ${SUPPORT_OPENS_AT}h`,
};

const COLORS: Record<Presence, string> = {
  online: '#5FD08C',
  offline: Colors.textFaint,
  closed: Colors.orange,
};

interface AssistantCardProps {
  presence: Presence;
}

/**
 * L'accompagnant reste anonyme — « Assistant », jamais un nom. C'est une
 * consigne du prototype : l'équipe derrière peut changer sans que le client
 * ait l'impression de perdre son interlocuteur.
 */
export function AssistantCard({ presence }: AssistantCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Icon name="palette" size={20} />
      </View>

      <View style={styles.text}>
        <Text style={styles.name}>Assistant</Text>
        <View style={styles.presenceRow} accessibilityLiveRegion="polite">
          <View style={[styles.dot, { backgroundColor: COLORS[presence] }]} />
          <Text style={[styles.presence, { color: COLORS[presence] }]}>
            {LABELS[presence]}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md + 2,
    padding: Spacing.lg + 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.posCardBorder,
    backgroundColor: Colors.posCardBg,
  },
  avatar: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: Spacing.xs },
  name: { fontSize: 16, lineHeight: 22, fontWeight: '500', color: Colors.textPrimary },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  presence: { fontSize: 13 },
});
