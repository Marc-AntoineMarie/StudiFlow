import { BadRequestException } from '@nestjs/common';
import { validerEtNormaliserMission } from './mission-validation';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
// Fixe le "maintenant" des tests pour ne jamais dépendre de la date réelle d'exécution.
const DATE_REF = d('2026-09-02');

describe('validerEtNormaliserMission', () => {
  it('intermittence avec heures : conserve les heures telles quelles', () => {
    const r = validerEtNormaliserMission(
      { type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateDebut: d('2026-01-01'), dateFin: d('2026-01-05'), heures: 24 },
      8,
      DATE_REF,
    );
    expect(r.heures).toBe(24);
    expect(r.montantHT).toBeNull();
    expect(r.nbJours).toBeNull();
  });

  it('intermittence avec nbCachets : convertit en heures et nbCachets prime sur heures', () => {
    const r = validerEtNormaliserMission(
      {
        type: 'INTERMITTENCE',
        statut: 'CONFIRMEE',
        dateDebut: d('2026-01-01'),
        dateFin: d('2026-01-05'),
        heures: 999, // doit être ignoré
        nbCachets: 3,
      },
      8,
      DATE_REF,
    );
    expect(r.heures).toBe(24); // 3 * 8
  });

  it('intermittence sans heures ni cachets : rejetée', () => {
    expect(() =>
      validerEtNormaliserMission(
        { type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateDebut: d('2026-01-01'), dateFin: d('2026-01-05') },
        8,
        DATE_REF,
      ),
    ).toThrow(BadRequestException);
  });

  it('freelance complet : conserve montantHT et nbJours, annule heures/cachets', () => {
    const r = validerEtNormaliserMission(
      {
        type: 'FREELANCE',
        statut: 'CONFIRMEE',
        dateDebut: d('2026-01-01'),
        dateFin: d('2026-01-05'),
        montantHT: 1200,
        nbJours: 3,
      },
      8,
      DATE_REF,
    );
    expect(r.montantHT).toBe(1200);
    expect(r.nbJours).toBe(3);
    expect(r.heures).toBeNull();
    expect(r.nbCachets).toBeNull();
  });

  it('freelance sans montantHT : rejetée', () => {
    expect(() =>
      validerEtNormaliserMission(
        {
          type: 'FREELANCE',
          statut: 'CONFIRMEE',
          dateDebut: d('2026-01-01'),
          dateFin: d('2026-01-05'),
          nbJours: 3,
        },
        8,
        DATE_REF,
      ),
    ).toThrow(BadRequestException);
  });

  it('freelance sans nbJours : rejetée', () => {
    expect(() =>
      validerEtNormaliserMission(
        {
          type: 'FREELANCE',
          statut: 'CONFIRMEE',
          dateDebut: d('2026-01-01'),
          dateFin: d('2026-01-05'),
          montantHT: 500,
        },
        8,
        DATE_REF,
      ),
    ).toThrow(BadRequestException);
  });

  it('dateFin < dateDebut : rejetée quel que soit le type', () => {
    expect(() =>
      validerEtNormaliserMission(
        {
          type: 'FREELANCE',
          statut: 'CONFIRMEE',
          dateDebut: d('2026-01-10'),
          dateFin: d('2026-01-05'),
          montantHT: 500,
          nbJours: 1,
        },
        8,
        DATE_REF,
      ),
    ).toThrow(BadRequestException);
  });

  it("dateFin === dateDebut : acceptée (mission d'un jour)", () => {
    expect(() =>
      validerEtNormaliserMission(
        { type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateDebut: d('2026-01-10'), dateFin: d('2026-01-10'), heures: 8 },
        8,
        DATE_REF,
      ),
    ).not.toThrow();
  });

  it('les chevauchements ne sont pas de son ressort : aucune vérification croisée entre missions', () => {
    // Documentaire : cette fonction ne prend qu'une mission, jamais de comparaison
    // avec d'autres missions. Le chevauchement est autorisé par construction.
    expect(true).toBe(true);
  });

  describe('mission Terminée avec date de fin future', () => {
    it('rejetée : Terminée + dateFin après dateRef', () => {
      expect(() =>
        validerEtNormaliserMission(
          {
            type: 'INTERMITTENCE',
            statut: 'TERMINEE',
            dateDebut: d('2026-09-10'),
            dateFin: d('2026-09-15'), // après DATE_REF (2026-09-02)
            heures: 8,
          },
          8,
          DATE_REF,
        ),
      ).toThrow(BadRequestException);
    });

    it('acceptée : Terminée + dateFin = dateRef (aujourd\'hui même)', () => {
      expect(() =>
        validerEtNormaliserMission(
          { type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: d('2026-09-01'), dateFin: DATE_REF, heures: 8 },
          8,
          DATE_REF,
        ),
      ).not.toThrow();
    });

    it('acceptée : Terminée + dateFin passée', () => {
      expect(() =>
        validerEtNormaliserMission(
          { type: 'INTERMITTENCE', statut: 'TERMINEE', dateDebut: d('2026-01-01'), dateFin: d('2026-01-05'), heures: 8 },
          8,
          DATE_REF,
        ),
      ).not.toThrow();
    });

    it('acceptée : Confirmée + dateFin future (seule Terminée est restreinte)', () => {
      expect(() =>
        validerEtNormaliserMission(
          { type: 'INTERMITTENCE', statut: 'CONFIRMEE', dateDebut: d('2026-09-10'), dateFin: d('2026-09-15'), heures: 8 },
          8,
          DATE_REF,
        ),
      ).not.toThrow();
    });

    it('acceptée : Proposée + dateFin future (seule Terminée est restreinte)', () => {
      expect(() =>
        validerEtNormaliserMission(
          { type: 'INTERMITTENCE', statut: 'PROPOSEE', dateDebut: d('2026-09-10'), dateFin: d('2026-09-15'), heures: 8 },
          8,
          DATE_REF,
        ),
      ).not.toThrow();
    });
  });
});
