import { NextResponse } from 'next/server';
import { loadCatalog } from '@/data/catalog-loader';
import { recommend, validatePreferences } from '@/recommendations';
import type { RecommendationResponse } from '@/shared/types';

type RecommendationRequest = { preferences: unknown };

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecommendationRequest(body)) return errorResponse('Request body must contain only preferences.');

  const validation = validatePreferences(body.preferences);
  if (!validation.valid) return errorResponse(validation.error);

  try {
    const response: RecommendationResponse = recommend(validation.value, loadCatalog());
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'Recommendations are temporarily unavailable.' }, { status: 500 });
  }
}

function isRecommendationRequest(value: unknown): value is RecommendationRequest {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.keys(value).length === 1
    && Object.prototype.hasOwnProperty.call(value, 'preferences');
}

function errorResponse(error: string): Response {
  return NextResponse.json({ error }, { status: 400 });
}
