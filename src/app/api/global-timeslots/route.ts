import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const globalSlots = db.collection('global_timeslots');
    const all = await globalSlots.find({}).toArray();
    await client.close();
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: 'Σφάλμα φόρτωσης global timeslots.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weekday, slots } = body; // slots: [{ time, service }]
    if (typeof weekday !== 'number' || !Array.isArray(slots)) {
      return NextResponse.json({ error: 'weekday and slots required' }, { status: 400 });
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const globalSlots = db.collection('global_timeslots');
    // Remove old slots for this weekday
    await globalSlots.deleteMany({ weekday });
    // Insert new slots
    if (slots.length > 0) {
      await globalSlots.insertMany(slots.map(s => ({ ...s, weekday })));
    }
    await client.close();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Σφάλμα αποθήκευσης global timeslots.' }, { status: 500 });
  }
} 