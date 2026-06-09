import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.js';

describe('API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('POST /api/parse-intent', () => {
    it('should parse trade intent correctly using regex fallback', async () => {
      const response = await request(app)
        .post('/api/parse-intent')
        .send({ prompt: 'Swap 1000 SUI to USDC' });

      expect(response.status).toBe(200);
      expect(response.body.intent).toBeDefined();
      expect(response.body.intent.trade_amount).toBe('1000');
      expect(response.body.intent.source_token_symbol).toBe('SUI');
      expect(response.body.intent.destination_token_symbol).toBe('USDC');
    });

    it('should return error for invalid prompt format', async () => {
      const response = await request(app)
        .post('/api/parse-intent')
        .send({ prompt: 'Hello World' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/calculate-optimal-route', () => {
    it('should calculate optimal route for valid tokens', async () => {
      const response = await request(app)
        .post('/api/calculate-optimal-route')
        .send({
          sourceSymbol: 'SUI',
          destSymbol: 'USDC',
          amount: '100'
        });

      expect(response.status).toBe(200);
      expect(response.body.route).toBeInstanceOf(Array);
      expect(response.body.expected_output).toBeDefined();
      expect(response.body.dynamicPoolUsed).toBeDefined();
    });
  });

  describe('POST /api/evaluate-guardian-risk', () => {
    it('should evaluate low risk for low slippage', async () => {
      const response = await request(app)
        .post('/api/evaluate-guardian-risk')
        .send({
          sourceSymbol: 'SUI',
          destSymbol: 'USDC',
          route: [],
          execution_impact: '0.05%'
        });

      expect(response.status).toBe(200);
      expect(response.body.risk_probability).toBeLessThan(0.1);
      expect(response.body.risk_level).toBe('LOW');
      expect(response.body.execution_blocked).toBe(false);
    });

    it('should evaluate high risk for high slippage', async () => {
      const response = await request(app)
        .post('/api/evaluate-guardian-risk')
        .send({
          sourceSymbol: 'SUI',
          destSymbol: 'USDC',
          route: [],
          execution_impact: '10%'
        });

      expect(response.status).toBe(200);
      expect(response.body.risk_probability).toBeGreaterThan(0.4);
      expect(response.body.risk_level).toBe('HIGH');
    });
  });
});
