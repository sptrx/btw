import { useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppChrome } from '@/components/app-chrome';
import { AppText, Button, Chip, Notice } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { askBible } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'What does the Bible say about anxiety?',
  'Explain John 3:16',
  'How can I grow in faith?',
  'What is grace?',
];

export default function AskScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || thinking) return;
    const history = messages;
    setMessages([...history, { role: 'user', content: question }]);
    setInput('');
    setError(null);
    setThinking(true);
    try {
      const answer = await askBible(question, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer.response }]);
      if (typeof answer.remaining === 'number') setRemaining(answer.remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get an answer.');
    } finally {
      setThinking(false);
    }
  }

  return (
    <AppChrome>
      <KeyboardAvoidingView
        style={[styles.fill, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          <View style={styles.titleBlock}>
            <AppText variant="title">Bible Q&A</AppText>
            <AppText variant="small" tone="secondary">
              Questions about the Bible, answered with Scripture
            </AppText>
          </View>
          <View style={styles.thread}>
            {messages.length === 0 ? (
              <View style={styles.suggestions}>
                <AppText variant="caption" tone="secondary">
                  Try asking
                </AppText>
                {SUGGESTIONS.map((s) => (
                  <Chip key={s} label={s} onPress={() => send(s)} />
                ))}
              </View>
            ) : null}

            {messages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  m.role === 'user'
                    ? [
                        styles.userBubble,
                        { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                      ]
                    : [
                        styles.answerBubble,
                        { backgroundColor: theme.muted, borderColor: theme.border },
                      ],
                ]}>
                <AppText selectable>{m.content}</AppText>
              </View>
            ))}

            {thinking ? <ActivityIndicator color={theme.accent} style={styles.thinking} /> : null}
            {error ? <Notice tone="error">{error}</Notice> : null}
            {remaining !== null ? (
              <AppText variant="caption" tone="secondary">
                {remaining} {remaining === 1 ? 'question' : 'questions'} left today
                {session ? '' : '. Sign in to ask more.'}
              </AppText>
            ) : null}
            <AppText variant="caption" tone="secondary">
              Answers are AI-generated. Check them against Scripture and talk with your church community.
            </AppText>
          </View>
        </ScrollView>

        <SafeAreaView
          edges={['bottom']}
          style={[styles.composer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question about the Bible"
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={2000}
            accessibilityLabel="Your question"
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.muted, borderColor: theme.border },
            ]}
          />
          <Button title="Ask" small onPress={() => send(input)} disabled={!input.trim() || thinking} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingBottom: Spacing.four },
  titleBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  thread: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  suggestions: { gap: Spacing.two, alignItems: 'flex-start' },
  bubble: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    maxWidth: '92%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: Radius.sm },
  answerBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: Radius.sm },
  thinking: { alignSelf: 'flex-start' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
});
