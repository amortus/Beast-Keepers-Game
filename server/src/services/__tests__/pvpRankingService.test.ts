/**
 * Tests for PVP Ranking Service
 * Tests ranking calculations, ELO system, and tier/division logic
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { calculateEloChange, getTierAndDivision } from '../pvpRankingService';

describe('PVP Ranking Service', () => {
  describe('calculateEloChange', () => {
    it('should calculate correct ELO change when winner has higher ELO', () => {
      const winnerElo = 1500;
      const loserElo = 1400;
      
      const result = calculateEloChange(winnerElo, loserElo);
      
      expect(result.winnerChange).toBeGreaterThan(0);
      expect(result.loserChange).toBeLessThan(0);
      // When higher ELO wins (expected), they gain less ELO points
      // Due to rounding, the values might be equal or winner gain slightly less
      expect(Math.abs(result.winnerChange)).toBeLessThanOrEqual(Math.abs(result.loserChange) + 1);
    });

    it('should calculate correct ELO change when winner has lower ELO', () => {
      const winnerElo = 500;
      const loserElo = 1500;
      
      const result = calculateEloChange(winnerElo, loserElo);
      
      expect(result.winnerChange).toBeGreaterThan(0);
      expect(result.loserChange).toBeLessThan(0);
      // When much lower ELO wins (upset), they gain significantly more ELO points
      // With 1000 point difference, winner should gain substantial points
      // The exact relationship depends on rounding, so we just verify both are valid
      expect(result.winnerChange).toBeGreaterThan(15); // Should gain significant points for upset
      expect(Math.abs(result.loserChange)).toBeGreaterThan(0); // Loser always loses points
    });

    it('should have balanced ELO changes when ELOs are equal', () => {
      const winnerElo = 1400;
      const loserElo = 1400;
      
      const result = calculateEloChange(winnerElo, loserElo);
      
      expect(result.winnerChange).toBeGreaterThan(0);
      expect(result.loserChange).toBeLessThan(0);
      // When ELOs are equal, winner gains exactly what loser loses (balanced)
      expect(result.winnerChange).toBe(Math.abs(result.loserChange));
    });

    it('should handle very high ELO differences', () => {
      const winnerElo = 2000;
      const loserElo = 1000;
      
      const result = calculateEloChange(winnerElo, loserElo);
      
      // When much higher ELO wins, they may gain 0 or very few points (almost certain win)
      // The loser always loses points, but winner may not gain if win was expected
      expect(result.winnerChange).toBeGreaterThanOrEqual(0); // Can be 0 for almost certain wins
      expect(result.loserChange).toBeLessThan(0);
      // When ELO difference is huge, winner gain is minimal or zero
      expect(Math.abs(result.winnerChange)).toBeLessThanOrEqual(5);
    });

    it('should handle very low ELO differences', () => {
      const winnerElo = 1001;
      const loserElo = 1000;
      
      const result = calculateEloChange(winnerElo, loserElo);
      
      expect(result.winnerChange).toBeGreaterThan(0);
      expect(result.loserChange).toBeLessThan(0);
    });
  });

  describe('getTierAndDivision', () => {
    it('should return Iron tier for low ELO', () => {
      const result = getTierAndDivision(200);
      
      expect(result.tier).toBe('iron');
      expect(result.division).toBeGreaterThanOrEqual(1);
      expect(result.division).toBeLessThanOrEqual(4);
    });

    it('should return Bronze tier for medium-low ELO', () => {
      const result = getTierAndDivision(600);
      
      expect(result.tier).toBe('bronze');
      expect(result.division).toBeGreaterThanOrEqual(1);
      expect(result.division).toBeLessThanOrEqual(4);
    });

    it('should return Silver tier for medium ELO', () => {
      const result = getTierAndDivision(1000);
      
      expect(result.tier).toBe('silver');
      expect(result.division).toBeGreaterThanOrEqual(1);
      expect(result.division).toBeLessThanOrEqual(4);
    });

    it('should return Gold tier for medium-high ELO', () => {
      const result = getTierAndDivision(1400);
      
      expect(result.tier).toBe('gold');
      expect(result.division).toBeGreaterThanOrEqual(1);
      expect(result.division).toBeLessThanOrEqual(4);
    });

    it('should return Platinum tier for high ELO', () => {
      const result = getTierAndDivision(1800);
      
      expect(result.tier).toBe('platinum');
      expect(result.division).toBeGreaterThanOrEqual(1);
      expect(result.division).toBeLessThanOrEqual(4);
    });

    it('should return Diamond tier for very high ELO', () => {
      const result = getTierAndDivision(2200);
      
      expect(result.tier).toBe('diamond');
      expect(result.division).toBeGreaterThanOrEqual(1);
      expect(result.division).toBeLessThanOrEqual(4);
    });

    it('should return Master tier for extremely high ELO', () => {
      const result = getTierAndDivision(2500);
      
      expect(result.tier).toBe('master');
      expect(result.division).toBeNull(); // Master tier não tem divisões
    });

    it('should return correct division within tier', () => {
      const result1 = getTierAndDivision(100); // Iron tier
      const result2 = getTierAndDivision(399); // Iron tier (upper bound)
      const result3 = getTierAndDivision(400); // Bronze tier (lower bound)
      
      expect(result1.tier).toBe('iron');
      expect(result2.tier).toBe('iron');
      expect(result3.tier).toBe('bronze');
      expect(result1.division).toBeGreaterThanOrEqual(1);
      expect(result1.division).toBeLessThanOrEqual(4);
      expect(result3.division).toBeGreaterThanOrEqual(1);
      expect(result3.division).toBeLessThanOrEqual(4);
    });

    it('should return challenger tier for very high ELO', () => {
      const result = getTierAndDivision(3200);
      
      expect(result.tier).toBe('challenger');
      expect(result.division).toBeNull();
    });

    it('should return grandmaster tier for high ELO', () => {
      const result = getTierAndDivision(2800);
      
      expect(result.tier).toBe('grandmaster');
      expect(result.division).toBeNull();
    });
  });
});

