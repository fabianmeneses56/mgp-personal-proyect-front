import { WeightHistoryEntry } from "@/core/weight-history/interfaces/weight-history.interface";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface WeightChartPoint {
  value: number;
  date: string;
  note?: string;
}

interface WeightProgressChartProps {
  entries: WeightHistoryEntry[];
  variant: "compact" | "full";
}

function toChartPoints(entries: WeightHistoryEntry[]): WeightChartPoint[] {
  return [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
      value: entry.weightKg,
      date: entry.date,
      note: entry.note,
    }));
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
  });
}

function TooltipLabel({
  point,
  textColor,
  surfaceColor,
  borderColor,
}: {
  point: WeightChartPoint;
  textColor: string;
  surfaceColor: string;
  borderColor: string;
}) {
  return (
    <View
      style={[
        styles.tooltip,
        { backgroundColor: surfaceColor, borderColor },
      ]}
    >
      <Text style={[styles.tooltipWeight, { color: textColor }]}>
        {point.value} kg
      </Text>
      <Text style={[styles.tooltipDate, { color: textColor }]}>
        {new Date(point.date).toLocaleDateString()}
      </Text>
      {point.note ? (
        <Text style={[styles.tooltipNote, { color: textColor }]}>
          {point.note}
        </Text>
      ) : null}
    </View>
  );
}

export function WeightProgressChart({
  entries,
  variant,
}: WeightProgressChartProps) {
  const primaryColor = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const textColor = useThemeColor({}, "text");
  const faintText = useThemeColor({}, "textFaint");

  const points = toChartPoints(entries);
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);

  if (variant === "compact") {
    return (
      <LineChart
        data={points}
        height={80}
        curved
        areaChart
        color={primaryColor}
        startFillColor={primaryColor}
        endFillColor={primaryColor}
        startOpacity={0.3}
        endOpacity={0}
        thickness={2.5}
        hideDataPoints
        hideAxesAndRules
        hideYAxisText
        yAxisOffset={minValue > 2 ? minValue - 2 : 0}
        disableScroll
        adjustToWidth
        initialSpacing={0}
        endSpacing={0}
      />
    );
  }

  return (
    <LineChart
      data={points.map((point) => ({
        ...point,
        label: formatShortDate(point.date),
      }))}
      height={260}
      curved
      areaChart
      color={primaryColor}
      startFillColor={primaryColor}
      endFillColor={primaryColor}
      startOpacity={0.25}
      endOpacity={0}
      thickness={2.5}
      dataPointsColor={primaryColor}
      yAxisTextStyle={{ color: faintText, fontFamily: Fonts.medium, fontSize: 11 }}
      xAxisLabelTextStyle={{ color: faintText, fontFamily: Fonts.medium, fontSize: 11 }}
      xAxisColor={borderColor}
      yAxisColor={borderColor}
      rulesColor={borderColor}
      yAxisOffset={minValue > 2 ? minValue - 2 : 0}
      yAxisLabelSuffix=" kg"
      showScrollIndicator
      pointerConfig={{
        pointerColor: primaryColor,
        pointerStripColor: primarySoft,
        pointerStripWidth: 2,
        radius: 5,
        pointerLabelWidth: 140,
        pointerLabelHeight: 76,
        activatePointersOnLongPress: false,
        autoAdjustPointerLabelPosition: true,
        pointerLabelComponent: (items: WeightChartPoint[]) => (
          <TooltipLabel
            point={items[0]}
            textColor={textColor}
            surfaceColor={surfaceColor}
            borderColor={borderColor}
          />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  tooltip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  tooltipWeight: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  tooltipDate: {
    fontFamily: Fonts.medium,
    fontSize: 11.5,
  },
  tooltipNote: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    maxWidth: 120,
  },
});
