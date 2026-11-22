import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, type Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextVariant = 'largeTitle' | 'title' | 'heading' | 'body' | 'small' | 'caption' | 'label';
type Tone = 'default' | 'secondary' | 'primary' | 'danger' | 'success' | 'onPrimary';

const toneColor = (theme: Palette, tone: Tone) =>
  ({
    default: theme.text,
    secondary: theme.textSecondary,
    primary: theme.accent,
    danger: theme.danger,
    success: theme.success,
    onPrimary: theme.onPrimary,
  })[tone];

export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: Tone }) {
  const theme = useTheme();
  return <Text style={[textStyles[variant], { color: toneColor(theme, tone) }, style]} {...rest} />;
}

export function Icon({
  ios,
  md,
  size = 20,
  color,
}: {
  ios: SFSymbol;
  md: AndroidSymbol;
  size?: number;
  color?: string;
}) {
  const theme = useTheme();
  return <SymbolView name={{ ios, android: md, web: md }} size={size} tintColor={color ?? theme.text} />;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  small = false,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const theme = useTheme();
  const colors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: theme.card, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.accent, border: 'transparent' },
    danger: { bg: theme.danger, fg: '#FFFFFF', border: theme.danger },
  };
  const c = colors[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: c.bg, borderColor: c.border, opacity: inactive ? 0.55 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={c.fg} /> : icon}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: c.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: PressableProps['onPress'];
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const base = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.card, borderColor: theme.border },
      ]}>
      <AppText variant="small" tone={selected ? 'onPrimary' : 'default'} style={styles.chipText}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Badge({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.muted }]}>
      <AppText variant="caption" tone="secondary" style={styles.badgeText}>
        {label}
      </AppText>
    </View>
  );
}

export function TextField({
  label,
  hint,
  style,
  multiline,
  ...rest
}: ComponentProps<typeof TextInput> & { label?: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
          style,
        ]}
        {...rest}
      />
      {hint ? (
        <AppText variant="caption" tone="secondary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.checkboxRow}>
      <View
        style={[
          styles.checkbox,
          { borderColor: checked ? theme.primary : theme.border },
          checked && { backgroundColor: theme.primary },
        ]}>
        {checked ? <Icon ios="checkmark" md="check" size={14} color={theme.onPrimary} /> : null}
      </View>
      <View style={styles.checkboxLabel}>{children}</View>
    </Pressable>
  );
}

export function Notice({ tone, children }: { tone: 'info' | 'success' | 'error'; children: ReactNode }) {
  const theme = useTheme();
  const color = tone === 'error' ? theme.danger : tone === 'success' ? theme.success : theme.accent;
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.notice, { borderColor: color, backgroundColor: theme.card }]}>
      <AppText variant="small" style={{ color }}>
        {children}
      </AppText>
    </View>
  );
}

export function LoadingState() {
  const theme = useTheme();
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centered}>
      <AppText tone="secondary" style={styles.centerText}>
        {message}
      </AppText>
      {onRetry ? <Button title="Try again" variant="secondary" small onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <View style={styles.centered}>
      <AppText variant="heading" style={styles.centerText}>
        {title}
      </AppText>
      {message ? (
        <AppText tone="secondary" style={styles.centerText}>
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

/**
 * Large title for tab screens, which have no navigation bar. On iOS the scroll view
 * already insets content below the status bar (`contentInsetAdjustmentBehavior`).
 */
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'ios' ? 0 : insets.top;
  return (
    <View style={[styles.header, { paddingTop: top + Spacing.three }]}>
      <View style={styles.headerRow}>
        <AppText variant="largeTitle" accessibilityRole="header" style={styles.flex}>
          {title}
        </AppText>
        {right}
      </View>
      {subtitle ? (
        <AppText variant="small" tone="secondary">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const textStyles = StyleSheet.create<Record<TextVariant, TextStyle>>({
  largeTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  button: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  buttonSmall: { minHeight: 36, paddingHorizontal: Spacing.three },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextSmall: { fontSize: 14 },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: { fontWeight: '600' },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  badgeText: { fontWeight: '600' },
  field: { gap: Spacing.one },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 120, textAlignVertical: 'top', paddingTop: Spacing.three },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, minHeight: 44 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxLabel: { flex: 1 },
  notice: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five, gap: Spacing.three },
  centerText: { textAlign: 'center' },
  header: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.one },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth },
});
