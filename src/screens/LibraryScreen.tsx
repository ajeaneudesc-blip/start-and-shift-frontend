import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import { usePlatform } from '../hooks/usePlatform';
import { categoriesOf, categoryOf, listTemplates, Template } from '../api/templates';
import { openConversation } from '../api/conversations';
import { apiErrorMessage } from '../api/client';
import { Colors, Radius, Spacing } from '../theme/tokens';
import type { AppScreenProps } from '../navigation/types';
import { Halo } from '../components/effects/Halo';

/**
 * Libellé du filtre « pas de filtre ». Volontairement distinct de la catégorie
 * « Tous » présente dans les données (abréviation de « tous métiers ») : les
 * deux se retrouvent côte à côte dans la même rangée de filtres, et
 * « Tous les métiers » à côté de « Tous » ne veut plus rien dire.
 */
const TOUS = 'Tout voir';

/** « Tous » vient du serveur en abrégé ; on l'affiche en entier. */
function labelCategorie(categorie: string): string {
  return categorie === 'Tous' ? 'Tous métiers' : categorie;
}

export function LibraryScreen({ navigation }: AppScreenProps<'Library'>) {
  const insets = useSafeAreaInsets();
  const { isWide } = usePlatform();

  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState(TOUS);
  const [busy, setBusy] = useState(false);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const charger = useCallback(async () => {
    setError(null);
    try {
      const items = await listTemplates();
      if (alive.current) setTemplates(items);
    } catch (e) {
      if (alive.current) {
        setTemplates([]);
        setError(apiErrorMessage(e));
      }
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const categories = useMemo(
    () => [TOUS, ...categoriesOf(templates ?? [])],
    [templates],
  );

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return (templates ?? []).filter((t) => {
      if (categorie !== TOUS && categoryOf(t.meta) !== categorie) return false;
      if (!terme) return true;
      return `${t.name} ${t.meta}`.toLowerCase().includes(terme);
    });
  }, [templates, recherche, categorie]);

  /**
   * Demander un modèle à l'assistant. C'est la seule action possible : aucune
   * route ne permet de « prendre » un modèle, et la production des visuels
   * passe de toute façon par l'équipe. Le message est pré-rempli, pas envoyé —
   * l'utilisateur garde la main.
   */
  async function demander(template: Template) {
    setBusy(true);
    setError(null);
    try {
      const conv = await openConversation();
      navigation.navigate('Chat', {
        conversationId: conv.id,
        draft: `Bonjour, je voudrais le modèle « ${template.name} ».`,
      });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  // 4 colonnes sur web large, 2 sur mobile (FRONTEND_SPEC §6.9).
  const colonnes = isWide ? 4 : 2;

  return (
    <View style={[styles.flex, { paddingTop: insets.top + Spacing.sm }]}>
      <Halo />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Revenir"
            style={styles.iconButton}
          >
            <Icon name="arrow-left" size={19} />
          </Pressable>

          <Text style={styles.title} accessibilityRole="header">
            Bibliothèque
          </Text>

          <Pressable
            onPress={() => void charger()}
            accessibilityRole="button"
            accessibilityLabel="Recharger la liste"
            style={[styles.iconButton, styles.bordered]}
          >
            <Icon name="refresh" size={18} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Icon name="search" size={17} color={Colors.textMuted} />
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Chercher un modèle"
            placeholderTextColor={Colors.textFaint}
            accessibilityLabel="Chercher un modèle"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {categories.map((c) => {
            const actif = c === categorie;
            return (
              <Pressable
                key={c}
                onPress={() => setCategorie(c)}
                accessibilityRole="button"
                aria-selected={actif}
                style={[styles.chip, actif && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, actif && styles.chipLabelActive]}>
                  {c === TOUS ? c : labelCategorie(c)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {templates === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.blueMid} />
        </View>
      ) : (
        <FlatList
          // `key` force le remontage quand le nombre de colonnes change :
          // FlatList n'accepte pas que `numColumns` varie à chaud.
          key={colonnes}
          data={visibles}
          numColumns={colonnes}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + Spacing.xl }]}
          columnWrapperStyle={styles.gridRow}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              {recherche || categorie !== TOUS
                ? 'Aucun modèle ne correspond.'
                : "Aucun modèle disponible pour l'instant."}
            </Text>
          }
          renderItem={({ item }) => (
            <TemplateCard template={item} disabled={busy} onPress={() => demander(item)} />
          )}
        />
      )}
    </View>
  );
}

function TemplateCard({
  template,
  onPress,
  disabled,
}: {
  template: Template;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${template.name}, ${template.meta}. Demander ce modèle à l'assistant.`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/*
        Pas de vignette : `Template` ne porte aucune image. Le prototype montre
        le même cadre rayé marqué « visuel modèle à intégrer » — les aperçus
        restent à produire, côté design comme côté backend.
      */}
      <View style={styles.thumb}>
        <Text style={styles.thumbLabel}>visuel modèle{'\n'}à intégrer</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardText}>
          <Text style={styles.cardName} numberOfLines={2}>
            {template.name}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {template.meta}
          </Text>
        </View>

        <View style={styles.cardAction}>
          <Icon name="plus" size={15} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: { borderWidth: 1, borderColor: Colors.borderStrong },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  filters: { gap: Spacing.sm, paddingRight: Spacing.lg },
  chip: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.idleBorder,
  },
  chipActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  chipLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  chipLabelActive: { color: '#131316' },

  grid: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  gridRow: { gap: Spacing.md },
  empty: {
    padding: Spacing.xxl,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textFaint,
  },
  error: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    fontSize: 13,
    color: Colors.danger,
  },

  card: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.85, borderColor: Colors.selectedBorder },
  thumb: {
    aspectRatio: 4 / 3,
    margin: Spacing.sm + 2,
    marginBottom: 0,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLabel: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    color: Colors.textFaint,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  cardText: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cardMeta: { fontSize: 12, color: Colors.textMuted },
  cardAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
