import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  calculateAgeInYear,
  calculatePaymentStatus,
} from '../utils/payment'

describe('Tier 4 - Real-World Application Scenarios', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // =========================================================================
  // Scenario 1: Full Annual Tesseramento Session (Physical Booklet Campaign)
  // =========================================================================
  it('executes a complete annual tesseramento session: new socio registration -> batch receipt -> booklet cash tally -> renewal list -> card generation', () => {
    const CAMPAIGN_YEAR = 2026
    const BOOKLET_NUMBER = 5

    // In-memory mock tables
    const sociTable = []
    const tesseramentiTable = []
    const blocchettiTable = [
      {
        id: BOOKLET_NUMBER,
        numero_blocchetto: BOOKLET_NUMBER,
        ricevute_da: (BOOKLET_NUMBER - 1) * 10 + 1, // 41
        ricevute_a: BOOKLET_NUMBER * 10, // 50
        assegnato_a: 'Capodieci S. Agostino',
      },
    ]

    // Pre-populate existing members
    sociTable.push(
      {
        id: 1,
        cognome: 'Santantoniari',
        nome: 'Marco',
        data_nascita: '1980-02-10',
        gruppo_appartenenza: 'PADULE',
        data_prima_iscrizione: 2015,
      },
      {
        id: 2,
        cognome: 'Ghirga',
        nome: 'Alessandro',
        data_nascita: '1990-07-22',
        gruppo_appartenenza: 'INTERNA',
        data_prima_iscrizione: 2018,
      },
    )

    // Pre-populate 2025 payments for existing members
    tesseramentiTable.push(
      { id_tesseramento: 'tess-1', id_socio: 1, anno: 2025, quota_pagata: 10.0 },
      { id_tesseramento: 'tess-2', id_socio: 2, anno: 2025, quota_pagata: 10.0 },
    )

    // STEP 1: Slot 1 / Receipt 41 - Multi-socio with inline new member
    const receipt41Number = (BOOKLET_NUMBER - 1) * 10 + 1 // 41
    expect(receipt41Number).toBe(41)

    // Inline new member registration
    const newMember = {
      id: 3,
      cognome: 'Santantoniari',
      nome: 'Roberto',
      data_nascita: '1994-06-15',
      gruppo_appartenenza: 'PADULE',
      data_prima_iscrizione: CAMPAIGN_YEAR,
    }
    sociTable.push(newMember)

    // Minor child registration
    const minorChild = {
      id: 4,
      cognome: 'Santantoniari',
      nome: 'Sara',
      data_nascita: '2012-11-04', // Age in 2026: 14 (exempt)
      gruppo_appartenenza: 'PADULE',
      data_prima_iscrizione: CAMPAIGN_YEAR,
    }
    sociTable.push(minorChild)

    // Attach payments to Receipt 41
    const receipt41Payments = [
      // New member: 25€ quota
      {
        id_tesseramento: 'tess-41-1',
        id_socio: newMember.id,
        anno: CAMPAIGN_YEAR,
        quota_pagata: 25.0,
        numero_ricevuta: 41,
        numero_blocchetto: BOOKLET_NUMBER,
      },
      // Existing member Marco: 10€ quota
      {
        id_tesseramento: 'tess-41-2',
        id_socio: 1,
        anno: CAMPAIGN_YEAR,
        quota_pagata: 10.0,
        numero_ricevuta: 41,
        numero_blocchetto: BOOKLET_NUMBER,
      },
      // Minor child Sara: 0€ quota (exempt)
      {
        id_tesseramento: 'tess-41-3',
        id_socio: minorChild.id,
        anno: CAMPAIGN_YEAR,
        quota_pagata: 0.0,
        numero_ricevuta: 41,
        numero_blocchetto: BOOKLET_NUMBER,
      },
    ]
    tesseramentiTable.push(...receipt41Payments)

    const receipt41Subtotal = receipt41Payments.reduce((sum, p) => sum + p.quota_pagata, 0)
    expect(receipt41Subtotal).toBe(35.0)

    // STEP 2: Slot 2 / Receipt 42 - Single member renewal
    const receipt42Payment = {
      id_tesseramento: 'tess-42-1',
      id_socio: 2,
      anno: CAMPAIGN_YEAR,
      quota_pagata: 10.0,
      numero_ricevuta: 42,
      numero_blocchetto: BOOKLET_NUMBER,
    }
    tesseramentiTable.push(receipt42Payment)

    // STEP 3: Slots 3..10 (Receipts 43..50) - Standard renewals (10€ each)
    for (let slot = 3; slot <= 10; slot++) {
      const rNum = (BOOKLET_NUMBER - 1) * 10 + slot
      const socioId = 10 + slot
      sociTable.push({
        id: socioId,
        cognome: `Ceraiolo_${slot}`,
        nome: `Nome_${slot}`,
        data_nascita: '1985-01-01',
        gruppo_appartenenza: slot % 2 === 0 ? 'PADULE' : 'INTERNA',
        data_prima_iscrizione: 2020,
      })
      tesseramentiTable.push({
        id_tesseramento: `tess-${rNum}-1`,
        id_socio: socioId,
        anno: CAMPAIGN_YEAR,
        quota_pagata: 10.0,
        numero_ricevuta: rNum,
        numero_blocchetto: BOOKLET_NUMBER,
      })
    }

    // STEP 4: Verify Live Booklet Cash Total
    const bookletPayments = tesseramentiTable.filter(
      (p) => p.numero_blocchetto === BOOKLET_NUMBER && p.anno === CAMPAIGN_YEAR,
    )
    const bookletCashTotal = bookletPayments.reduce((sum, p) => sum + p.quota_pagata, 0)

    // Expected: Receipt 41 (35€) + Receipt 42 (10€) + 8 receipts x 10€ (80€) = 125.0€
    expect(bookletCashTotal).toBe(125.0)

    // STEP 5: Generate Booklet Summary Data
    const usedReceiptsCount = new Set(bookletPayments.map((p) => p.numero_ricevuta)).size
    expect(usedReceiptsCount).toBe(10) // All 10 slots filled!

    const bookletAuditReport = {
      numero_blocchetto: BOOKLET_NUMBER,
      assegnato_a: blocchettiTable[0].assegnato_a,
      ricevute_utilizzate: `${usedReceiptsCount} / 10`,
      totale_incassato: `€ ${bookletCashTotal.toFixed(2)}`,
    }
    expect(bookletAuditReport.totale_incassato).toBe('€ 125.00')

    // STEP 6: Generate Annual Renewal List & Verify Condono Status
    const renewalRows = sociTable.map((socio) => {
      const paidYears = tesseramentiTable
        .filter((t) => t.id_socio === socio.id)
        .map((t) => t.anno)
      const status = calculatePaymentStatus(socio, paidYears, CAMPAIGN_YEAR)
      return {
        socio: `${socio.cognome} ${socio.nome}`,
        inRegola: status.inRegola,
        arretrati: status.arretrati,
      }
    })

    // All registered soci in this session paid 2026 (or are exempt), so all must be in regola!
    expect(renewalRows.every((r) => r.inRegola)).toBe(true)

    // STEP 7: Generate Membership Cards Sorted by Manicchia (Territorial Mazzetti)
    const cardsToPrint = sociTable.map((socio) => {
      const [y, m, d] = socio.data_nascita.split('-')
      const mesi = [
        'Gennaio',
        'Febbraio',
        'Marzo',
        'Aprile',
        'Maggio',
        'Giugno',
        'Luglio',
        'Agosto',
        'Settembre',
        'Ottobre',
        'Novembre',
        'Dicembre',
      ]
      return {
        nomeCognome: `${socio.nome.toUpperCase()} ${socio.cognome.toUpperCase()}`,
        dataNascitaFormattata: `${parseInt(d, 10)} ${mesi[parseInt(m, 10) - 1]} ${y}`,
        gruppo: socio.gruppo_appartenenza,
        cognome: socio.cognome,
      }
    })

    // Sort primarily by Manicchia, secondarily A-Z by surname
    cardsToPrint.sort((a, b) => {
      const gCmp = a.gruppo.localeCompare(b.gruppo)
      if (gCmp !== 0) return gCmp
      return a.cognome.localeCompare(b.cognome)
    })

    // Grouping verification: All INTERNA come before all PADULE
    const firstPaduleIndex = cardsToPrint.findIndex((c) => c.gruppo === 'PADULE')
    const lastInternaIndex = cardsToPrint
      .map((c) => c.gruppo)
      .lastIndexOf('INTERNA')

    expect(lastInternaIndex).toBeLessThan(firstPaduleIndex)

    // Verify Italian birthdate formatting on cards
    expect(
      cardsToPrint.find((c) => c.nomeCognome === 'ROBERTO SANTANTONIARI')?.dataNascitaFormattata,
    ).toBe('15 Giugno 1994')
  })

  // =========================================================================
  // Scenario 2: Churn Recovery & Electoral Audit Campaign
  // =========================================================================
  it('executes churn recovery workflow: detects inactive members -> generates churn report -> applies retroactive condono on payment', () => {
    const CURRENT_YEAR = 2026
    const PREVIOUS_YEAR = 2025

    const socio = {
      id: 50,
      cognome: 'Bianchi',
      nome: 'Lorenzo',
      data_nascita: '1982-04-10',
      gruppo_appartenenza: 'INTERNA',
      data_prima_iscrizione: 2020,
    }

    // Paid all years from registration up through 2025, but has not paid 2026 yet
    let paidYears = [2020, 2021, 2022, 2023, 2024, 2025]

    // Step 1: Detect Churn (Active in PREVIOUS_YEAR, unpaid in CURRENT_YEAR)
    const isChurned = (paidYears, prevYear, currYear) => {
      return paidYears.includes(prevYear) && !paidYears.includes(currYear)
    }
    expect(isChurned(paidYears, PREVIOUS_YEAR, CURRENT_YEAR)).toBe(true)

    // Step 2: Compute status before payment
    const statusBefore = calculatePaymentStatus(socio, paidYears, CURRENT_YEAR)
    expect(statusBefore.inRegola).toBe(false)
    expect(statusBefore.arretrati).toEqual([2026])

    // Voting Rights check: adult member unpaid in current year must regularize
    const checkVotingEligibility = (socio, status, year) => {
      const age = calculateAgeInYear(socio.data_nascita, year)
      if (age < 18) return { eligible: false, reason: 'MINORENNE' }
      if (!status.inRegola) return { eligible: false, reason: 'REGOLARIZZARE' }
      return { eligible: true, reason: 'IN_REGOLA' }
    }

    const votingBefore = checkVotingEligibility(socio, statusBefore, CURRENT_YEAR)
    expect(votingBefore.eligible).toBe(false)
    expect(votingBefore.reason).toBe('REGOLARIZZARE')

    // Step 3: Member pays 2026 quota (10.0€ renewal)
    paidYears.push(CURRENT_YEAR)

    // Step 4: Condono recalculation
    const statusAfter = calculatePaymentStatus(socio, paidYears, CURRENT_YEAR)
    expect(statusAfter.inRegola).toBe(true)
    expect(statusAfter.arretrati).toHaveLength(0)

    // Voting rights restored immediately!
    const votingAfter = checkVotingEligibility(socio, statusAfter, CURRENT_YEAR)
    expect(votingAfter.eligible).toBe(true)
    expect(votingAfter.reason).toBe('IN_REGOLA')
  })
})
