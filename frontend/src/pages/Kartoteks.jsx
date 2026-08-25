import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import * as XLSX from 'xlsx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Autocomplete,
  TextField,
  TablePagination,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Book as BookIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const Kartoteks = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMalzemeId = searchParams.get('malzemeId') || '';
  const initialDepoId = searchParams.get('depoId') || '';

  const [malzemeler, setMalzemeler] = useState([]);
  const [depolar, setDepolar] = useState([]);
  const [selectedMalzeme, setSelectedMalzeme] = useState(null);
  const [selectedDepo, setSelectedDepo] = useState(null);

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [mRes, dRes] = await Promise.all([
          api.get('/malzemeler', { params: { pageSize: 200 } }),
          api.get('/depolar')
        ]);
        const malzList = mRes.data.items || [];
        setMalzemeler(malzList);
        setDepolar(dRes.data);

        const mId = searchParams.get('malzemeId');
        const dId = searchParams.get('depoId');

        if (mId) {
          const foundM = malzList.find((m) => m.id === parseInt(mId));
          if (foundM) setSelectedMalzeme(foundM);
        } else if (malzList.length > 0) {
          setSelectedMalzeme(malzList[0]);
        }

        if (dId) {
          const foundD = dRes.data.find((d) => d.id === parseInt(dId));
          if (foundD) setSelectedDepo(foundD);
        } else {
          setSelectedDepo(null);
        }
      } catch (err) {
        console.error('Liste yüklenemedi:', err);
      }
    };
    loadInitialData();
  }, [searchParams]);

  useEffect(() => {
    if (selectedMalzeme) {
      fetchKartoteks();
    }
  }, [selectedMalzeme, selectedDepo, page, pageSize]);

  const fetchKartoteks = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        pageSize: pageSize,
      };
      if (selectedDepo) params.depoId = selectedDepo.id;

      const res = await api.get(`/hareketler/kartoteks/${selectedMalzeme.id}`, { params });
      setItems(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error('Kartoteks verisi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = items.map((item) => ({
      [t('receiptNo')]: item.fisNo,
      [t('date')]: new Date(item.tarih).toLocaleDateString('tr-TR'),
      [t('movementType')]: item.hareketTipiAd,
      [t('warehouse')]: item.depoAd,
      [t('shelf')]: item.raf,
      [t('cell')]: item.huycre,
      [t('materialStatus')]: item.malzemeDurumuAd,
      'Giriş (+)': item.girisMiktari,
      'Çıkış (-)': item.cikisMiktari,
      [t('runningTotal')]: item.yuruyenBakiye,
      [t('description')]: item.aciklama,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('kartoteks'));
    XLSX.writeFile(workbook, `Kartoteks_${selectedMalzeme?.kod || 'Malzeme'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const isNavigatedFromOtherPage = Boolean(initialMalzemeId || initialDepoId || searchParams.get('fromNotif'));

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Bar - Conditional Back Button & Excel Export */}
      <Box sx={{ display: 'flex', justifyContent: isNavigatedFromOtherPage ? 'space-between' : 'flex-end', alignItems: 'center', mb: 2.5 }}>
        {isNavigatedFromOtherPage && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2.5 }}
          >
            {lang === 'en' ? 'Back to Previous Page' : 'Önceki Ekrana Dön'}
          </Button>
        )}

        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={handleExportExcel}
          disabled={items.length === 0}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
        >
          {t('exportExcel')}
        </Button>
      </Box>

      {/* Autocomplete Selection Bar - FULL WIDTH FLEXBOX */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2.5,
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Malzeme Seçimi */}
            <Box sx={{ flex: '1 1 340px', minWidth: 280 }}>
              <Autocomplete
                fullWidth
                size="small"
                options={malzemeler}
                getOptionLabel={(option) => `${option.kod} - ${option.ad}`}
                value={selectedMalzeme}
                onChange={(event, newValue) => {
                  setSelectedMalzeme(newValue);
                  setPage(0);
                }}
                ListboxProps={{ sx: { minWidth: 380 } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('selectGroup')}
                    placeholder={t('searchMaterialPlaceholder')}
                    sx={{ width: '100%' }}
                  />
                )}
                sx={{ width: '100%' }}
              />
            </Box>

            {/* Depo Filtresi */}
            <Box sx={{ flex: '1 1 340px', minWidth: 280 }}>
              <Autocomplete
                fullWidth
                size="small"
                options={depolar}
                getOptionLabel={(option) => `${option.kod} - ${option.ad}`}
                value={selectedDepo}
                onChange={(event, newValue) => {
                  setSelectedDepo(newValue);
                  setPage(0);
                }}
                ListboxProps={{ sx: { minWidth: 340 } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('selectWarehouse')}
                    placeholder={t('selectWarehousePlaceholder')}
                    sx={{ width: '100%' }}
                  />
                )}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {selectedMalzeme && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700 }}>{t('materialCode')}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e3a8a' }}>{selectedMalzeme.kod}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700 }}>{t('materialName')}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a' }}>{selectedMalzeme.ad}</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 700 }}>{t('runningTotal')}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563eb' }}>
                {items.length > 0 ? items[items.length - 1].yuruyenBakiye : 0} {selectedMalzeme.birim}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Kartoteks Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table
              size="small"
              sx={{
                minWidth: 650,
                '& .MuiTableCell-root': {
                  py: 0.7,
                  px: 1.8,
                  fontSize: '0.86rem',
                },
              }}
            >
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('date')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('receiptNo')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('movementType')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('warehouse')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('shelf')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('cell')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('materialStatus')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#166534' }}>In (+)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#991b1b' }}>Out (-)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#2563eb', bgcolor: '#eff6ff' }}>
                    {t('runningTotal')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {t('noRecords')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row, index) => (
                    <TableRow key={`${row.hareketId}-${index}`} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(row.tarih).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.fisNo}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.hareketTipiAd}
                          size="small"
                          color={row.hareketTipi === 1 ? 'success' : row.hareketTipi === 2 ? 'error' : 'primary'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{row.depoAd}</TableCell>
                      <TableCell>{row.raf || '-'}</TableCell>
                      <TableCell>{row.huycre || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.malzemeDurumuAd}
                          size="small"
                          color={row.malzemeDurumuAd === 'Hurda' ? 'warning' : 'info'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.girisMiktari > 0 ? '#166534' : 'text.disabled' }}>
                        {row.girisMiktari > 0 ? `+${row.girisMiktari}` : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: row.cikisMiktari > 0 ? '#dc2626' : 'text.disabled' }}>
                        {row.cikisMiktari > 0 ? `-${row.cikisMiktari}` : '-'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#1d4ed8', bgcolor: '#f0f9ff' }}>
                        {row.yuruyenBakiye}
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
    </Box>
  );
};

export default Kartoteks;
