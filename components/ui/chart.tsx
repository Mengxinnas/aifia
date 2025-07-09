import type React from "react"

interface BarChartProps {
  data: { [key: string]: number }[]
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  className?: string
}

export const BarChart: React.FC<BarChartProps> = ({ data, index, categories, colors, valueFormatter, className }) => {
  // Basic implementation - replace with actual charting library integration
  return (
    <div className={className}>
      <h3>Bar Chart</h3>
      <p>(Placeholder - Implement using a charting library like Recharts or Chart.js)</p>
      <pre>{JSON.stringify({ data, index, categories, colors, valueFormatter })}</pre>
    </div>
  )
}

interface LineChartProps {
  data: { [key: string]: number | string }[]
  index: string
  categories: string[]
  colors: string[]
  valueFormatter?: (value: number) => string
  className?: string
}

export const LineChart: React.FC<LineChartProps> = ({ data, index, categories, colors, valueFormatter, className }) => {
  // Basic implementation - replace with actual charting library integration
  return (
    <div className={className}>
      <h3>Line Chart</h3>
      <p>(Placeholder - Implement using a charting library like Recharts or Chart.js)</p>
      <pre>{JSON.stringify({ data, index, categories, colors, valueFormatter })}</pre>
    </div>
  )
}
