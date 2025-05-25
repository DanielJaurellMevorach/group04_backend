import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getContainer } from '../../util/cosmosDBClient';
import { getRedisClient } from '../../util/redisClient';

import * as dotenv from 'dotenv';
dotenv.config();

export async function getAllArtPieces(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    const artContainerId = 'ArtPieces';

    // Initialize Cosmos client and container once
    const artContainer = getContainer(artContainerId);

    const cacheKey = 'artPieces:all';
    const cacheTTL = 60;

    try {
        const redis = await getRedisClient();

        // 1) Try Redis cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            context.log('Cache hit');
            return {
                status: 200,
                body: cached,
                headers: { 'Content-Type': 'application/json' },
            };
        }

        context.log('Cache miss — querying Cosmos DB');

        // 1) Get all art pieces from Cosmos DB
        const { resources: artPieces } = await artContainer.items.readAll().fetchAll();

        // 2) Return success response with all art pieces

        // 4) Store in Redis
        await redis.setEx(cacheKey, cacheTTL, JSON.stringify({ artPieces }));
        context.log(`Cached ${artPieces.length} artPieces for ${cacheTTL}s`);

        return {
            status: 200,
            body: JSON.stringify({ artPieces: artPieces }),
        };
    } catch (err) {
        context.log('Error fetching art pieces:', err);
        return {
            status: 500,
            body: JSON.stringify({
                status: 500,
                error: 'Failed to fetch art pieces',
                details: err.message,
            }),
        };
    }
}

app.http('getAllArtPieces', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getAllArtPieces,
});
