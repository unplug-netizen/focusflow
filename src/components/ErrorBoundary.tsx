import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryClass extends Component<Props & { theme: any }, State> {
  constructor(props: Props & { theme: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Hier könnte man Error Reporting Service aufrufen (z.B. Sentry, Crashlytics)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { theme } = this.props;

      return (
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Etwas ist schiefgelaufen
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            Es tut uns leid, aber ein unerwarteter Fehler ist aufgetreten.
          </Text>
          {__DEV__ && this.state.error && (
            <View
              style={[
                styles.errorDetails,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {this.state.error.toString()}
              </Text>
            </View>
          )}
          <Button
            title="Erneut versuchen"
            onPress={this.handleReset}
            variant="primary"
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to access theme
export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  const { theme } = useTheme();
  return (
    <ErrorBoundaryClass theme={theme} fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  errorDetails: {
    width: "100%",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  button: {
    minWidth: 200,
  },
});

export default ErrorBoundary;
