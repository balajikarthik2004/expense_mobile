import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, semantic, spacing, typography } from '../theme';

export default function SearchBar({ value, onChange, placeholder = 'Search transactions, notes, or tags…' }) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name="magnify" size={18} color={semantic.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search transactions"
      />
      {!!value && (
        <Pressable onPress={() => onChange('')} hitSlop={10} accessibilityLabel="Clear search">
          <MaterialCommunityIcons name="close-circle" size={17} color={semantic.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  input: { flex: 1, ...typography.bodyMd, color: semantic.textPrimary, paddingVertical: 0 },
});
