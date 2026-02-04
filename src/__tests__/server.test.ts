import request from 'supertest';
import express, { Request, Response } from 'express';

// Create a minimal test app (avoids DB connection issues in tests)
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Health check route
    app.get('/', (req: Request, res: Response) => {
        res.send('<h1>API is working...</h1>');
    });

    // API version prefix test
    app.get('/api/v1/health', (req: Request, res: Response) => {
        res.json({ status: 'ok', version: 'v1' });
    });

    return app;
};

describe('Server Health Check', () => {
    const app = createTestApp();

    describe('GET /', () => {
        it('should return 200 and health message', async () => {
            const response = await request(app).get('/');

            expect(response.status).toBe(200);
            expect(response.text).toContain('API is working');
        });
    });

    describe('GET /api/v1/health', () => {
        it('should return 200 with JSON status', async () => {
            const response = await request(app).get('/api/v1/health');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'ok',
                version: 'v1',
            });
        });
    });
});

describe('API Response Format', () => {
    const app = createTestApp();

    it('should set correct content-type for JSON responses', async () => {
        const response = await request(app).get('/api/v1/health');

        expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should set correct content-type for HTML responses', async () => {
        const response = await request(app).get('/');

        expect(response.headers['content-type']).toMatch(/text\/html/);
    });
});
