import { getDb } from '@shared/services/firebase/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { Event, EventFormData } from '@features/calendar/types/Event';
import { dateToTimestamp, timestampToDate, getDocData } from '@shared/services/firebase/firebase';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';
import { logger } from '@shared/utils/logger';

const EVENTS_COLLECTION = 'events';

// Get all events from Firebase
export const getEvents = async (): Promise<Event[]> => {
  try {
    const eventsQuery = query(
      collection(getDb(), EVENTS_COLLECTION),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(eventsQuery);
    const events: Event[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const event: Event = {
        id: data.id || doc.id,
        title: data.title || '',
        description: data.description,
        date: timestampToDate(data.date),
        endDate: data.endDate ? timestampToDate(data.endDate) : undefined,
        type: data.type || 'Event',
      };
      events.push(event);
    });

    logger.info(`Fetched ${events.length} events from Firebase`);
    return events;
  } catch (error) {
    logger.error('Error fetching events:', error);
    throw error;
  }
};

// Add a new event to Firebase
export const addEvent = async (eventData: EventFormData): Promise<Event> => {
  try {
    const eventId = await firebaseIdManager.getNextId('events');

    const eventDoc = {
      id: eventId,
      title: eventData.title,
      description: eventData.description,
      date: dateToTimestamp(eventData.date),
      endDate: eventData.endDate ? dateToTimestamp(eventData.endDate) : null,
      type: eventData.type || 'Event',
    };

    await addDoc(collection(getDb(), EVENTS_COLLECTION), eventDoc);

    const newEvent: Event = {
      id: eventId.toString(),
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      endDate: eventData.endDate,
      type: eventData.type || 'Event',
    };

    logger.info(`Added new event: ${eventData.title}`);
    return newEvent;
  } catch (error) {
    logger.error('Error adding event:', error);
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (eventId: string, eventData: Partial<EventFormData>): Promise<void> => {
  try {
    const eventsQuery = query(
      collection(getDb(), EVENTS_COLLECTION),
      where('id', '==', eventId)
    );

    const querySnapshot = await getDocs(eventsQuery);
    if (querySnapshot.empty) {
      throw new Error('Event not found');
    }

    const docRef = doc(getDb(), EVENTS_COLLECTION, querySnapshot.docs[0].id);
    const updateData: any = {};

    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.date !== undefined) updateData.date = dateToTimestamp(eventData.date);
    if (eventData.endDate !== undefined) updateData.endDate = eventData.endDate ? dateToTimestamp(eventData.endDate) : null;
    if (eventData.type !== undefined) updateData.type = eventData.type;

    await updateDoc(docRef, updateData);
    logger.info(`Updated event: ${eventId}`);
  } catch (error) {
    logger.error('Error updating event:', error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const eventsQuery = query(
      collection(getDb(), EVENTS_COLLECTION),
      where('id', '==', eventId)
    );

    const querySnapshot = await getDocs(eventsQuery);
    if (querySnapshot.empty) {
      throw new Error('Event not found');
    }

    const docRef = doc(getDb(), EVENTS_COLLECTION, querySnapshot.docs[0].id);
    await deleteDoc(docRef);
    logger.info(`Deleted event: ${eventId}`);
  } catch (error) {
    logger.error('Error deleting event:', error);
    throw error;
  }
};

// Get events for a specific date range
export const getEventsForDateRange = async (startDate: Date, endDate: Date): Promise<Event[]> => {
  try {
    const eventsQuery = query(
      collection(getDb(), EVENTS_COLLECTION),
      where('date', '>=', dateToTimestamp(startDate)),
      where('date', '<=', dateToTimestamp(endDate)),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(eventsQuery);
    const events: Event[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const event: Event = {
        id: data.id || doc.id,
        title: data.title || '',
        description: data.description,
        date: timestampToDate(data.date),
        endDate: data.endDate ? timestampToDate(data.endDate) : undefined,
        type: data.type || 'Event',
      };
      events.push(event);
    });

    logger.info(`Fetched ${events.length} events for date range`);
    return events;
  } catch (error) {
    logger.error('Error fetching events for date range:', error);
    throw error;
  }
}; 