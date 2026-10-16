import { describe, it, expect } from 'vitest';
import { getCourseOptionFromAdmissionNumber } from '@lib/utils/courseUtils';

describe('courseUtils', () => {
  describe('getCourseOptionFromAdmissionNumber', () => {
    it('returns NEP for 24JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('24JE1234')).toBe('NEP');
    });

    it('returns NEP for 25JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('25JE5678')).toBe('NEP');
    });

    it('returns NEP for 26JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('26JE0001')).toBe('NEP');
    });

    it('returns CBCS for 23JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('23JE1234')).toBe('CBCS');
    });

    it('returns CBCS for 22JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('22JE5678')).toBe('CBCS');
    });

    it('returns CBCS for 21JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('21JE0001')).toBe('CBCS');
    });

    it('returns CBCS for 20JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('20JE9999')).toBe('CBCS');
    });

    it('returns CBCS for invalid format', () => {
      expect(getCourseOptionFromAdmissionNumber('INVALID')).toBe('CBCS');
    });

    it('returns CBCS for empty string', () => {
      expect(getCourseOptionFromAdmissionNumber('')).toBe('CBCS');
    });
  });
});
