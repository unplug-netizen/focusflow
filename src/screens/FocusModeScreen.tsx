import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Vibration,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../theme/ThemeContext";
import { RootState, AppDispatch } from "../store";
import { Card, Button, Timer } from "../components";
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  tick,
  setTimerMode,
  completeSession,
} from "../store/slices/focusModeSlice";
import { addFocusTime, addFocusCoins } from "../store/slices/statsSlice";
import { FocusSession } from "../types";
import {
  POMODORO_DURATION,
  SHORT_BREAK_DURATION,
  LONG_BREAK_DURATION,
  POMODORO_COMPLETE_COINS,
} from "../constants";

const TIMER_MODES: {
  key: "pomodoro" | "shortBreak" | "longBreak";
  label: string;
  duration: number;
  icon: string;
}[] = [
  {
    key: "pomodoro",
    label: "Pomodoro",
    duration: POMODORO_DURATION,
    icon: "🍅",
  },
  {
    key: "shortBreak",
    label: "Kurze Pause",
    duration: SHORT_BREAK_DURATION,
    icon: "☕",
  },
  {
    key: "longBreak",
    label: "Lange Pause",
    duration: LONG_BREAK_DURATION,
    icon: "🌴",
  },
];

export const FocusModeScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { timer, soundEnabled } = useSelector(
    (state: RootState) => state.focusMode
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Timer tick effect
  useEffect(() => {
    if (timer.status === "running") {
      intervalRef.current = setInterval(() => {
        dispatch(tick());
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.status, dispatch]);

  // Handle timer completion
  useEffect(() => {
    if (timer.status === "completed") {
      handleTimerComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status, timer.timeRemaining]);

  // Pulse animation for running timer
  useEffect(() => {
    if (timer.status === "running") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.status]);

  const handleTimerComplete = () => {
    Vibration.vibrate([0, 500, 200, 500]);

    if (timer.mode === "pomodoro") {
      const session: FocusSession = {
        id: Date.now().toString(),
        startTime: new Date(Date.now() - timer.totalTime * 1000),
        endTime: new Date(),
        duration: timer.totalTime / 60,
        type: "pomodoro",
        completed: true,
        interruptions: 0,
      };
      dispatch(completeSession(session));
      dispatch(addFocusTime(timer.totalTime / 60));
      dispatch(addFocusCoins(POMODORO_COMPLETE_COINS));
    }
  };

  const handleStart = () => {
    dispatch(startTimer());
  };

  const handlePause = () => {
    dispatch(pauseTimer());
  };

  const handleResume = () => {
    dispatch(resumeTimer());
  };

  const handleStop = () => {
    dispatch(stopTimer());
  };

  const handleModeChange = (mode: "pomodoro" | "shortBreak" | "longBreak") => {
    dispatch(setTimerMode(mode));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Fokus Modus
          </Text>
          <TouchableOpacity
            style={[
              styles.soundButton,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => {}}
          >
            <Text style={{ fontSize: 20 }}>{soundEnabled ? "🔊" : "🔇"}</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          {TIMER_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeButton,
                {
                  backgroundColor:
                    timer.mode === mode.key
                      ? theme.colors.primary
                      : theme.colors.surface,
                },
              ]}
              onPress={() => handleModeChange(mode.key)}
            >
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <Text
                style={[
                  styles.modeLabel,
                  {
                    color: timer.mode === mode.key ? "#fff" : theme.colors.text,
                  },
                ]}
              >
                {mode.label}
              </Text>
              <Text
                style={[
                  styles.modeDuration,
                  {
                    color:
                      timer.mode === mode.key
                        ? "rgba(255,255,255,0.8)"
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {mode.duration} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer Display */}
        <Animated.View
          style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <Card style={styles.timerCard} elevation="large">
            <Timer
              timeRemaining={timer.timeRemaining}
              totalTime={timer.totalTime}
              size="large"
              showProgress={true}
              label={
                timer.status === "running"
                  ? "Fokussiert bleiben..."
                  : timer.status === "paused"
                  ? "Pausiert"
                  : timer.status === "completed"
                  ? "Abgeschlossen!"
                  : "Bereit zum Starten"
              }
            />
          </Card>
        </Animated.View>

        {/* Session Counter */}
        <Text
          style={[styles.sessionInfo, { color: theme.colors.textSecondary }]}
        >
          Sitzung {timer.currentSession} von {timer.totalSessions}
        </Text>

        {/* Control Buttons */}
        <View style={styles.controls}>
          {timer.status === "idle" && (
            <Button
              title="Start"
              variant="primary"
              size="large"
              onPress={handleStart}
              style={styles.mainButton}
            />
          )}

          {timer.status === "running" && (
            <>
              <Button
                title="Pause"
                variant="secondary"
                size="large"
                onPress={handlePause}
                style={styles.controlButton}
              />
              <Button
                title="Stop"
                variant="outline"
                size="large"
                onPress={handleStop}
                style={styles.controlButton}
              />
            </>
          )}

          {timer.status === "paused" && (
            <>
              <Button
                title="Weiter"
                variant="primary"
                size="large"
                onPress={handleResume}
                style={styles.controlButton}
              />
              <Button
                title="Stop"
                variant="outline"
                size="large"
                onPress={handleStop}
                style={styles.controlButton}
              />
            </>
          )}

          {timer.status === "completed" && (
            <>
              <Button
                title="Nächste Sitzung"
                variant="primary"
                size="large"
                onPress={() => {
                  dispatch(stopTimer());
                  setTimeout(() => dispatch(startTimer()), 100);
                }}
                style={styles.mainButton}
              />
              <Button
                title="Beenden"
                variant="ghost"
                size="medium"
                onPress={handleStop}
              />
            </>
          )}
        </View>

        {/* Focus Tips */}
        <Card style={styles.tipsCard}>
          <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
            💡 Fokus-Tipp
          </Text>
          <Text
            style={[styles.tipsText, { color: theme.colors.textSecondary }]}
          >
            {timer.mode === "pomodoro"
              ? "Konzentriere dich auf eine einzige Aufgabe. Wenn dich etwas ablenkt, notiere es kurz und widme dich später darum."
              : timer.mode === "shortBreak"
              ? "Stehe auf, streck dich und gönn dir einen kurzen Spaziergang. Dein Gehirn wird es dir danken!"
              : "Nutze die lange Pause für eine ausgiebige Erholung. Vielleicht eine kleine Meditation oder ein Snack?"}
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  soundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  modeDuration: {
    fontSize: 10,
    marginTop: 2,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  timerCard: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 40,
  },
  sessionInfo: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 24,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  mainButton: {
    minWidth: 200,
  },
  controlButton: {
    minWidth: 140,
  },
  tipsCard: {
    marginTop: "auto",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default FocusModeScreen;
