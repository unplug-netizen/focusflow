import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface BarChartProps {
  data: number[];
  labels?: string[];
  maxValue?: number;
  color?: string;
  secondaryColor?: string;
  style?: ViewStyle;
  showValues?: boolean;
  barWidth?: number;
}

// Chart component dimensions can be configured via props

export const BarChart: React.FC<BarChartProps> = ({
  data,
  labels,
  maxValue,
  color,
  secondaryColor,
  style,
  showValues = false,
  barWidth = 24,
}) => {
  const { theme } = useTheme();
  const chartColor = color || theme.colors.primary;
  const chartSecondaryColor = secondaryColor || theme.colors.secondary;
  const max = maxValue || Math.max(...data, 1);
  const defaultLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const chartLabels = labels || defaultLabels.slice(0, data.length);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.chartContainer}>
        {data.map((value, index) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          const isToday = index === data.length - 1;

          return (
            <View key={index} style={styles.barWrapper}>
              {showValues && value > 0 && (
                <Text
                  style={[
                    styles.valueLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {Math.round(value)}
                </Text>
              )}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(height, 4)}%`,
                      backgroundColor: isToday
                        ? chartColor
                        : chartSecondaryColor,
                      width: barWidth,
                      opacity: isToday ? 1 : 0.6,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                {chartLabels[index] || ""}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

interface LineChartProps {
  data: number[];
  labels?: string[];
  maxValue?: number;
  minValue?: number;
  color?: string;
  style?: ViewStyle;
  strokeWidth?: number;
  showDots?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  maxValue,
  minValue,
  color,
  style,
  strokeWidth = 2,
  showDots = true,
}) => {
  const { theme } = useTheme();
  const chartColor = color || theme.colors.primary;
  const max = maxValue !== undefined ? maxValue : Math.max(...data, 1);
  const min = minValue !== undefined ? minValue : Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return { x, y, value };
  });

  // Path data for SVG line chart (reserved for future SVG implementation)
  // const pathD = points...   // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <View style={[styles.lineChartContainer, style]}>
      <View style={styles.lineChartInner}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pos) => (
          <View
            key={pos}
            style={[
              styles.gridLine,
              {
                top: `${pos}%`,
                backgroundColor: theme.colors.border,
              },
            ]}
          />
        ))}

        {/* SVG Line */}
        <View style={styles.svgContainer}>
          <View
            style={[
              styles.linePath,
              {
                borderColor: chartColor,
                borderWidth: strokeWidth,
              },
            ]}
          />
          {showDots &&
            points.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    backgroundColor: chartColor,
                  },
                ]}
              />
            ))}
        </View>
      </View>

      {labels && (
        <View style={styles.labelsContainer}>
          {labels.map((label, index) => (
            <Text
              key={index}
              style={[styles.axisLabel, { color: theme.colors.textSecondary }]}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

interface PieChartProps {
  data: { value: number; color: string; label?: string }[];
  size?: number;
  style?: ViewStyle;
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 120,
  style,
  showLegend = false,
}) => {
  const { theme } = useTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  let currentAngle = 0;
  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      percentage: Math.round((item.value / total) * 100),
    };
  });

  return (
    <View style={[styles.pieContainer, style]}>
      <View
        style={[
          styles.pieChart,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: segments[0]?.color || theme.colors.primary,
          },
        ]}
      >
        {/* Simple pie chart using conic gradient approximation */}
        {segments.length > 1 &&
          segments.map((segment, index) => {
            if (index === 0) {
              return null;
            }
            return (
              <View
                key={index}
                style={[
                  styles.pieSegment,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: segment.color,
                    transform: [{ rotate: `${segment.startAngle}deg` }],
                  },
                ]}
              />
            );
          })}
        {/* Center hole for donut chart effect */}
        <View
          style={[
            styles.pieCenter,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: (size * 0.6) / 2,
              backgroundColor: theme.colors.surface,
            },
          ]}
        />
      </View>

      {showLegend && (
        <View style={styles.legend}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: segment.color }]}
              />
              <Text style={[styles.legendText, { color: theme.colors.text }]}>
                {segment.label} ({segment.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    paddingTop: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  valueLabel: {
    fontSize: 10,
    marginBottom: 4,
  },

  // Line Chart Styles
  lineChartContainer: {
    width: "100%",
    height: 150,
  },
  lineChartInner: {
    flex: 1,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  svgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  linePath: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  axisLabel: {
    fontSize: 10,
  },

  // Pie Chart Styles
  pieContainer: {
    alignItems: "center",
  },
  pieChart: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  pieSegment: {
    position: "absolute",
  },
  pieCenter: {
    position: "absolute",
  },
  legend: {
    marginTop: 16,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
});

export default BarChart;
