const API = '/api';
const $ = id => document.getElementById(id);
const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, opt = {}) {
  const res = await fetch(API + path, { headers: { 'Content-Type': 'application/json' }, ...opt });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request gagal');
  return data;
}

async function muat() {
  const [list, s] = await Promise.all([api('/transaksi'), api('/saldo')]);
  $('saldo').textContent = 'Total Saldo: ' + rupiah(s.saldo);
  $('tbody').innerHTML = list.map(t => `
    <tr>
      <td>${t.tanggal}</td>
      <td>${esc(t.keterangan)}</td>
      <td><span class="badge ${t.tipe}">${t.tipe}</span></td>
      <td class="${t.tipe}">${t.tipe === 'pemasukan' ? '+' : '-'} ${rupiah(t.jumlah)}</td>
      <td>
        <button class="btn-detail" onclick="detail(${t.id})">Detail</button>
        <button class="btn-edit" onclick="edit(${t.id})">Edit</button>
        <button class="btn-delete" onclick="hapus(${t.id})">Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="5">Belum ada transaksi</td></tr>';
}

async function detail(id) {
  const t = await api('/transaksi/' + id);
  $('detail-isi').innerHTML = `
    <p><b>ID:</b> ${t.id}</p>
    <p><b>Tanggal:</b> ${t.tanggal}</p>
    <p><b>Jenis:</b> ${t.tipe}</p>
    <p><b>Keterangan:</b> ${esc(t.keterangan)}</p>
    <p><b>Jumlah:</b> ${rupiah(t.jumlah)}</p>
    <p><b>Dibuat:</b> ${t.created_at}</p>
    <p><b>Terakhir diubah:</b> ${t.updated_at}</p>`;
  $('detail').showModal();
}

async function edit(id) {
  const t = await api('/transaksi/' + id);
  $('id').value = t.id;
  $('tanggal').value = t.tanggal;
  $('tipe').value = t.tipe;
  $('keterangan').value = t.keterangan;
  $('jumlah').value = t.jumlah;
  $('form-title').textContent = 'Edit Transaksi #' + t.id;
  $('btn-simpan').textContent = 'Update Transaksi';
  $('btn-batal').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function hapus(id) {
  if (!confirm('Yakin hapus transaksi ini?')) return;
  await api('/transaksi/' + id, { method: 'DELETE' });
  muat();
}

function resetForm() {
  $('form').reset();
  $('id').value = '';
  $('tanggal').value = new Date().toLocaleDateString('sv-SE');
  $('form-title').textContent = 'Tambah Transaksi';
  $('btn-simpan').textContent = 'Simpan Transaksi';
  $('btn-batal').hidden = true;
}

$('form').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('id').value;
  const body = JSON.stringify({
    tanggal: $('tanggal').value,
    tipe: $('tipe').value,
    keterangan: $('keterangan').value,
    jumlah: Number($('jumlah').value),
  });
  try {
    await api(id ? '/transaksi/' + id : '/transaksi', { method: id ? 'PUT' : 'POST', body });
    resetForm();
    muat();
  } catch (err) {
    alert(err.message);
  }
});
$('btn-batal').addEventListener('click', resetForm);

resetForm();
muat();
