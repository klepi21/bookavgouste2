import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const overrides = db.collection('date_overrides');
    let all;
    if (date) {
      all = await overrides.find({ date }).toArray();
    } else {
      all = await overrides.find({}).toArray();
    }
    await client.close();
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: 'Σφάλμα φόρτωσης overrides.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, overrides } = body; // overrides: [{ time, service, available }]
    if (!date || !Array.isArray(overrides)) {
      return NextResponse.json({ error: 'date and overrides required' }, { status: 400 });
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const coll = db.collection('date_overrides');
    await coll.deleteMany({ date });
    if (overrides.length > 0) {
      await coll.insertMany(overrides.map(o => ({ ...o, date })));
    }
    await client.close();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Σφάλμα ενημέρωσης overrides.' }, { status: 500 });
  }
} 