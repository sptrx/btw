import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { AppText, Checkbox } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { config } from '@/lib/config';

export function openSitePage(path: string) {
  return WebBrowser.openBrowserAsync(`${config.siteUrl}${path}`);
}

function SiteLink({ path, children }: { path: string; children: string }) {
  return (
    <AppText variant="small" tone="primary" onPress={() => openSitePage(path)} accessibilityRole="link">
      {children}
    </AppText>
  );
}

/**
 * First-time submitters must agree to the content disclaimer (the server rejects the
 * submission otherwise). Once accepted it's stored on the profile.
 */
export function ContentDisclaimer({
  accepted,
  checked,
  onChange,
  compact = false,
}: {
  accepted: boolean;
  checked: boolean;
  onChange: (next: boolean) => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  if (accepted) {
    return (
      <AppText variant="caption" tone="secondary">
        You previously agreed to the <SiteLink path="/legal/content-disclaimer">content disclaimer</SiteLink>.
      </AppText>
    );
  }
  return (
    <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.muted }]}>
      <AppText variant="small" tone="secondary">
        {compact
          ? 'Comments are public. You are responsible for what you post. '
          : 'By publishing, you confirm you have the right to share this, that it is respectful and lawful, and that it fits our community purpose (testimony and encouragement). Content is AI-moderated and may be held for review. See our '}
        {compact ? null : (
          <>
            <SiteLink path="/legal/community-guidelines">community guidelines</SiteLink>
            {' and '}
          </>
        )}
        <SiteLink path="/legal/content-disclaimer">content disclaimer</SiteLink>.
      </AppText>
      <Checkbox checked={checked} onChange={onChange}>
        <AppText variant="small">I have read and agree to the content disclaimer for this submission.</AppText>
      </Checkbox>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.two },
});
