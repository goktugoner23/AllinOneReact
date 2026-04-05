/**
 * Calendar events service — REST client against huginn-external `/api/calendar`.
 *
 * Mobile `Event` uses `Date` objects and string ids; backend returns ISO strings
 * and numeric ids. We coerce at the boundary. Exported names and signatures are
 * preserved so screens/stores don't need changes.
 */

import { api } from '@shared/services/api/httpClient';
import { Event, EventFormData } from '@features/calendar/types/Event';
import { logger } from '@shared/utils/logger';

// ── Backend DTO (snake_case, ISO strings, numeric id) ──────────────

interface BackendEvent {
  id: number;
  title: string;
  description: string | null;
  date: string;
  end_date: string | null;
  type: string;
}

interface EventPayload {
  title: string;
  description: string | null;
  date: string;
  end_date: string | null;
  type: string;
}

// ── Mappers ─────────────────────────────────────────────────────────

const fromBackendEvent = (row: BackendEvent): Event => ({
  id: String(row.id),
  title: row.title ?? '',
  description: row.description ?? undefined,
  date: new Date(row.date),
  endDate: row.end_date ? new Date(row.end_date) : undefined,
  type: row.type || 'Event',
});

const toEventPayload = (data: EventFormData): EventPayload => ({
  title: data.title,
  description: data.description ?? null,
  date: data.date.toISOString(),
  end_date: data.endDate ? data.endDate.toISOString() : null,
  type: data.type || 'Event',
});

const toPartialPayload = (
  data: Partial<EventFormData>
): Partial<EventPayload> => {
  const out: Partial<EventPayload> = {};
  if (data.title !== undefined) out.title = data.title;
  if (data.description !== undefined) out.description = data.description ?? null;
  if (data.date !== undefined) out.date = data.date.toISOString();
  if (data.endDate !== undefined)
    out.end_date = data.endDate ? data.endDate.toISOString() : null;
  if (data.type !== undefined) out.type = data.type;
  return out;
};

// ── Queries ─────────────────────────────────────────────────────────

export const getEvents = async (): Promise<Event[]> => {
  try {
    const rows = await api.get<BackendEvent[]>('/api/calendar');
    const events = (rows ?? []).map(fromBackendEvent);
    logger.info(`Fetched ${events.length} events from huginn-external`);
    return events;
  } catch (error) {
    logger.error('Error fetching events:', error);
    throw error;
  }
};

// ── Mutations ───────────────────────────────────────────────────────

export const addEvent = async (eventData: EventFormData): Promise<Event> => {
  try {
    const row = await api.post<BackendEvent>('/api/calendar', toEventPayload(eventData));
    logger.info(`Added new event: ${eventData.title}`);
    return fromBackendEvent(row);
  } catch (error) {
    logger.error('Error adding event:', error);
    throw error;
  }
};

export const updateEvent = async (
  eventId: string,
  eventData: Partial<EventFormData>
): Promise<void> => {
  try {
    await api.put<BackendEvent>(
      `/api/calendar/${Number(eventId)}`,
      toPartialPayload(eventData)
    );
    logger.info(`Updated event: ${eventId}`);
  } catch (error) {
    logger.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await api.delete<{ id: number }>(`/api/calendar/${Number(eventId)}`);
    logger.info(`Deleted event: ${eventId}`);
  } catch (error) {
    logger.error('Error deleting event:', error);
    throw error;
  }
};

// Get events for a specific date range. The backend only exposes a month
// filter, so for arbitrary ranges we fetch all events and filter client-side.
// This matches the previous Firestore behavior and keeps the signature stable.
export const getEventsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Event[]> => {
  try {
    const all = await getEvents();
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const filtered = all
      .filter((e) => {
        const t = e.date.getTime();
        return t >= startMs && t <= endMs;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    logger.info(`Filtered ${filtered.length} events for date range`);
    return filtered;
  } catch (error) {
    logger.error('Error fetching events for date range:', error);
    throw error;
  }
};
