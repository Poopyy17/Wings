import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const qrCodesDir = path.join(uploadsDir, 'qrcodes');

const ensureDirectoriesExist = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  if (!fs.existsSync(qrCodesDir)) {
    fs.mkdirSync(qrCodesDir);
  }
};

export const generateQRCodesForTables = async (baseUrl) => {
  try {
    ensureDirectoriesExist();

    // Get all tables from the database
    const tablesResult = await pool.query(
      'SELECT id, table_number FROM tables'
    );
    const tables = tablesResult.rows;

    console.log(`Generating QR codes for ${tables.length} tables...`);

    // Generate QR code for each table
    for (const table of tables) {
      const tableUrl = `${baseUrl}/dine-in?table=${table.table_number}`;
      const qrCodeFilename = `table_${table.id}_qrcode.png`;
      const qrCodePath = path.join(qrCodesDir, qrCodeFilename);

      // Generate QR code and save it to the uploads/qrcodes directory
      await QRCode.toFile(qrCodePath, tableUrl, {
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        width: 300,
        margin: 1,
      });

      // Update the table record with the QR code path
      const relativePath = `/uploads/qrcodes/${qrCodeFilename}`;
      await pool.query('UPDATE tables SET qr_code_path = $1 WHERE id = $2', [
        relativePath,
        table.id,
      ]);

      console.log(
        `QR code generated for ${table.table_number}: ${relativePath}`
      );
    }

    console.log('All table QR codes generated successfully');
    return true;
  } catch (error) {
    console.error('Error generating QR codes:', error);
    throw error;
  }
};
