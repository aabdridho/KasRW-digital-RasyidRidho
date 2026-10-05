const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

const TIPE = ['pemasukan', 'pengeluaran'];

function validasi(body) {
  const { tanggal, tipe, keterangan, jumlah } = body;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal || '')) return 'tanggal wajib format YYYY-MM-DD';
  if (!TIPE.includes(tipe)) return 'tipe harus pemasukan / pengeluaran';
  if (!keterangan || !keterangan.trim()) return 'keterangan wajib diisi';
  if (!Number.isInteger(Number(jumlah)) || Number(jumlah) <= 0) return 'jumlah harus bilangan bulat > 0';
  return null;
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: e.message });
  }
});

app.get('/api/transaksi', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM transaksi ORDER BY tanggal DESC, id DESC');
  res.json(rows);
});

app.get('/api/saldo', async (req, res) => {
  const [[r]] = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN tipe='pemasukan'   THEN jumlah END),0) AS pemasukan,
      COALESCE(SUM(CASE WHEN tipe='pengeluaran' THEN jumlah END),0) AS pengeluaran
    FROM transaksi`);
  const pemasukan = Number(r.pemasukan), pengeluaran = Number(r.pengeluaran);
  res.json({ pemasukan, pengeluaran, saldo: pemasukan - pengeluaran });
});

app.get('/api/transaksi/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM transaksi WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  res.json(rows[0]);
});

app.post('/api/transaksi', async (req, res) => {
  const err = validasi(req.body);
  if (err) return res.status(400).json({ error: err });
  const { tanggal, tipe, keterangan, jumlah } = req.body;
  const [r] = await pool.query(
    'INSERT INTO transaksi (tanggal, tipe, keterangan, jumlah) VALUES (?,?,?,?)',
    [tanggal, tipe, keterangan.trim(), Number(jumlah)]
  );
  res.status(201).json({ id: r.insertId });
});

app.put('/api/transaksi/:id', async (req, res) => {
  const err = validasi(req.body);
  if (err) return res.status(400).json({ error: err });
  const { tanggal, tipe, keterangan, jumlah } = req.body;
  const [r] = await pool.query(
    'UPDATE transaksi SET tanggal=?, tipe=?, keterangan=?, jumlah=? WHERE id=?',
    [tanggal, tipe, keterangan.trim(), Number(jumlah), req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  res.json({ message: 'Transaksi diperbarui' });
});

app.delete('/api/transaksi/:id', async (req, res) => {
  const [r] = await pool.query('DELETE FROM transaksi WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  res.json({ message: 'Transaksi dihapus' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(3000, () => console.log('Backend jalan di port 3000'));
