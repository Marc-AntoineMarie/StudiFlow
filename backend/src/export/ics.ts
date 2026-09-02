/**
 * Génération du calendrier .ics (module différenciant). Fonction pure, testée
 * seule — pas de dépendance à une lib ICS externe, le format est simple.
 */
export interface MissionExportICS {
  id: number;
  titre: string;
  clientOuProduction: string;
  type: string;
  statut: string;
  dateDebut: Date;
  dateFin: Date;
}

function formatDateICS(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const jour = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${jour}`;
}

/** DTEND d'un événement journée-entière est exclusif dans la RFC 5545. */
function lendemain(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
}

function echapperTexteICS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function genererICS(missions: MissionExportICS[], dateGeneration: Date = new Date()): string {
  const horodatage = `${formatDateICS(dateGeneration)}T000000Z`;

  const lignes: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cadre//Missions//FR', 'CALSCALE:GREGORIAN'];

  for (const m of missions) {
    lignes.push(
      'BEGIN:VEVENT',
      `UID:mission-${m.id}@cadre.local`,
      `DTSTAMP:${horodatage}`,
      `DTSTART;VALUE=DATE:${formatDateICS(m.dateDebut)}`,
      `DTEND;VALUE=DATE:${formatDateICS(lendemain(m.dateFin))}`,
      `SUMMARY:${echapperTexteICS(m.titre)}`,
      `DESCRIPTION:${echapperTexteICS(`${m.clientOuProduction} — ${m.type} — ${m.statut}`)}`,
      'END:VEVENT',
    );
  }

  lignes.push('END:VCALENDAR');
  return lignes.join('\r\n');
}
