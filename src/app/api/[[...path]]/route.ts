import { NextResponse } from 'next/server';

const notFoundBody = () => ({
  error: 'Not found',
  code: 'API_NOT_FOUND',
  message: 'The requested API endpoint does not exist.',
});

function json404() {
  return NextResponse.json(notFoundBody(), { status: 404 });
}

export function GET() {
  return json404();
}

export function POST() {
  return json404();
}

export function PUT() {
  return json404();
}

export function PATCH() {
  return json404();
}

export function DELETE() {
  return json404();
}
