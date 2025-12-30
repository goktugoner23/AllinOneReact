import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib';
import {
  getEvents,
  addEvent as addEventService,
  updateEvent as updateEventService,
  deleteEvent as deleteEventService,
} from '@features/calendar/services/events';
import { Event, EventFormData } from '@features/calendar/types/Event';

// Hook for fetching calendar events
export function useCalendarEvents() {
  return useQuery({
    queryKey: queryKeys.calendar.events(),
    queryFn: getEvents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for fetching events for a specific date
export function useEventsForDate(date: string) {
  const { data: events = [], isLoading } = useCalendarEvents();

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date).toISOString().split('T')[0];
    return eventDate === date;
  });

  return { data: filteredEvents, isLoading };
}

// Mutation for adding an event
export function useAddCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: EventFormData) => addEventService(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

// Mutation for updating an event
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: string; eventData: Partial<EventFormData> }) =>
      updateEventService(eventId, eventData),
    onMutate: async ({ eventId, eventData }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar.all });

      const previousEvents = queryClient.getQueryData<Event[]>(queryKeys.calendar.events());

      queryClient.setQueryData<Event[]>(
        queryKeys.calendar.events(),
        (old) => old?.map((e) => (e.id === eventId ? { ...e, ...eventData } : e)) ?? [],
      );

      return { previousEvents };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(queryKeys.calendar.events(), context.previousEvents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

// Mutation for deleting an event
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteEventService(eventId),
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar.all });

      const previousEvents = queryClient.getQueryData<Event[]>(queryKeys.calendar.events());

      queryClient.setQueryData<Event[]>(
        queryKeys.calendar.events(),
        (old) => old?.filter((e) => e.id !== eventId) ?? [],
      );

      return { previousEvents };
    },
    onError: (_err, _eventId, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(queryKeys.calendar.events(), context.previousEvents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

// Hook for getting marked dates for calendar
export function useMarkedDates() {
  const { data: events = [], isLoading } = useCalendarEvents();

  const markedDates: Record<string, { marked: boolean; dotColor: string }> = {};

  events.forEach((event) => {
    const dateKey = new Date(event.date).toISOString().split('T')[0];
    // Determine color based on event type
    let dotColor = '#1E40AF'; // default dark blue
    if (event.type.includes('Registration Start') || event.type === 'registration_start') {
      dotColor = '#4CAF50'; // green
    } else if (event.type.includes('Registration End') || event.type === 'registration_end') {
      dotColor = '#F44336'; // red
    } else if (event.type === 'lesson') {
      dotColor = '#2196F3'; // blue
    } else if (event.type === 'seminar') {
      dotColor = '#FFD700'; // yellow
    }
    markedDates[dateKey] = {
      marked: true,
      dotColor,
    };
  });

  return { data: markedDates, isLoading };
}
