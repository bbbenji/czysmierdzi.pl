<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-[280px] justify-start text-left font-normal',
            !isDateRangeSelected && 'text-muted-foreground'
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ displayDateRange || "Pick a date" }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto">
      <RangeCalendar
        v-model="value"
        initial-focus
        :number-of-months="2"
        @update:start-value="updateStartDate"
        @update:end-value="updateEndDate"
      />
      <div class="flex pt-4 border-t items-end justify-end gap-4">
        <Button variant="link" class="m-0" @click="handleCancel">Cancel</Button>
        <Button variant="primary" class="m-0" @click="handleApply"
          >Apply</Button
        >
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { defineEmits, ref, computed, Ref } from "vue";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";

import { subDays } from "date-fns";

import { Calendar as CalendarIcon } from "lucide-vue-next";
import type { DateRange } from "radix-vue";
import { RangeCalendar } from "@/components/ui/range-calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const emit = defineEmits<{
  (
    e: "update:dateRange",
    payload: { startDate: string; endDate: string }
  ): void;
}>();

const df = new DateFormatter("pl-PL", {
  dateStyle: "medium",
});

const isOpen = ref(false);

const toCalendarDate = (date: Date): CalendarDate => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
};

const today = new Date();
const sevenDaysAgo = subDays(today, 7);

const value = ref<DateRange>({
  start: toCalendarDate(sevenDaysAgo),
  end: toCalendarDate(today),
});

const formattedStartDate = computed(() =>
  value.value.start
    ? df.format(value.value.start.toDate(getLocalTimeZone()))
    : ""
);

const formattedEndDate = computed(() =>
  value.value.end ? df.format(value.value.end.toDate(getLocalTimeZone())) : ""
);

const isDateRangeSelected = computed(
  () => value.value.start !== null && value.value.end !== null
);

const displayDateRange = computed(() => {
  if (isDateRangeSelected.value) {
    if (formattedEndDate.value) {
      return `${formattedStartDate.value} - ${formattedEndDate.value}`;
    }
    return formattedStartDate.value;
  }
  return "";
});

const setStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const setEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

const handleApply = () => {
  if (isDateRangeSelected.value) {
    const start = value.value.start?.toDate(getLocalTimeZone());
    const end = value.value.end?.toDate(getLocalTimeZone());

    emit("update:dateRange", {
      startDate: start ? setStartOfDay(start).toISOString() : "",
      endDate: end ? setEndOfDay(end).toISOString() : "",
    });
  }
  isOpen.value = false;
};

const handleCancel = () => {
  value.value = {
    start: toCalendarDate(sevenDaysAgo),
    end: toCalendarDate(today),
  };
  isOpen.value = false;
};

const updateStartDate = (startDate: CalendarDate) => {
  value.value.start = startDate;
};

const updateEndDate = (endDate: CalendarDate) => {
  value.value.end = endDate;
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
