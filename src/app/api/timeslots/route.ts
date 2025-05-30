import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const service = searchParams.get('service');
    if (!date || !service) {
      return NextResponse.json({ error: 'date and service are required' }, { status: 400 });
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const timeslots = db.collection('timeslots');
    const slots = await timeslots.find({ date, service, available: true }).toArray();
    await client.close();
    return NextResponse.json(slots);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch timeslots' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, time, service } = body;
    if (!date || !time || !service) {
      return NextResponse.json({ error: 'date, time, and service are required' }, { status: 400 });
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const timeslots = db.collection('timeslots');
    // Prevent duplicate timeslot
    const existing = await timeslots.findOne({ date, time, service });
    if (existing) {
      await client.close();
      return NextResponse.json({ error: 'Timeslot already exists' }, { status: 409 });
    }
    const result = await timeslots.insertOne({ date, time, service, available: true });
    await client.close();
    return NextResponse.json({ success: true, timeslotId: result.insertedId });
  } catch {
    return NextResponse.json({ error: 'Failed to create timeslot' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const timeslots = db.collection('timeslots');
    const result = await timeslots.deleteOne({ _id: new ObjectId(id) });
    await client.close();
    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Δεν βρέθηκε το timeslot.' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Σφάλμα διαγραφής timeslot.' }, { status: 500 });
  }
} 