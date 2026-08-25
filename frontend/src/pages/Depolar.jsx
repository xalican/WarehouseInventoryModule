import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Warehouse as WarehouseIcon,
  Close as CloseIcon,
  Domain as DomainIcon,
  Engineering as FieldIcon,
  DeleteSweep as ScrapIcon,
  Business as BuildingIcon,
  Storefront as StoreIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const BOLGELER = [
  'Marmara Bölgesi',
  'İç Anadolu Bölgesi',
  'Ege Bölgesi',
  'Akdeniz Bölgesi',
  'Karadeniz Bölgesi',
  'Doğu Anadolu Bölgesi',
  'Güneydoğu Anadolu Bölgesi',
  'Saha & Hurda Depoları',
];

const getDepoIcon = (kodOrName) => {
  const str = (kodOrName || '').toLowerCase();
  if (str.includes('mrk') || str.includes('merkez')) return <BuildingIcon fontSize="small" />;
  if (str.includes('blg') || str.includes('bölge')) return <DomainIcon fontSize="small" />;
  if (str.includes('sha') || str.includes('saha')) return <FieldIcon fontSize="small" />;
  if (str.includes('hrd') || str.includes('hurda')) return <ScrapIcon fontSize="small" />;
  return <StoreIcon fontSize="small" />;
};

const Depolar = () => {
  const { t } = useLanguage();
  const [depolar, setDepolar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [kod, setKod] = useState('');
  const [ad, setAd] = useState('');
  const [sorumlu, setSorumlu] = useState('');
  const [bolge, setBolge] = useState('Marmara Bölgesi');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  const fetchDepolar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/depolar');
      setDepolar(res.data);
    } catch (err) {
      console.error('Depolar çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepolar();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setKod('');
    setAd('');
    setSorumlu('');
    setBolge('Marmara Bölgesi');
    setIsActive(true);
    setError('');
    setOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setKod(item.kod);
    setAd(item.ad);
    setSorumlu(item.sorumlu || '');
    setBolge(item.bolge || 'Marmara Bölgesi');
    setIsActive(item.isActive !== false);
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check active stock balance if editing and deactivating
    if (editItem && !isActive) {
      try {
        const sRes = await api.get('/hareketler/stok-durum', { params: { depoId: editItem.id, pageSize: 5000 } });
        const itemsInDepo = sRes.data.items || [];
        const totalDepoStock = itemsInDepo.reduce((sum, i) => sum + (i.bakiye || 0), 0);
        if (totalDepoStock > 0) {
          setError(`Bu depoda henüz ${totalDepoStock.toLocaleString('tr-TR')} adet aktif stok mevcuttur. Pasife almadan önce stokları başka bir depoya transfer ediniz.`);
          return;
        }
      } catch (err) {
        console.error('Depo stok kontrolü yapılamadı:', err);
      }
    }

    try {
      if (editItem) {
        await api.put(`/depolar/${editItem.id}`, { kod, ad, sorumlu, bolge, isActive });
      } else {
        await api.post('/depolar', { kod, ad, sorumlu, bolge });
      }
      setOpen(false);
      fetchDepolar();
    } catch (err) {
      setError(err.response?.data?.message || 'İşlem başarısız oldu.');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Action Bar & Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Depo Tanımları & Lokasyon Yönetimi
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
            Sistemdeki tüm fiziksel, bölgesel ve hurda depolarınızı tek ekrandan yönetin.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700, px: 3, py: 1 }}
        >
          + Yeni Depo Ekle
        </Button>
      </Box>

      {/* Warehouses Table with Region Badges */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table
            size="small"
            sx={{
              minWidth: 700,
              '& .MuiTableCell-root': {
                py: 0.7,
                px: 1.8,
                fontSize: '0.86rem',
              },
            }}
          >
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Depo İkonu & Kodu</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Depo Adı / Lokasyonu</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bölge / Kategori</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sorumlu Personel</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Durum</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {depolar.map((row) => (
                <TableRow key={row.id} hover sx={{ opacity: row.isActive !== false ? 1 : 0.55 }}>
                  <TableCell>
                    <Chip
                      icon={getDepoIcon(row.kod || row.ad)}
                      label={row.kod}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.ad}</TableCell>
                  <TableCell>
                    <Chip
                      icon={<LocationIcon fontSize="small" />}
                      label={row.bolge || 'Marmara Bölgesi'}
                      size="small"
                      sx={{ bgcolor: '#f1f5f9', fontWeight: 600, color: '#334155' }}
                    />
                  </TableCell>
                  <TableCell>{row.sorumlu || '-'}</TableCell>
                  <TableCell align="center">
                    {row.isActive !== false ? (
                      <Chip label="Aktif" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Chip label="Pasif" color="default" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Düzenle">
                      <IconButton color="primary" size="small" onClick={() => handleOpenEdit(row)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Add / Edit Modal */}
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editItem ? 'Depo Bilgisi Düzenle' : 'Yeni Depo Ekle'}
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              margin="dense"
              fullWidth
              size="small"
              label="Depo Kodu (Örn: DEP-MRK, DEP-BLG, DEP-SHA)"
              value={kod}
              onChange={(e) => setKod(e.target.value)}
              required
              helperText="💡 İpucu: Koda MRK (Merkez), BLG (Bölge), SHA (Saha) veya HRD (Hurda) eklerseniz simge otomatik değişir."
            />
            <TextField
              margin="dense"
              fullWidth
              size="small"
              label="Depo Adı / Lokasyon"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              required
            />
            <TextField
              select
              margin="dense"
              fullWidth
              size="small"
              label="Bölge / Lokasyon Kategorisi *"
              value={bolge}
              onChange={(e) => setBolge(e.target.value)}
              required
            >
              {BOLGELER.map((b, idx) => (
                <MenuItem key={idx} value={b}>
                  📍 {b}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="dense"
              fullWidth
              size="small"
              label="Sorumlu Personel"
              value={sorumlu}
              onChange={(e) => setSorumlu(e.target.value)}
            />
            {editItem && (
              <TextField
                select
                margin="dense"
                fullWidth
                size="small"
                label="Depo Aktiflik Durumu"
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <MenuItem value="true">🟢 Aktif Depo</MenuItem>
                <MenuItem value="false">🔴 Pasif Depo</MenuItem>
              </TextField>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>
              Vazgeç
            </Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5, px: 4 }}>
              Kaydet
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Depolar;
