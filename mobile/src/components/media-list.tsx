import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { Button, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MediaItem } from '@/lib/types';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)(\?|#|$)/i;

export function isImage(item: MediaItem) {
  return item.type.startsWith('image') || IMAGE_EXT.test(item.url);
}

function mediaLabel(item: MediaItem) {
  if (/youtu\.?be/i.test(item.url)) return 'Watch on YouTube';
  if (item.type.startsWith('video') || /\.(mp4|webm|mov)(\?|#|$)/i.test(item.url)) return 'Play video';
  if (item.type.startsWith('audio') || /\.(mp3|m4a|wav)(\?|#|$)/i.test(item.url)) return 'Listen';
  return 'Open link';
}

export function MediaList({ items }: { items: MediaItem[] }) {
  const theme = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={styles.list}>
      {items.map((item, i) =>
        isImage(item) ? (
          <Image
            key={`${item.url}-${i}`}
            source={item.url}
            style={[styles.image, { backgroundColor: theme.muted }]}
            contentFit="cover"
            accessibilityLabel="Post image"
          />
        ) : (
          <Button
            key={`${item.url}-${i}`}
            title={mediaLabel(item)}
            variant="secondary"
            icon={<Icon ios="play.circle" md="play_circle" color={theme.accent} />}
            onPress={() => WebBrowser.openBrowserAsync(item.url)}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.md },
});
