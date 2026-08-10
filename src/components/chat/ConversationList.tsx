import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConversationBase } from '../../api/conversations';
import { Colors, Radius, Spacing } from '../../theme/tokens';

interface ConversationListProps {
  items: ConversationBase[];
  activeId: number;
  onSelect: (id: number) => void;
}

/**
 * Colonne latérale, **web large uniquement** (`FRONTEND_SPEC` §6.6).
 *
 * Le spec y ajoute une recherche et un bouton « Nouvelle ». Ni l'une ni l'autre
 * n'ont de sens côté client : la route de création est idempotente par `tag`,
 * donc un client ne peut pas ouvrir un second fil « Identité », et il n'a
 * qu'une poignée de conversations — il n'y a rien à chercher. Ces deux
 * commandes appartiennent au backoffice.
 */
export function ConversationList({ items, activeId, onSelect }: ConversationListProps) {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.heading}>Vos discussions</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {items.map((conv) => {
          const active = conv.id === activeId;
          return (
            <Pressable
              key={conv.id}
              onPress={() => onSelect(conv.id)}
              accessibilityRole="button"
              accessibilityLabel={`Discussion ${conv.tag}`}
              aria-selected={active}
              style={[styles.item, active && styles.itemActive]}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.tag} numberOfLines={1}>
                  {conv.tag}
                </Text>
                <Text style={styles.time}>{conv.time}</Text>
              </View>

              <Text style={styles.preview} numberOfLines={1}>
                {conv.preview || 'Aucun message'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    flexShrink: 0,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: Spacing.lg,
  },
  heading: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Colors.textLabel,
  },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
  item: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  itemActive: { backgroundColor: Colors.selectedBg },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  tag: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  time: { fontSize: 10, color: Colors.textFaint },
  preview: { fontSize: 12, color: Colors.textMuted },
});
