import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { sendConfirmationEmail } from '@/lib/sendConfirmationEmail';

const uri = process.env.MONGODB_URI as string;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, date, time, name, telephone, email } = body;

    // Basic validation
    if (!service || !date || !time || !name || !telephone || !email) {
      return NextResponse.json({ error: 'Όλα τα πεδία είναι υποχρεωτικά.' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const bookings = db.collection('bookings');

    // Check for double booking (same date, time, service)
    const existing = await bookings.findOne({ date, time, service });
    if (existing) {
      await client.close();
      return NextResponse.json({ error: 'Το συγκεκριμένο ραντεβού έχει ήδη κλειστεί.' }, { status: 409 });
    }

    // Insert booking
    const result = await bookings.insertOne({
      service,
      date,
      time,
      name,
      telephone,
      email,
      createdAt: new Date(),
    });

    // Mark slot as unavailable in date_overrides
    const overrides = db.collection('date_overrides');
    // Remove any previous override for this slot/date/service
    await overrides.deleteMany({ date, time, service });
    // Insert as unavailable
    await overrides.insertOne({ date, time, service, available: false });

    await client.close();

    // Send confirmation email to user and admin
    try {
      await sendConfirmationEmail({
        to: [email, process.env.ADMIN_EMAIL!],
        userName: name,
        userEmail: email,
        service,
        date,
        time,
        telephone,
      });
    } catch (e) {
      // Log but do not block booking
      console.error('Email send error:', e);
    }

    return NextResponse.json({ success: true, bookingId: result.insertedId });
  } catch {
    return NextResponse.json({ error: 'Σφάλμα κατά την αποθήκευση του ραντεβού.' }, { status: 500 });
  }
} 