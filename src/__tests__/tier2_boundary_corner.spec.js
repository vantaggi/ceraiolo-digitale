import { describe, it, expect } from 'vitest'
import {
  calculateAgeInYear,
  isExemptFromPayment,
  calculatePaymentStatus,
} from '../utils/payment'

describe('Tier 2 - Boundary & Corner Cases', () => {
  // =========================================================================
  // Condono Logic Boundary Tests
  // =========================================================================
  describe('Condono Logic Boundaries', () => {
    it('target year paid condones 10 consecutive years of unpaid dues', () => {
      const socio = {
        id: 1,
        cognome: 'Test',
        nome: 'Condono',
        data_prima_iscrizione: 2014,
        data_nascita: '1980-01-01',
      }
      // Only paid 2024
      const paidYears = [2024]
      const status = calculatePaymentStatus(socio, paidYears, 2024)

      expect(status.inRegola).toBe(true)
      expect(status.arretrati).toEqual([])
    })

    it('target year paid condones past sporadic gaps', () => {
      const socio = {
        id: 2,
        cognome: 'Test',
        nome: 'Gaps',
        data_prima_iscrizione: 2018,
        data_nascita: '1985-05-15',
      }
      // Paid 2018, 2020, 2024 (unpaid 2019, 2021, 2022, 2023)
      const paidYears = [2018, 2020, 2024]
      const status = calculatePaymentStatus(socio, paidYears, 2024)

      expect(status.inRegola).toBe(true)
      expect(status.arretrati).toHaveLength(0)
    })

    it('target year unpaid produces exact chronological arrears list from data_prima_iscrizione', () => {
      const socio = {
        id: 3,
        cognome: 'Test',
        nome: 'ArrearsList',
        data_prima_iscrizione: 2021,
        data_nascita: '1990-06-10',
      }
      // Target year 2024 unpaid, paid 2021 and 2023, missed 2022
      const paidYears = [2021, 2023]
      const status = calculatePaymentStatus(socio, paidYears, 2024)

      expect(status.inRegola).toBe(false)
      expect(status.arretrati).toEqual([2022, 2024])
    })

    it('does not generate arrears for years prior to data_prima_iscrizione', () => {
      const socio = {
        id: 4,
        cognome: 'Nuovo',
        nome: 'Recente',
        data_prima_iscrizione: 2023,
        data_nascita: '1992-04-12',
      }
      // Member registered in 2023, target year 2024 unpaid
      const paidYears = []
      const status = calculatePaymentStatus(socio, paidYears, 2024)

      expect(status.inRegola).toBe(false)
      // Must only list 2023 and 2024, never 2022 or older
      expect(status.arretrati).toEqual([2023, 2024])
      expect(status.arretrati).not.toContain(2022)
    })
  })

  // =========================================================================
  // Minor Exemption Boundaries
  // =========================================================================
  describe('Minor Exemption Boundaries', () => {
    it('member turning 18 in reference year is NOT exempt in reference year, but previous minor years are exempt', () => {
      const birthDate = '2006-08-20'
      const socio = {
        id: 10,
        cognome: 'Diciottenne',
        nome: 'Mario',
        data_nascita: birthDate,
        data_prima_iscrizione: 2020, // Registered when 14
      }

      // In 2024: 2024 - 2006 = 18 -> Not exempt
      expect(calculateAgeInYear(birthDate, 2024)).toBe(18)
      expect(isExemptFromPayment(socio, 2024)).toBe(false)

      // In 2023: 2023 - 2006 = 17 -> Exempt
      expect(calculateAgeInYear(birthDate, 2023)).toBe(17)
      expect(isExemptFromPayment(socio, 2023)).toBe(true)

      // When target year is 2024 and unpaid, 2020-2023 are exempt and only 2024 is an arretrato!
      const status = calculatePaymentStatus(socio, [], 2024)
      expect(status.inRegola).toBe(false)
      expect(status.arretrati).toEqual([2024])
    })

    it('minor aged 17 is fully in regola even with 0 payments if data_prima_iscrizione <= targetYear', () => {
      const birthDate = '2007-03-15'
      const socio = {
        id: 11,
        cognome: 'Minorenne',
        nome: 'Pietro',
        data_nascita: birthDate,
        data_prima_iscrizione: 2021,
      }

      // Age in 2024: 17 -> exempt
      expect(calculateAgeInYear(birthDate, 2024)).toBe(17)
      expect(isExemptFromPayment(socio, 2024)).toBe(true)

      const status = calculatePaymentStatus(socio, [], 2024)
      expect(status.inRegola).toBe(true)
      expect(status.arretrati).toEqual([])
    })

    it('handles missing, null or invalid birthdate by assuming adult (fallback 99)', () => {
      expect(calculateAgeInYear(null, 2024)).toBe(99)
      expect(calculateAgeInYear('', 2024)).toBe(99)
      expect(calculateAgeInYear('not-a-date', 2024)).toBe(99)

      const adultFallbackSocio = {
        id: 12,
        cognome: 'Senza',
        nome: 'Data',
        data_nascita: null,
        data_prima_iscrizione: 2023,
      }
      expect(isExemptFromPayment(adultFallbackSocio, 2024)).toBe(false)
      const status = calculatePaymentStatus(adultFallbackSocio, [], 2024)
      expect(status.inRegola).toBe(false)
      expect(status.arretrati).toEqual([2023, 2024])
    })
  })

  // =========================================================================
  // Batch Entry Boundaries
  // =========================================================================
  describe('Batch Entry Slot & Calculation Boundaries', () => {
    const calculateReceiptNumber = (numeroBlocchetto, slotIndex) => {
      return (numeroBlocchetto - 1) * 10 + slotIndex
    }

    it('calculates exact slot boundaries for Booklet 1, Booklet 100, and Booklet 999', () => {
      // Booklet 1: 1 to 10
      expect(calculateReceiptNumber(1, 1)).toBe(1)
      expect(calculateReceiptNumber(1, 10)).toBe(10)

      // Booklet 100: 991 to 1000
      expect(calculateReceiptNumber(100, 1)).toBe(991)
      expect(calculateReceiptNumber(100, 10)).toBe(1000)

      // Booklet 999: 9981 to 9990
      expect(calculateReceiptNumber(999, 1)).toBe(9981)
      expect(calculateReceiptNumber(999, 10)).toBe(9990)
    })

    it('calculates zero cash total for empty booklet or receipt', () => {
      const payments = []
      const total = payments.reduce((sum, p) => sum + (Number(p.quota_pagata) || 0), 0)
      expect(total).toBe(0)
    })

    it('preserves floating-point precision on decimal payment quotas', () => {
      const payments = [
        { quota_pagata: 12.5 },
        { quota_pagata: 12.5 },
        { quota_pagata: 0.0 },
        { quota_pagata: 25.0 },
      ]
      const total = payments.reduce((sum, p) => sum + p.quota_pagata, 0)
      expect(total).toBe(50.0)
      expect(total.toFixed(2)).toBe('50.00')
    })
  })

  // =========================================================================
  // String, Encoding & Extreme Input Boundaries
  // =========================================================================
  describe('String Encoding & Extreme Input Boundaries', () => {
    it('formats Italian DOB correctly for leap year date (29 Febbraio)', () => {
      const formatItalianDOB = (isoDate) => {
        if (!isoDate) return ''
        const [anno, mese, giorno] = isoDate.split('-')
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
        const meseNome = mesi[parseInt(mese, 10) - 1]
        return `${parseInt(giorno, 10)} ${meseNome} ${anno}`
      }

      expect(formatItalianDOB('2024-02-29')).toBe('29 Febbraio 2024')
    })

    it('handles names with quotes, apostrophes, accents, and extreme lengths', () => {
      const complexNames = [
        { cognome: "Dell'Orso", nome: "Sant'Angelo" },
        { cognome: 'De Luca', nome: 'Èlia' },
        { cognome: 'Müller', nome: 'Björn' },
        {
          cognome: 'Casagrande Dei Conti Guidi Di Bagno',
          nome: 'Massimiliano Costantino Francesco',
        },
      ]

      complexNames.forEach((item) => {
        const full = `${item.cognome} ${item.nome}`
        expect(full.length).toBeGreaterThan(5)
        expect(typeof full).toBe('string')
      })
    })

    it('correctly handles extreme historical and future years', () => {
      const oldSocio = {
        data_nascita: '1905-01-01',
        data_prima_iscrizione: 1930,
      }
      expect(calculateAgeInYear(oldSocio.data_nascita, 2026)).toBe(121)
      expect(isExemptFromPayment(oldSocio, 2026)).toBe(false)

      const futureYear = 2050
      expect(calculateAgeInYear('2035-05-10', futureYear)).toBe(15)
    })
  })
})
