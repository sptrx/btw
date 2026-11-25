import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  hlsUrl: string | null;
  posterUrl: string | null;
  durationSeconds?: number | null;
  /** True while this card is the one on screen — it plays, the others stay paused. */
  active: boolean;
};

/**
 * Inline short, muted and looping like the feed on X. Sound and fullscreen are
 * one tap away. Falls back to the poster when the video can't be played.
 */
export function ShortVideo({ hlsUrl, posterUrl, durationSeconds, active }: Props) {
  const theme = useTheme();
  const viewRef = useRef<VideoView>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  const player = useVideoPlayer(hlsUrl ?? null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (!hlsUrl || failed) return;
    try {
      if (active) player.play();
      else player.pause();
    } catch {
      // The player is released when the card leaves the list; nothing to do.
    }
  }, [active, failed, hlsUrl, player]);

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error) setFailed(true);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    try {
      // The compiler rule wants mutations inside useVideoPlayer's setup callback, but the
      // sound toggle has to change after creation, and expo-video's player is a mutable
      // native object by design.
      // eslint-disable-next-line react-hooks/immutability
      player.muted = muted;
    } catch {
      // Ignore a released player.
    }
  }, [muted, player]);

  const playable = Boolean(hlsUrl) && !failed;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.muted }]}>
      {playable ? (
        <VideoView
          ref={viewRef}
          player={player}
          style={styles.fill}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture={false}
          accessibilityLabel="Short video"
        />
      ) : posterUrl ? (
        <Image
          source={posterUrl}
          style={styles.fill}
          contentFit="cover"
          accessibilityLabel="Short video thumbnail"
        />
      ) : (
        <View style={[styles.fill, styles.center]}>
          <AppText variant="caption" tone="secondary">
            Video unavailable
          </AppText>
        </View>
      )}

      {playable ? (
        <View style={styles.controls}>
          <Pressable
            onPress={() => setMuted((m) => !m)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Turn sound on' : 'Turn sound off'}
            style={styles.btn}>
            <Icon
              ios={muted ? 'speaker.slash.fill' : 'speaker.wave.2.fill'}
              md={muted ? 'volume_off' : 'volume_up'}
              size={16}
              color="#fff"
            />
          </Pressable>
          <Pressable
            onPress={() => void viewRef.current?.enterFullscreen()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Play fullscreen"
            style={styles.btn}>
            <Icon ios="arrow.up.left.and.arrow.down.right" md="fullscreen" size={16} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      {durationSeconds ? (
        <View style={styles.duration}>
          <AppText variant="caption" style={styles.durationText}>
            {`${Math.round(durationSeconds)}s`}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '62%',
    aspectRatio: 9 / 16,
    maxHeight: 360,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  center: { alignItems: 'center', justifyContent: 'center' },
  controls: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    flexDirection: 'row',
    gap: Spacing.one,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: Spacing.one,
    right: Spacing.one,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  durationText: { color: '#fff' },
});
