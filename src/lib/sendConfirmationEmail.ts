import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST!;
const SMTP_PORT = Number(process.env.SMTP_PORT!);
const SMTP_USER = process.env.SMTP_USER!;
const SMTP_PASS = process.env.SMTP_PASS!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

export async function sendConfirmationEmail({
  to,
  userName,
  userEmail,
  service,
  date,
  time,
  telephone,
}: {
  to: string[];
  userName: string;
  userEmail: string;
  service: string;
  date: string;
  time: string;
  telephone: string;
}) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const html = `
    <div style="background:#DFE7CA;padding:32px 0;min-height:100vh;font-family:sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:18px;box-shadow:0 4px 24px rgba(0,0,0,0.07);padding:32px 24px 24px 24px;border:2px solid #B5C99A;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src='https://avgouste.gr/image.png' alt="Avgouste Logo" style="height:48px;margin-bottom:8px;" />
          <h1 style="font-size:1.5rem;font-weight:800;color:#222;margin:0;">Επιβεβαίωση Κράτησης</h1>
          <div style="font-size:1rem;color:#5B7553;margin-top:4px;">Σας ευχαριστούμε για την εμπιστοσύνη!</div>
        </div>
        <div style="background:#DFE7CA;border-radius:12px;padding:18px 16px 12px 16px;margin-bottom:18px;border:1.5px solid #B5C99A;">
          <div style="font-size:1.1rem;font-weight:700;color:#222;margin-bottom:8px;">Λεπτομέρειες Κράτησης</div>
          <div style="margin-bottom:6px;"><b>Υπηρεσία:</b> ${service}</div>
          <div style="margin-bottom:6px;"><b>Ημερομηνία:</b> ${date}</div>
          <div style="margin-bottom:6px;"><b>Ώρα:</b> ${time}</div>
          <div style="margin-bottom:6px;"><b>Όνομα:</b> ${userName}</div>
          <div style="margin-bottom:6px;"><b>Email:</b> ${userEmail}</div>
          <div style="margin-bottom:6px;"><b>Τηλέφωνο:</b> ${telephone}</div>
        </div>
        <div style="font-size:0.95rem;color:#444;margin-bottom:18px;">
          <b>Διεύθυνση:</b> Εφέσου 20, Άνω Τούμπα, Θεσσαλονίκη<br/>
          <b>Τηλέφωνο:</b> 2310 930 900, 6981 958 248<br/>
          <b>Email:</b> info@avgouste.gr
        </div>
        <div style="text-align:center;font-size:0.95rem;color:#5B7553;margin-top:18px;">
          Μπορείτε να ακυρώσετε το ραντεβού σας μέχρι 5 ώρες πριν.<br/>
          Σας περιμένουμε!
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `Avgouste <${SMTP_USER}>`,
    to,
    subject: 'Επιβεβαίωση Κράτησης || Ιατρείο Βελονισμού - Ηλέκτρα Αυγουστή',
    html,
  });
} 