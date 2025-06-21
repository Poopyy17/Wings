import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist (for development)
const uploadsDir = path.join(__dirname, '..', 'uploads');
const qrCodesDir = path.join(uploadsDir, 'qrcodes');

const ensureDirectoriesExist = () => {
  if (process.env.NODE_ENV !== 'production') {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir);
    }
  }
};

export const generateQRCodesForTables = async (baseUrl) => {
  try {
    ensureDirectoriesExist(); // Get all tables from the database
    const tablesResult = await pool.query(
      'SELECT id, table_number, qr_code_path FROM tables'
    );
    const tables = tablesResult.rows;

    console.log(`Checking QR codes for ${tables.length} tables...`);

    // Generate QR code for each table that doesn't have one or needs updating
    for (const table of tables) {
      const tableUrl = `${baseUrl}/dine-in?table=${table.table_number}`;
      const qrCodeFilename = `table_${table.id}_qrcode.png`;

      // Check if QR code already exists and is valid
      if (table.qr_code_path) {
        if (process.env.NODE_ENV === 'production') {
          // In production, if we have a blob URL, assume it's valid
          if (table.qr_code_path.startsWith('https://')) {
            console.log(
              `QR code already exists for ${table.table_number}: ${table.qr_code_path}`
            );
            continue;
          }
        } else {
          // In development, check if local file exists
          const localPath = path.join(qrCodesDir, qrCodeFilename);
          if (fs.existsSync(localPath)) {
            console.log(
              `QR code already exists for ${table.table_number}: ${table.qr_code_path}`
            );
            continue;
          }
        }
      }

      let qrCodePath;

      if (process.env.NODE_ENV === 'production') {
        // Generate QR code to buffer for blob storage
        const qrCodeBuffer = await QRCode.toBuffer(tableUrl, {
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          width: 300,
          margin: 1,
        });

        // Upload to Vercel Blob
        const blob = await put(`qrcodes/${qrCodeFilename}`, qrCodeBuffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,
          allowOverwrite: true,
        });

        qrCodePath = blob.url;
      } else {
        // Generate QR code to local file for development
        const localQrCodePath = path.join(qrCodesDir, qrCodeFilename);

        await QRCode.toFile(localQrCodePath, tableUrl, {
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          width: 300,
          margin: 1,
        });

        qrCodePath = `/uploads/qrcodes/${qrCodeFilename}`;
      }

      // Update the table record with the QR code path
      await pool.query('UPDATE tables SET qr_code_path = $1 WHERE id = $2', [
        qrCodePath,
        table.id,
      ]);

      console.log(`QR code generated for ${table.table_number}: ${qrCodePath}`);
    }

    console.log('QR code check and generation completed successfully');
    return true;
  } catch (error) {
    console.error('Error generating QR codes:', error);
    throw error;
  }
};
