import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { formatTime } from '../../utils/time';
import { Colors, Spacing } from '../../theme/tokens';
import type { PendingMessage } from '../../store/chatStore';

interface MessageBubbleProps {
  text: string;
  /** `true` pour un message écrit par l'utilisateur. */
  mine: boolean;
  /** Horodatage ISO. */
  createdAt: string;
  /** Renseigné seulement tant que le message n'est pas confirmé. */
  pending?: PendingMessage['state'];
}

export function MessageBubble({ text, mine, createdAt, pending }: MessageBubbleProps) {
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.text}>{text}</Text>

        <View style={styles.meta}>
          <Text style={styles.time}>{formatTime(createdAt)}</Text>
          {pending ? <PendingMark state={pending} /> : null}
        </View>
      </View>
    </View>
  );
}

function PendingMark({ state }: { state: PendingMessage['state'] }) {
  if (state === 'failed') {
    return <Text style={[styles.state, { color: Colors.danger }]}>non envoyé</Text>;
  }

  // `sending` et `queued` partagent le même affichage. Distinguer les deux
  // laisserait « envoi… » à l'écran jusqu'à 48 s sur réseau coupé, le temps que
  // les réessais s'épuisent — alors que « en attente » est vrai dans les deux
  // cas : le message est écrit sur l'appareil et n'est pas encore arrivé.
  //
  // « en attente » plutôt qu'une erreur : le message repartira seul. Une
  // coupure réseau est la norme ici, pas un incident.
  return (
    <View style={styles.stateRow}>
      <Icon name="clock" size={11} color={Colors.textFaint} strokeWidth={2.4} />
      <Text style={styles.state}>en attente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: Spacing.md },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    gap: 2,
  },
  // Coins repris de FRONTEND_SPEC §6.6 : l'angle « plein » désigne l'émetteur.
  bubbleMine: {
    backgroundColor: 'rgba(9,92,255,0.28)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 18,
  },
  bubbleTheirs: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
  },
  text: { fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: Spacing.sm,
  },
  time: { fontSize: 10, color: Colors.textFaint },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  state: { fontSize: 10, color: Colors.textFaint },
});
