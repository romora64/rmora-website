import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={es}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-3',
        month_caption: 'flex justify-center items-center relative h-8',
        caption_label: 'text-sm font-medium capitalize text-foreground',
        nav: 'flex items-center gap-1 absolute inset-x-0 top-0 justify-between',
        button_previous: cn(
          'h-7 w-7 flex items-center justify-center border border-border text-muted-foreground',
          'hover:bg-accent/20 hover:text-foreground transition-colors',
        ),
        button_next: cn(
          'h-7 w-7 flex items-center justify-center border border-border text-muted-foreground',
          'hover:bg-accent/20 hover:text-foreground transition-colors',
        ),
        chevron: 'h-4 w-4',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex mb-1',
        weekday: 'text-muted-foreground text-[0.75rem] font-normal w-9 text-center',
        weeks: '',
        week: 'flex mt-1',
        day: 'relative w-9 h-9 text-center text-sm p-0 focus-within:relative focus-within:z-20',
        day_button: cn(
          'w-9 h-9 flex items-center justify-center text-sm font-normal transition-colors',
          'hover:bg-accent/20 hover:text-foreground',
          'focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1',
        ),
        today: '[&>button]:font-semibold [&>button]:text-primary',
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90',
        outside: '[&>button]:text-muted-foreground/40 [&>button]:hover:bg-transparent',
        disabled: '[&>button]:text-muted-foreground/30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
