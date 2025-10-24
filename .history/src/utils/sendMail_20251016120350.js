import { sendMail as mail } from '../config/mailer.js';
import { eventApplied, eventCreated } from './emailTemplates.js';

export async function sendEventAppliedEmail({ to, userName, event }) {
  const html = eventApplied({
    userName,
    eventTitle: event.title,
    dateStr: new Date(event.startAt).toLocaleString(),
    location: event.location?.name,
  });
  return mail({ to, subject: `Applied: ${event.title}`, html });
}

export async function sendEventCreatedEmail({ to, event }) {
    const html = eventCreated({
      eventTitle: event.title,
      dateStr: new Date(event.startAt).toLocaleString(),
      location: event.location?.name,
    });
    return mail({ to, subject: `Created: ${event.title}`, html });
  }
  
