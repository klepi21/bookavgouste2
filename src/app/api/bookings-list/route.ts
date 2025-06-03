import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

export async function GET() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const bookings = db.collection('bookings');
    const all = await bookings.find({}).sort({ date: 1, time: 1 }).toArray();
    await client.close();
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά τη φόρτωση των κρατήσεων.' }, { status: 500 });
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
    const bookings = db.collection('bookings');
    const result = await bookings.deleteOne({ _id: new ObjectId(id) });
    await client.close();
    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Δεν βρέθηκε η κράτηση.' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά την ενημέρωση της κράτησης.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const { date, time } = await req.json();
    if (!date || !time) return NextResponse.json({ error: 'Missing date or time' }, { status: 400 });
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const bookings = db.collection('bookings');
    const result = await bookings.updateOne(
      { _id: new ObjectId(id) },
      { $set: { date, time } }
    );
    await client.close();
    if (result.matchedCount === 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Δεν βρέθηκε η κράτηση.' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά την ενημέρωση της κράτησης.' }, { status: 500 });
  }
} 