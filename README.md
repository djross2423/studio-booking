# Studio Booking — Setup Guide

## What you need
- Raspberry Pi 4 (or any always-on computer at the studio)
- Node.js 18+ installed on it
- A free Cloudflare account (for remote access)

---

## Step 1 — Install on the Raspberry Pi

```bash
# Copy this project folder to the Pi, then:
cd studio-booking
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run build
npm start
```

The app runs at http://localhost:3000

---

## Step 2 — Set up Cloudflare Tunnel (remote access)

```bash
# Install cloudflared on the Pi
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Log in to Cloudflare
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create studio

# Start the tunnel (points to your local app)
cloudflared tunnel --url http://localhost:3000
```

This gives you a public HTTPS URL like `https://studio.yourdomain.com`

---

## Step 3 — Add to iPhone home screen

1. Open the URL in Safari on your iPhone
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

The app now works like a native app — full screen, no browser bar.

---

## Step 4 — Auto-start on boot (optional but recommended)

```bash
# Create a systemd service so it starts automatically when the Pi powers on
sudo nano /etc/systemd/system/studio-booking.service
```

Paste this:
```
[Unit]
Description=Studio Booking App
After=network.target

[Service]
WorkingDirectory=/home/pi/studio-booking
ExecStart=/usr/bin/npm start
Restart=always
User=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then enable it:
```bash
sudo systemctl enable studio-booking
sudo systemctl start studio-booking
```

---

## Booking rules

- DJ classroom booked → control room automatically blocked for that window
- Control room booked → DJ classroom automatically blocked for that window
- The app enforces this at the API level — no double bookings possible
- Cancelling a booking frees up the slot immediately

---

## File locations

- Database: `prisma/studio.db` — back this file up regularly
- Environment: `.env` — contains database path
