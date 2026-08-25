import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
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
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Autocomplete,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

const STANDARDIZED_UNITS = [
  { value: 'Adet', label: 'Adet (Pcs)' },
  { value: 'Metre', label: 'Metre (Meter)' },
  { value: 'Kg', label: 'Kg (Kilogram)' },
  { value: 'Paket', label: 'Paket (Package)' },
  { value: 'Kutu', label: 'Kutu (Box)' },
  { value: 'Litre', label: 'Litre (Liter)' },
  { value: 'Ton', label: 'Ton' },
  { value: 'Set', label: 'Set' },
  { value: 'Rulo', label: 'Rulo (Roll)' },
  { value: 'Plaka', label: 'Plaka (Plate)' },
];

const MalzemeTanimlari = () => {
  const { t, lang } = useLanguage();
  const [gruplar, setGruplar] = useState([]);
  const [allMalzemeler, setAllMalzemeler] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter State
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedGrupFilter, setSelectedGrupFilter] = useState('');

  // Form State for Definition Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form Inputs
  const [selectedGrupId, setSelectedGrupId] = useState('');
  const [selectedAdOption, setSelectedAdOption] = useState(null);
  const [customAdInput, setCustomAdInput] = useState('');
  const [kod, setKod] = useState('');
  const [birim, setBirim] = useState('Adet');
  const [markaModel, setMarkaModel] = useState('');
  const [teknikOzellik, setTeknikOzellik] = useState('');
  const [kritikStokSeviyesi, setKritikStokSeviyesi] = useState(10);
  const [maxStokSeviyesi, setMaxStokSeviyesi] = useState(500);
  const [aciklama, setAciklama] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        pageSize: pageSize,
      };
      if (selectedGrupFilter) params.grupId = selectedGrupFilter;

      const [mRes, gRes, allRes] = await Promise.all([
        api.get('/malzemeler', { params }),
        api.get('/malzemeler/gruplar'),
        api.get('/malzemeler', { params: { pageSize: 500 } }),
      ]);

      setItems(mRes.data.items || []);
      setTotalCount(mRes.data.totalCount || 0);
      setGruplar(gRes.data || []);
      setAllMalzemeler(allRes.data.items || []);
    } catch (err) {
      console.error('Malzeme tanımları çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedGrupFilter, page, pageSize]);

  // KATEGORİYE ÖZEL İSİM LİSTESİ (Strict Scope: Seçilen Kategori Dışındaki Ürün Adları GÖZÜKMEZ!)
  const filteredNameOptions = allMalzemeler.filter((m) => {
    if (!selectedGrupId) return false;
    return m.malzemeGrubuId === parseInt(selectedGrupId);
  });

  const handleOpenAdd = () => {
    setEditItem(null);
    const defaultGrup = gruplar.length > 0 ? gruplar[0].id : '';
    setSelectedGrupId(defaultGrup);
    setSelectedAdOption(null);
    setCustomAdInput('');
    setKod(`MLZ-${Date.now().toString().slice(-4)}`);
    setBirim('Adet');
    setMarkaModel('');
    setTeknikOzellik('');
    setKritikStokSeviyesi(10);
    setMaxStokSeviyesi(500);
    setAciklama('');
    setIsActive(true);
    setError('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setSelectedGrupId(item.malzemeGrubuId);
    setSelectedAdOption(item);
    setCustomAdInput(item.ad);
    setKod(item.kod);
    setBirim(item.birim || 'Adet');
    setMarkaModel(item.markaModel || '');
    setTeknikOzellik(item.teknikOzellik || '');
    setKritikStokSeviyesi(item.kritikStokSeviyesi || 10);
    setMaxStokSeviyesi(item.maxStokSeviyesi || 500);
    setAciklama(item.aciklama || '');
    setIsActive(item.isActive !== false);
    setError('');
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalAd = selectedAdOption
      ? (typeof selectedAdOption === 'string' ? selectedAdOption : selectedAdOption.ad)
      : customAdInput;

    if (!selectedGrupId) {
      setError('Lütfen bir Malzeme Kategorisi seçiniz.');
      return;
    }
    if (!finalAd || !finalAd.trim()) {
      setError('Lütfen geçerli bir Malzeme Adı seçiniz veya yazınız.');
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        await api.put(`/malzemeler/${editItem.id}`, {
          birim,
          malzemeGrubuId: parseInt(selectedGrupId),
          markaModel,
          teknikOzellik,
          kritikStokSeviyesi: parseFloat(kritikStokSeviyesi),
          maxStokSeviyesi: parseFloat(maxStokSeviyesi),
          aciklama,
          isActive,
        });
      } else {
        await api.post('/malzemeler', {
          kod,
          ad: finalAd.trim(),
          birim,
          malzemeGrubuId: parseInt(selectedGrupId),
          markaModel,
          teknikOzellik,
          kritikStokSeviyesi: parseFloat(kritikStokSeviyesi),
          maxStokSeviyesi: parseFloat(maxStokSeviyesi),
          aciklama,
        });
      }
      setOpenDialog(false);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Tanım kaydedilirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Malzeme Tanımları ve Özellik Yönetimi
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800, px: 3, py: 1 }}
        >
          Yeni Malzeme Tanımı Ekle
        </Button>
      </Box>

      {/* Filter Card */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center', width: '100%' }}>
            <Box sx={{ flex: '1 1 320px', minWidth: 280 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t('selectGroup')}
                value={selectedGrupFilter}
                onChange={(e) => {
                  setSelectedGrupFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Tüm Malzeme Kategorileri</MenuItem>
                {gruplar.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.ad}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Master Definitions Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table sx={{ minWidth: 750 }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('materialCode')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('materialName')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('category')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('unit')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Marka / Model</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Teknik Özellik</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Min / Max Limit</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('status')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {t('noRecords')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id} hover sx={{ opacity: row.isActive ? 1 : 0.55 }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{row.kod}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.ad}</TableCell>
                      <TableCell>{row.malzemeGrubuAd}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>{row.birim}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{row.markaModel || '-'}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{row.teknikOzellik || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        <span style={{ color: '#dc2626' }}>{row.kritikStokSeviyesi}</span> / <span style={{ color: '#166534' }}>{row.maxStokSeviyesi || 1000}</span> {row.birim}
                      </TableCell>
                      <TableCell align="center">
                        {row.isActive ? (
                          <Chip label={t('active')} color="success" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Chip label={t('passive')} color="default" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('edit')}>
                          <IconButton color="primary" size="small" onClick={() => handleOpenEdit(row)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 50, 100]}
              labelRowsPerPage={t('rowsPerPage')}
            />
          </>
        )}
      </TableContainer>

      {/* LARGE SPACIOUS MODAL (maxWidth="lg") */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 2 }}>
          {editItem ? 'Malzeme Tanımı ve Özelliklerini Düzenle' : 'Yeni Malzeme Tanım Ekranı'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 3.5 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
              {/* SATIR 1: ADIM 1 - KATEGORİ SEÇİMİ (TEK BAŞINA TAM 100% SATIR) */}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="1. Malzeme Kategorisi Seçiniz *"
                  value={selectedGrupId}
                  onChange={(e) => {
                    setSelectedGrupId(e.target.value);
                    setSelectedAdOption(null);
                  }}
                  required
                  InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                >
                  {gruplar.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.ad}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* SATIR 2: ADIM 2 - MALZEME ADI (TEK BAŞINA TAM 100% SATIR - YAZININ TAMAMI GÖRÜNÜR!) */}
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  freeSolo
                  disabled={!selectedGrupId}
                  options={filteredNameOptions}
                  getOptionLabel={(option) => typeof option === 'string' ? option : `${option.kod} - ${option.ad}`}
                  filterOptions={(options, state) => {
                    if (!state.inputValue) return options;
                    const search = state.inputValue.toLowerCase();
                    return options.filter(
                      (opt) =>
                        opt.ad.toLowerCase().includes(search) ||
                        opt.kod.toLowerCase().includes(search)
                    );
                  }}
                  value={selectedAdOption}
                  onInputChange={(e, newValue) => setCustomAdInput(newValue)}
                  onChange={(e, newValue) => setSelectedAdOption(newValue)}
                  slotProps={{
                    paper: {
                      sx: {
                        width: '100%',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        borderRadius: 2,
                        '& .MuiAutocomplete-option': {
                          py: 1.5,
                          px: 2,
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          borderBottom: '1px solid #f1f5f9',
                        },
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="2. Malzeme Adı Seçiniz veya Yazınız (Canlı Arama: Örn reg, pe, van) *"
                      placeholder={
                        selectedGrupId
                          ? `Aramak için yazın... [Kategorideki ${filteredNameOptions.length} adet ürün süzülür]`
                          : 'Önce 1. adımdan Malzeme Kategorisi Seçiniz...'
                      }
                      required={!editItem}
                      InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                    />
                  )}
                />
              </Grid>

              {/* SATIR 3: ADIM 3 - BİRİM SEÇİMİ & MALZEME KODU */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="3. Birim Türü Seçiniz *"
                  value={birim}
                  onChange={(e) => setBirim(e.target.value)}
                  required
                  InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                >
                  {STANDARDIZED_UNITS.map((u) => (
                    <MenuItem key={u.value} value={u.value}>
                      {u.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Malzeme Kodu *"
                  value={kod}
                  onChange={(e) => setKod(e.target.value)}
                  disabled={Boolean(editItem)}
                  required
                  InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                />
              </Grid>

              {editItem ? (
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label={t('cardStatus')}
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                  >
                    <MenuItem value="true">🟢 {t('active')}</MenuItem>
                    <MenuItem value="false">🔴 {t('passive')}</MenuItem>
                  </TextField>
                </Grid>
              ) : null}

              {/* EK ÖZELLİKLER */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mt: 1, mb: 1, borderBottom: '2px solid #2563eb', pb: 0.8 }}>
                  📋 Ek Malzeme Nitelikleri & Teknik Özellikleri
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Marka / Üretici / Model"
                  placeholder="Örn: Pietro Fiorentini, Wavin, Kalde"
                  value={markaModel}
                  onChange={(e) => setMarkaModel(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teknik Özellikler / Ölçü"
                  placeholder="Örn: DN-25 PN16, PE-80 SDR11 63mm"
                  value={teknikOzellik}
                  onChange={(e) => setTeknikOzellik(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Kritik Stok Seviyesi (Min Limit)"
                  value={kritikStokSeviyesi}
                  onChange={(e) => setKritikStokSeviyesi(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maksimum Stok Seviyesi (Max Limit)"
                  value={maxStokSeviyesi}
                  onChange={(e) => setMaxStokSeviyesi(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  rows={2}
                  multiline
                  label="Açıklama / Teknik Notlar"
                  placeholder="Ürün kullanımı ve teknik şartname notları..."
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 4, py: 1.2, fontSize: '0.95rem' }}
            >
              {submitting ? 'Kaydediliyor...' : t('save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default MalzemeTanimlari;
