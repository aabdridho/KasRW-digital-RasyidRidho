CREATE TABLE IF NOT EXISTS transaksi (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tanggal     DATE NOT NULL,
  tipe        ENUM('pemasukan','pengeluaran') NOT NULL,
  keterangan  VARCHAR(255) NOT NULL,
  jumlah      BIGINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO transaksi (tanggal, tipe, keterangan, jumlah) VALUES
('2026-04-12','pemasukan','Iuran Wajib',500000),
('2026-04-12','pemasukan','Iuran RT 2',200000),
('2026-04-13','pengeluaran','Beli lampu pos ronda',75000);
