import { config } from '../config/env.config';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.sendgridEmail,
    pass: config.sendgridApiKey,
  },
});

interface EmailOptions {
  to: string;
  data?: Record<string, any>[];
}

export class EmailService {
  static async sendEmail(options: EmailOptions): Promise<void> {
    const msg = {
      to: options.to,
      from: config.sendgridEmail,
      subject: '🚨 Roomy Environment Alert',
      html: this.getWarningEmail(options.data),
    };

    try {
      await transporter.sendMail(msg);
      console.log(`✅ Email sent to ${options.to}`);
    } catch (error: any) {
      console.error(
        '❌ Failed to send email:',
        error.response?.body || error.message
      );
      throw new Error('Email sending failed');
    }
  }

  static getWarningEmail(alertValues?: Record<string, any>) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Roomy Alert</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f6f8fb;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #162f70;
        color: #ffffff;
        text-align: center;
        padding: 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px 30px;
        color: #333333;
      }
      .content h2 {
        color: #e53935;
        margin-top: 0;
        
        text-align: center;
        width: 100%;
      }
      .sensor-alert {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        border-radius: 6px;
        padding: 15px;
        margin: 15px 0;
      }
      .sensor-alert strong {
        display: block;
        color: #856404;
        margin-bottom: 5px;
      }
      .cta-button {
        display: block;
        margin-top: 20px;
        padding: 12px 24px;
        background-color: #162f70;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        text-align: center;

      }
      .footer {
        text-align: center;
        font-size: 13px;
        color: #999999;
        padding: 20px;
      }
      .footer a {
        color: #0044cc;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚨 Roomy Environment Alert</h1>
      </div>
      <div class="content">
        <h2>Attention!</h2>
        <p>One or more environmental parameters have exceeded safe levels in your monitored room. Please take immediate action if necessary.</p>

        ${alertValues
          ?.map((alert: any) => {
            switch (alert.type) {
              case 'temperature':
                return `<div class="sensor-alert">
  <strong>🌡️ Temperature Alert</strong>
  Current value: <b>${alert.currentValue}°C</b><br />
  Threshold: <b>${alert.threshold}°C</b><br />
  Description: Room temperature is above the safe range and may cause discomfort or health issues.
</div>`;

              case 'humidity':
                return `<div class="sensor-alert">
  <strong>💧 Humidity Alert</strong>
  Current value: <b>${alert.currentValue}%</b><br />
  Threshold: <b>${alert.threshold}%</b><br />
  Description: Humidity is above the safe limit and could promote mold growth or discomfort.
</div>`;

              case 'aqi':
                return `<div class="sensor-alert">
  <strong>🟫 AQI Alert</strong>
  Current value: <b>${alert.currentValue}</b><br />
  Threshold: <b>${alert.threshold}</b><br />
  Description: Air Quality Index is unhealthy and may affect sensitive individuals.
</div>`;

              case 'eco2':
                return `<div class="sensor-alert">
  <strong>🟣 eCO₂ Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: eCO₂ levels are elevated, indicating poor ventilation or crowding.
</div>`;

              case 'tvoc':
                return `<div class="sensor-alert">
  <strong>🧪 TVOC Alert</strong>
  Current value: <b>${alert.currentValue} ppb</b><br />
  Threshold: <b>${alert.threshold} ppb</b><br />
  Description: Total Volatile Organic Compounds are high and may cause irritation or headaches.
</div>`;

              case 'coPpm':
                return `<div class="sensor-alert">
  <strong>🚬 CO Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Carbon Monoxide is dangerously high and poses a serious health risk.
</div>`;

              case 'ch4Ppm':
                return `<div class="sensor-alert">
  <strong>🔥 CH₄ Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Methane concentration is elevated and may indicate a gas leak.
</div>`;

              case 'lpgPpm':
                return `<div class="sensor-alert">
  <strong>🛢️ LPG Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Liquefied Petroleum Gas levels are high and could be flammable.
</div>`;

              case 'nh3':
                return `<div class="sensor-alert">
  <strong>🧫 NH₃ Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Ammonia levels are above safe exposure limits.
</div>`;

              case 'co2':
                return `<div class="sensor-alert">
  <strong>🟢 CO₂ Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Carbon Dioxide is elevated, indicating poor air circulation.
</div>`;

              case 'alcohol':
                return `<div class="sensor-alert">
  <strong>🍷 Alcohol Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Alcohol vapors are unusually high, possibly from spillage or poor ventilation.
</div>`;

              case 'toluene':
                return `<div class="sensor-alert">
  <strong>🧴 Toluene Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Toluene exposure above safe limits may affect health.
</div>`;

              case 'acetone':
                return `<div class="sensor-alert">
  <strong>🧼 Acetone Alert</strong>
  Current value: <b>${alert.currentValue} ppm</b><br />
  Threshold: <b>${alert.threshold} ppm</b><br />
  Description: Acetone levels are high and may indicate solvent exposure.
</div>`;

              case 'flameDetected':
                return `<div class="sensor-alert">
  <strong>🔥 Flame Detected</strong>
  Intensity: <b>${alert.currentValue}</b><br />
  Threshold: <b>Any detection</b><br />
  Description: Flame has been detected in the room. Immediate inspection is advised.
</div>`;
            }
          })
          .join('')}
        
        <p>If you are receiving this email repeatedly, consider checking the device or improving the ventilation in the room.</p>

        
        <a href="https://roomy.app/dashboard" class="cta-button">🔍 Check in Roomy App</a>
      </div>
      <div class="footer">
        Sent by <strong>Roomy</strong> – Smart Room Environment Monitoring System<br />
        <a href="https://roomy.app">www.roomy.app</a> | This is an automated alert.
      </div>
    </div>
  </body>
</html>`;
  }
}
