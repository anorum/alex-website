/**
 * Utility functions for Flowbite charts (ApexCharts)
 */
import { chartColors } from './chartUtils';

interface BarChartConfig {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (val: number) => string;
  stack?: boolean;
  height?: number;
}

/**
 * Creates a bar chart configuration for ApexCharts
 */
export function createBarChartConfig({
  data,
  index,
  categories,
  colors = Object.values(chartColors).slice(0, categories.length),
  valueFormatter = (val: number) => val.toString(),
  stack = false,
  height = 350
}: BarChartConfig): any {
  // Transform data for ApexCharts
  const series = categories.map(category => ({
    name: category,
    data: data.map(item => item[category])
  }));

  // Get x-axis categories (labels)
  const xAxisCategories = data.map(item => item[index]);

  // Create chart config
  return {
    series,
    height,
    options: {
      chart: {
        type: 'bar',
        stacked: stack,
        toolbar: {
          show: false
        },
        fontFamily: 'Inter, sans-serif',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 2
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: xAxisCategories,
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          },
          formatter: valueFormatter
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: valueFormatter
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        markers: {
          radius: 12
        }
      },
      colors: colors.map(color => {
        // If color is a named color from chartColors, use the hex value
        if (typeof color === 'string' && chartColors[color as keyof typeof chartColors]) {
          return chartColors[color as keyof typeof chartColors];
        }
        return color;
      })
    }
  };
}

interface DonutChartConfig {
  data: any[];
  category: string;
  index: string;
  colors?: string[];
  valueFormatter?: (val: number) => string;
  label?: string;
  height?: number;
}

/**
 * Creates a donut chart configuration for ApexCharts
 */
export function createDonutChartConfig({
  data,
  category,
  index,
  colors = Object.values(chartColors).slice(0, data.length),
  valueFormatter = (val: number) => val.toString(),
  label = 'Total',
  height = 350
}: DonutChartConfig): any {
  // Transform data for ApexCharts
  const series = data.map(item => item[category]);
  const labels = data.map(item => item[index]);

  // Create chart config
  return {
    series,
    height,
    options: {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, sans-serif',
      },
      labels,
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '22px',
                fontFamily: 'Inter, sans-serif',
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                formatter: valueFormatter
              },
              total: {
                show: true,
                label,
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                formatter: function (w: any) {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return valueFormatter(total);
                }
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom',
        fontFamily: 'Inter, sans-serif',
      },
      tooltip: {
        y: {
          formatter: valueFormatter
        }
      },
      colors: colors.map(color => {
        // If color is a named color from chartColors, use the hex value
        if (typeof color === 'string' && chartColors[color as keyof typeof chartColors]) {
          return chartColors[color as keyof typeof chartColors];
        }
        return color;
      })
    }
  };
}

interface BarListConfig {
  data: { name: string; value: number }[];
  valueFormatter?: (val: number) => string;
  color?: string;
  height?: number;
}

/**
 * Creates a bar list configuration for a simple vertical bar list
 */
export function createBarListConfig({
  data,
  valueFormatter = (val: number) => val.toString(),
  color = chartColors.orange,
  height = 350
}: BarListConfig): any {
  // Transform data for ApexCharts
  const series = [{
    name: 'Value',
    data: data.map(item => item.value)
  }];
  
  // Get x-axis categories (labels)
  const xAxisCategories = data.map(item => item.name);
  
  // Find the maximum value for calculating percentages
  const maxValue = Math.max(...data.map(item => item.value));

  // Create chart config
  return {
    series,
    height,
    options: {
      chart: {
        type: 'bar',
        toolbar: {
          show: false
        },
        fontFamily: 'Inter, sans-serif',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '80%',
          borderRadius: 2,
          distributed: true,
          dataLabels: {
            position: 'bottom'
          }
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: 'start',
        style: {
          colors: ['#fff']
        },
        formatter: function (val: number) {
          return valueFormatter(val);
        },
        offsetX: 0
      },
      stroke: {
        width: 0
      },
      xaxis: {
        categories: xAxisCategories,
        labels: {
          show: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          }
        }
      },
      tooltip: {
        y: {
          formatter: valueFormatter
        }
      },
      legend: {
        show: false
      },
      colors: [typeof color === 'string' && chartColors[color as keyof typeof chartColors] ? chartColors[color as keyof typeof chartColors] : color]
    }
  };
}
