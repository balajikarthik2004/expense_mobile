import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Emblem from '../src/components/Emblem';
import { useAuth } from '../src/lib/auth';
import { colors, semantic, typography, spacing, radius, shadows, gradients } from '../src/theme';

// Mirrors the web client's signup rules so the two stay consistent.
const validateSignUp = ({ name, password, confirm }) => {
  if (!name.trim()) return 'Please enter your name.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password))
    return 'Password must include at least one letter and one number.';
  if (password !== confirm) return 'Password and confirm password do not match.';
  return null;
};

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signup';
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const submit = async () => {
    setError('');
    if (isSignUp) {
      const problem = validateSignUp(form);
      if (problem) return setError(problem);
    }
    if (!form.email.trim()) return setError('Please enter your email.');

    setBusy(true);
    try {
      if (isSignUp) {
        await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      } else {
        await signIn({ email: form.email.trim(), password: form.password });
      }
      // Navigation is handled by the auth gate in the root layout.
    } catch (e) {
      setError(e.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Emblem size={56} />
          <Text style={styles.wordmark}>KB_Expense</Text>
          <Text style={styles.eyebrow}>Ledger · Folio Edition</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{isSignUp ? 'Open a Folio' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Create an account to begin recording entries.'
              : 'Sign in to continue to your ledger.'}
          </Text>

          {!!error && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#93000a" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {isSignUp && (
            <Field label="Full Name" icon="account-outline">
              <TextInput
                style={styles.input}
                placeholder="Kavita Banerjee"
                placeholderTextColor={colors.outline}
                value={form.name}
                onChangeText={set('name')}
                autoCapitalize="words"
                autoComplete="name"
              />
            </Field>
          )}

          <Field label="Email Address" icon="email-outline">
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.outline}
              value={form.email}
              onChangeText={set('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </Field>

          <Field label="Password" icon="lock-outline">
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={semantic.textMuted}
              />
            </Pressable>
          </Field>

          {isSignUp && (
            <>
              <Field label="Confirm Password" icon="lock-check-outline">
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.outline}
                  value={form.confirm}
                  onChangeText={set('confirm')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </Field>
              <Text style={styles.hint}>At least 6 characters, with a letter and a number.</Text>
            </>
          )}

          <Pressable onPress={submit} disabled={busy} style={styles.cta}>
            <LinearGradient
              colors={gradients.primaryCta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaInner}
            >
              {busy ? (
                <ActivityIndicator color={semantic.onExpense} />
              ) : (
                <>
                  <Text style={styles.ctaText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={semantic.onExpense} />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              setMode(isSignUp ? 'signin' : 'signup');
              setError('');
            }}
            style={styles.switch}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.switchLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Privacy first · Entries stored to your folio</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <MaterialCommunityIcons name={icon} size={20} color={semantic.textMuted} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.margin, paddingBottom: spacing.xl, gap: spacing.lg },

  brand: { alignItems: 'center', gap: spacing.sm },
  wordmark: { ...typography.headlineLg, color: semantic.textPrimary },
  eyebrow: { ...typography.labelSm, color: semantic.textMuted, textTransform: 'uppercase' },

  card: {
    backgroundColor: semantic.cardBg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  title: { ...typography.headlineMd, color: semantic.textPrimary },
  subtitle: { ...typography.bodySm, color: semantic.textMuted, marginTop: -spacing.sm },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.dangerSurface,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  errorText: { ...typography.bodySm, color: '#93000a', flex: 1 },

  field: { gap: spacing.xs },
  fieldLabel: {
    ...typography.labelSm,
    color: semantic.textMuted,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: semantic.cardBgSubtle,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: { flex: 1, ...typography.bodyMd, color: semantic.textPrimary },
  hint: { ...typography.bodySm, color: semantic.textMuted, marginTop: -spacing.xs },

  cta: { borderRadius: radius.xl, overflow: 'hidden', marginTop: spacing.xs, ...shadows.card },
  ctaInner: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaText: { ...typography.headlineSm, color: semantic.onExpense },

  switch: { alignItems: 'center', paddingTop: spacing.xs },
  switchText: { ...typography.bodySm, color: semantic.textMuted },
  switchLink: { color: semantic.expense, fontFamily: 'DMSans_700Bold' },

  footer: { ...typography.labelSm, color: semantic.textMuted, textAlign: 'center' },
});
