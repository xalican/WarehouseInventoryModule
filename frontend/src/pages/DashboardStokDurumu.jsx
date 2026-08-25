import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import * as XLSX from 'xlsx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Autocomplete,
  TablePagination,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
  MenuBook as BookIcon,
  AddShoppingCart as EntryIcon,
  RemoveShoppingCart as ExitIcon,
  CompareArrows as TransferIcon,
  Assessment as AssessmentIcon,
  Warehouse as WarehouseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  ShowChart as ShowChartIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Business as BuildingIcon,
  Domain as DomainIcon,
  Engineering as FieldIcon,
  DeleteSweep as ScrapIcon,
  Storefront as StoreIcon,
} from '@mui/icons-material';

const getDepoIcon = (kodOrName) => {
  const str = (kodOrName || '').toLowerCase();
  if (str.includes('mrk') || str.includes('merkez')) return <BuildingIcon fontSize="small" />;
  if (str.includes('blg') || str.includes('bölge')) return <DomainIcon fontSize="small" />;
  if (str.includes('sha') || str.includes('saha')) return <FieldIcon fontSize="small" />;
  if (str.includes('hrd') || str.includes('hurda')) return <ScrapIcon fontSize="small" />;
  return <StoreIcon fontSize="small" />;
};

const translateRegionName = (name, lang) => {
  if (!name) return '';
  if (lang !== 'en') return name;
  if (name.includes('Akdeniz')) return 'Mediterranean Region';
  if (name.includes('Marmara')) return 'Marmara Region';
  if (name.includes('Saha') || name.includes('Hurda')) return 'Field & Scrap Warehouses';
  if (name.includes('Anadolu')) return 'Central Anatolia Region';
  return name;
};

const DashboardStokDurumu = () => {
  const { t, lang } = useLanguage();
  const { currency, formatMoney, rates } = useCurrency();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0); // 0: Stok Tablosu & Arama, 1: Analiz Grafikleri
  const [items, setItems] = useState([]);
  const [allSummaryItems, setAllSummaryItems] = useState([]); // All items for full charts & totals
  const [totalCount, setTotalCount] = useState(0);
  const [criticalTotalCount, setCriticalTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [depolar, setDepolar] = useState([]);
  const [gruplar, setGruplar] = useState([]);
  const [malzemeOptions, setMalzemeOptions] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Autocomplete & Interactive Filters
  const [selectedBolge, setSelectedBolge] = useState(null);
  const [selectedDepo, setSelectedDepo] = useState(null);
  const [selectedGrup, setSelectedGrup] = useState(null);
  const [selectedMalzeme, setSelectedMalzeme] = useState(null);
  const [search, setSearch] = useState('');
  const [sadeceKritik, setSadeceKritik] = useState(false);

  const usdRate = rates.USD || 35.0;

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Table Pagination Params (10 items per page)
      const params = {
        page: page + 1,
        pageSize: pageSize,
      };
      if (selectedDepo) params.depoId = selectedDepo.id;
      if (selectedGrup) params.malzemeGrubuId = selectedGrup.id;
      if (selectedMalzeme) {
        params.q = selectedMalzeme.kod || selectedMalzeme.ad;
      } else if (search && search.trim().length >= 3) {
        params.q = search.trim();
      }
      if (sadeceKritik) params.kritik = true;

      // 2. All-Inventory Summary Params (Fetches ALL records across all pages for Charts & KPI totals)
      const allSummaryParams = {
        pageSize: 5000,
      };
      if (selectedDepo) allSummaryParams.depoId = selectedDepo.id;
      if (selectedGrup) allSummaryParams.malzemeGrubuId = selectedGrup.id;
      if (selectedMalzeme) {
        allSummaryParams.q = selectedMalzeme.kod || selectedMalzeme.ad;
      } else if (search && search.trim().length >= 3) {
        allSummaryParams.q = search.trim();
      }
      if (sadeceKritik) allSummaryParams.kritik = true;

      // 3. Dynamic Filter Params for Critical Counter KPI Card
      const criticalParams = {
        kritik: true,
        pageSize: 1,
      };
      if (selectedDepo) criticalParams.depoId = selectedDepo.id;
      if (selectedGrup) criticalParams.malzemeGrubuId = selectedGrup.id;
      if (selectedMalzeme) {
        criticalParams.q = selectedMalzeme.kod || selectedMalzeme.ad;
      } else if (search && search.trim().length >= 3) {
        criticalParams.q = search.trim();
      }

      const [stokRes, allStokRes, depoRes, grupRes, malzRes, criticalRes, recentRes] = await Promise.all([
        api.get('/hareketler/stok-durum', { params }), // Paginated items for Table
        api.get('/hareketler/stok-durum', { params: allSummaryParams }), // ALL items for Charts & Totals
        api.get('/depolar'),
        api.get('/malzemeler/gruplar'),
        api.get('/malzemeler', { params: { pageSize: 200 } }),
        api.get('/hareketler/stok-durum', { params: criticalParams }),
        api.get('/hareketler', { params: { pageSize: 5 } }),
      ]);

      setItems(stokRes.data.items || []);
      setAllSummaryItems(allStokRes.data.items || []);
      setTotalCount(stokRes.data.totalCount || 0);
      setCriticalTotalCount(criticalRes.data.totalCount || 0);
      setDepolar(depoRes.data);
      setGruplar(grupRes.data);
      setMalzemeOptions(malzRes.data.items || []);
      setRecentMovements(recentRes.data.items || []);
    } catch (err) {
      console.error('Stok verileri çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDepo, selectedGrup, selectedMalzeme, sadeceKritik, page, pageSize]);

  const handleExportExcel = () => {
    const exportData = allSummaryItems.map((item) => ({
      [t('materialCode')]: item.malzemeKodu,
      [t('materialName')]: item.malzemeAdi,
      [t('category')]: item.malzemeGrubuAd,
      [t('warehouse')]: item.depoAdi,
      [t('currentBalance')]: `${item.bakiye} ${item.birim}`,
      [t('criticalLevel')]: `${item.kritikStokSeviyesi} ${item.birim}`,
      [t('status')]: item.isKritik ? t('criticalWarning') : t('available'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('stockStatus'));
    XLSX.writeFile(workbook, `Stok_Durumu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Calculated across ALL inventory records (Not just page 1)
  const toplamBakiye = useMemo(() => {
    return allSummaryItems.reduce((acc, curr) => acc + curr.bakiye, 0);
  }, [allSummaryItems]);

  // Tahmini Toplam Stok Değeri (TRY & USD) across ALL inventory records
  const estimatedTotalValueTRY = useMemo(() => {
    return allSummaryItems.reduce((acc, curr) => {
      const avgPrice = curr.kritikStokSeviyesi > 20 ? 180.0 : 420.0;
      return acc + (curr.bakiye * avgPrice);
    }, 0);
  }, [allSummaryItems]);

  const estimatedTotalValueUSD = estimatedTotalValueTRY / usdRate;

  // Depo Bazlı Stok Dağılımı Verileri (Tüm Verileri Dahil Eder)
  const warehouseDistribution = useMemo(() => {
    const map = {};
    depolar.forEach((d) => {
      map[d.ad] = 0;
    });
    allSummaryItems.forEach((item) => {
      const dName = item.depoAdi || 'Diğer';
      map[dName] = (map[dName] || 0) + item.bakiye;
    });
    const maxVal = Math.max(...Object.values(map), 1);
    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      percent: count > 0 ? Math.round((count / maxVal) * 100) : 0,
    }));
  }, [allSummaryItems, depolar]);

  // Bölgesel Depo Gruplaması (Çözüm C: 100+ Depo İçin Katlanabilir Akordeon Yapısı)
  const regionalWarehouseDistribution = useMemo(() => {
    const regionMap = {};

    depolar.forEach((d) => {
      const regionName = d.bolge || 'Marmara Bölgesi';
      if (!regionMap[regionName]) {
        regionMap[regionName] = {
          regionName,
          totalQty: 0,
          depots: [],
        };
      }

      const depotQty = allSummaryItems
        .filter((item) => item.depoId === d.id)
        .reduce((sum, curr) => sum + curr.bakiye, 0);

      regionMap[regionName].totalQty += depotQty;
      regionMap[regionName].depots.push({
        id: d.id,
        kod: d.kod,
        ad: d.ad,
        sorumlu: d.sorumlu,
        count: depotQty,
      });
    });

    const allDepotCounts = Object.values(regionMap).flatMap((r) => r.depots.map((dp) => dp.count));
    const maxVal = Math.max(...allDepotCounts, 1);

    return Object.values(regionMap).map((r) => ({
      ...r,
      depots: r.depots.map((dp) => ({
        ...dp,
        percent: dp.count > 0 ? Math.round((dp.count / maxVal) * 100) : 0,
      })),
    }));
  }, [allSummaryItems, depolar]);

  // Kategori Bazlı Stok Dağılımı Verileri (Tüm Kategorileri & Tüm Sayfaları Dahil Eder)
  const categoryDistribution = useMemo(() => {
    const map = {};
    gruplar.forEach((g) => {
      map[g.ad] = 0;
    });
    allSummaryItems.forEach((item) => {
      const gName = item.malzemeGrubuAd || 'Diğer';
      map[gName] = (map[gName] || 0) + item.bakiye;
    });
    const total = Math.max(Object.values(map).reduce((a, b) => a + b, 0), 1);
    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      percent: count > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [allSummaryItems, gruplar]);

  const hasActiveFilter = Boolean(selectedDepo || selectedGrup || selectedMalzeme || (search && search.trim().length >= 3));

  return (
    <Box sx={{ width: '100%' }}>
      
      {/* Top Header Bar / Quick Actions */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
            {t('dashWelcomeTitle') || 'Stok & Depo Yönetim Paneli'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
            {t('dashSubtitle') || 'Canlı depo envanter takibi, hareket analizleri ve kritik stok uyarı kontrolü.'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EntryIcon />}
            onClick={() => navigate('/fis-olustur')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 2.5, py: 1 }}
          >
            {t('quickNewInbound') || 'Yeni Giriş Fişi'}
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<TransferIcon />}
            onClick={() => navigate('/fis-olustur')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 2.5, py: 1 }}
          >
            {t('quickTransfer') || 'Transfer Yap'}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/raporlar')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 2.5, py: 1 }}
          >
            {t('quickReports') || 'Analiz Raporları'}
          </Button>
        </Box>
      </Box>

      {/* 4 TOP SUMMARY METRIC CARDS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3.5,
          width: '100%',
        }}
      >
        {/* 1. TOPLAM KALEM SAYISI */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {t('totalItems') || 'TOPLAM KALEM SAYISI'}
            </Typography>
            <CategoryIcon color="primary" fontSize="small" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.8 }}>
            <Typography variant="h4" sx={{ fontWeight: 650, color: '#0f172a' }}>
              {totalCount}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b' }}>
              {lang === 'en' ? 'Items' : 'Kalem'}
            </Typography>
          </Box>
        </Paper>

        {/* 2. KRİTİK SEVİYE UYARISI */}
        <Paper
          elevation={0}
          onClick={() => {
            setSadeceKritik(!sadeceKritik);
            setPage(0);
          }}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: sadeceKritik ? '2.5px solid #dc2626' : '1.5px solid #fca5a5',
            bgcolor: sadeceKritik ? '#fef2f2' : '#ffffff',
            width: '100%',
            boxSizing: 'border-box',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: sadeceKritik ? '0 4px 14px rgba(220, 38, 38, 0.25)' : 'none',
            '&:hover': {
              borderColor: '#dc2626',
              bgcolor: '#fff5f5',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 650 }}>
              {t('criticalWarning')} {sadeceKritik ? `🎯 ${t('filteredSuffix')}` : hasActiveFilter ? t('filterBySuffix') : t('clickToFilterSuffix')}
            </Typography>
            <WarningIcon color="error" fontSize="small" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.8 }}>
            <Typography variant="h4" sx={{ fontWeight: 650, color: '#dc2626' }}>
              {criticalTotalCount}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#dc2626' }}>
              {t('itemsUnit')}
            </Typography>
          </Box>
        </Paper>

        {/* 3. TAHMİNİ TOPLAM STOK DEĞERİ (₺ & $) */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {t('totalStockValue')}
            </Typography>
            <AttachMoneyIcon color="success" fontSize="small" />
          </Box>
          <Box sx={{ mt: 0.5 }}>
            {currency === 'USD' ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 650, color: '#2563eb' }}>
                  $ {estimatedTotalValueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a', display: 'block', mt: 0.2 }}>
                  ₺ {estimatedTotalValueTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </Typography>
              </>
            ) : currency === 'EUR' ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 650, color: '#2563eb' }}>
                  € {(estimatedTotalValueTRY / (rates.EUR || 38.0)).toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a', display: 'block', mt: 0.2 }}>
                  ₺ {estimatedTotalValueTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" sx={{ fontWeight: 650, color: '#2563eb' }}>
                  ₺ {estimatedTotalValueTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a', display: 'block', mt: 0.2 }}>
                  $ {estimatedTotalValueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Typography>
              </>
            )}
          </Box>
        </Paper>

        {/* 4. AKTİF DEPO SAYISI & FİZİKSEL BAKİYE */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {t('activeDepotAndBalance')}
            </Typography>
            <WarehouseIcon color="primary" fontSize="small" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.8 }}>
            <Typography variant="h4" sx={{ fontWeight: 650, color: '#0f172a' }}>
              {depolar.length}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2563eb' }}>
              {t('depotUnit')} ({toplamBakiye.toLocaleString('tr-TR')} {t('pcsUnit')})
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* EXECUTIVE HCI TAB NAVIGATION */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' },
          }}
        >
          <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label={t('tabStockListSearch')} />
          <Tab icon={<AssessmentIcon fontSize="small" />} iconPosition="start" label={t('tabRegionalChartsMovements')} />
        </Tabs>
      </Box>

      {activeTab === 1 && (
        /* 3 EXECUTIVE VISUAL WIDGETS */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
            gap: 2.5,
            mb: 3.5,
            width: '100%',
            alignItems: 'stretch',
          }}
        >
        {/* WIDGET 1: Depo Bazlı Stok Dağılımı */}
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <WarehouseIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                {t('warehouseDistTitle')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, flexGrow: 1 }}>
              {regionalWarehouseDistribution.map((region, rIdx) => (
                <Accordion
                  key={rIdx}
                  defaultExpanded={false}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px !important',
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="small" />}
                    sx={{ bgcolor: '#f8fafc', py: 0.5, px: 2, minHeight: 44 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 650, color: '#0f172a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <LocationIcon fontSize="small" color="primary" />
                        {translateRegionName(region.regionName, lang)} ({region.depots.length} {lang === 'en' ? 'Warehouses' : 'Depo'})
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb', bgcolor: '#eff6ff', px: 1, py: 0.3, borderRadius: 1.5 }}>
                        {region.totalQty.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')} {lang === 'en' ? 'Pcs' : 'Adet'}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {region.depots.map((item, idx) => (
                        <Box
                          key={idx}
                          onClick={() => {
                            setSelectedDepo(item.id);
                            setPage(0);
                          }}
                          sx={{
                            cursor: 'pointer',
                            p: 1,
                            borderRadius: 2,
                            '&:hover': { bgcolor: '#f8fafc' },
                            transition: 'background 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                              🏢 {item.ad}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2563eb', fontSize: '0.82rem' }}>
                              {item.count.toLocaleString('tr-TR')} {t('pcsUnit')}
                            </Typography>
                          </Box>
                          <Box sx={{ width: '100%', height: 7, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <Box
                              sx={{
                                width: `${Math.min(100, Math.max(0, item.percent))}%`,
                                height: '100%',
                                bgcolor: item.count === 0 ? '#cbd5e1' : idx === 0 ? '#2563eb' : idx === 1 ? '#10b981' : '#f59e0b',
                                borderRadius: 4,
                                transition: 'width 0.5s ease',
                              }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* WIDGET 2: Kategoriye Göre Stok Dağılımı */}
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <CategoryIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                {t('categoryDistTitle')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, flexGrow: 1 }}>
              {categoryDistribution.map((item, idx) => (
                <Box key={idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                      🏷️ {item.name}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#16a34a', fontSize: '0.85rem' }}>
                      {item.count.toLocaleString('tr-TR')} {t('pcsUnit')}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.min(100, Math.max(0, item.percent))}%`,
                        height: '100%',
                        bgcolor: item.count === 0 ? '#cbd5e1' : idx === 0 ? '#10b981' : idx === 1 ? '#2563eb' : idx === 2 ? '#8b5cf6' : '#f59e0b',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* WIDGET 3: Son Stok Hareketleri Akışı */}
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ShowChartIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  {t('recentMovementsTitle')}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => navigate('/hareketler')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {t('seeAll')}
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #f1f5f9', flexGrow: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, py: 1 }}>{t('receiptNo')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1 }}>{t('movementType')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1 }}>{t('date')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {t('noRecords')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentMovements.map((m, idx) => (
                      <TableRow key={idx} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/hareketler')}>
                        <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 0.8 }}>{m.fisNo}</TableCell>
                        <TableCell sx={{ py: 0.8 }}>
                          <Chip
                            label={m.hareketTipiAd}
                            color={m.hareketTipi === 1 ? 'primary' : m.hareketTipi === 2 ? 'error' : 'success'}
                            size="small"
                            sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontSize: '0.8rem', py: 0.8 }}>
                          {new Date(m.tarih).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
      )}

      {/* FILTER BAR & STOCK TABLE - ACTIVE ON TAB 0 */}
      {activeTab === 0 && (
        <>
          <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
            <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>
              {t('searchPanelTitle')}
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, px: 3, py: 1 }}
            >
              {t('exportExcel')}
            </Button>
          </Box>

          {/* BÖLGESEL DEPO LOKASYON FİLTRESİ (2-TIER REGIONAL DEPOT FILTER - 100+ DEPO İÇİN ÖLÇEKLENEBİLİR) */}
          <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ fontWeight: 650, color: '#64748b', display: 'block', mb: 1.2 }}>
              🏢 {t('depotLocationFilterLabel')}
            </Typography>

            {/* AŞAMA 1: BÖLGE SEÇİMİ CHIP'LERİ */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: selectedBolge ? 1.5 : 0 }}>
              <Chip
                label={`🏢 ${t('allWarehousesAndRegions')}`}
                clickable
                color={!selectedBolge && !selectedDepo ? 'primary' : 'default'}
                variant={!selectedBolge && !selectedDepo ? 'filled' : 'outlined'}
                onClick={() => {
                  setSelectedBolge(null);
                  setSelectedDepo(null);
                  setPage(0);
                }}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              />

              {regionalWarehouseDistribution.map((reg, idx) => (
                <Chip
                  key={idx}
                  icon={<LocationIcon fontSize="small" />}
                  label={`${translateRegionName(reg.regionName, lang)} (${reg.depots.length})`}
                  clickable
                  color={selectedBolge === reg.regionName ? 'primary' : 'default'}
                  variant={selectedBolge === reg.regionName ? 'filled' : 'outlined'}
                  onClick={() => {
                    setSelectedBolge(reg.regionName);
                    setSelectedDepo(null);
                    setPage(0);
                  }}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                />
              ))}
            </Box>

            {/* AŞAMA 2: SEÇİLEN BÖLGEYE AİT DEPOLAR */}
            {selectedBolge && (
              <Box sx={{ pt: 1.2, borderTop: '1px dashed #cbd5e1', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ width: '100%', fontWeight: 600, color: '#2563eb', mb: 0.5 }}>
                  📍 {translateRegionName(selectedBolge, lang)} {t('regionInDepots')}
                </Typography>
                {regionalWarehouseDistribution
                  .find((r) => r.regionName === selectedBolge)
                  ?.depots.map((dItem) => (
                    <Chip
                      key={dItem.id}
                      icon={getDepoIcon(dItem.kod || dItem.ad)}
                      label={`${dItem.kod} - ${dItem.ad}`}
                      clickable
                      color={selectedDepo?.id === dItem.id ? 'success' : 'default'}
                      variant={selectedDepo?.id === dItem.id ? 'filled' : 'outlined'}
                      onClick={() => {
                        const targetDepo = depolar.find((dp) => dp.id === dItem.id);
                        setSelectedDepo(targetDepo || null);
                        setPage(0);
                      }}
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                    />
                  ))}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2.5,
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Depo Lokasyonu Seçimi */}
            <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
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
                ListboxProps={{
                  sx: {
                    minWidth: 340,
                    fontSize: '0.9rem',
                    '& .MuiAutocomplete-option': { py: 1.2 },
                  },
                }}
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

            {/* Malzeme Kategorisi */}
            <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
              <Autocomplete
                fullWidth
                size="small"
                options={gruplar}
                getOptionLabel={(option) => option.ad}
                value={selectedGrup}
                onChange={(event, newValue) => {
                  setSelectedGrup(newValue);
                  setPage(0);
                }}
                ListboxProps={{
                  sx: {
                    minWidth: 360,
                    maxHeight: 320,
                    fontSize: '0.92rem',
                    '& .MuiAutocomplete-option': {
                      py: 1.2,
                      px: 2,
                      borderBottom: '1px solid #f1f5f9',
                      whiteSpace: 'nowrap',
                    },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('selectGroup')}
                    placeholder={t('selectGroupPlaceholder')}
                    sx={{ width: '100%' }}
                  />
                )}
                sx={{ width: '100%' }}
              />
            </Box>

            {/* Malzeme Adı / Kodu Ara */}
            <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
              <Autocomplete
                fullWidth
                size="small"
                freeSolo
                options={malzemeOptions}
                getOptionLabel={(option) => typeof option === 'string' ? option : `${option.kod} - ${option.ad}`}
                value={selectedMalzeme}
                onInputChange={(event, newInputValue) => {
                  setSearch(newInputValue);
                  if (newInputValue.length >= 3 || newInputValue.length === 0) {
                    setPage(0);
                  }
                }}
                onChange={(event, newValue) => {
                  setSelectedMalzeme(typeof newValue === 'string' ? null : newValue);
                  setPage(0);
                }}
                ListboxProps={{
                  sx: {
                    minWidth: 380,
                    maxHeight: 300,
                    '& .MuiAutocomplete-option': { py: 1.2 },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('searchMaterial')}
                    placeholder={t('searchMaterialPlaceholder')}
                    sx={{ width: '100%' }}
                  />
                )}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Main Stock Table with Compact Row Spacing (py: 0.7) */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
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
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>{t('materialCode')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>{t('materialName')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>{t('category')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>{t('warehouse')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, py: 1.2 }}>{t('currentBalance')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, py: 1.2 }}>{t('criticalLevel')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, py: 1.2 }}>{t('status')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, py: 1.2 }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <WarningIcon sx={{ fontSize: 44, color: '#cbd5e1' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569' }}>
                          Aramanıza veya filtrelerinize uygun stok kaydı bulunamadı
                        </Typography>
                        {hasActiveFilter && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={handleClearFilters}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, mt: 0.5 }}
                          >
                            Filtreleri Temizle
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row, index) => (
                    <TableRow key={`${row.malzemeId}-${row.depoId}-${index}`} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.malzemeKodu}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{row.malzemeAdi}</TableCell>
                      <TableCell>{row.malzemeGrubuAd}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{row.depoAdi}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.95rem', color: row.isKritik ? '#dc2626' : '#166534' }}>
                        {row.bakiye.toLocaleString('tr-TR')} {lang === 'en' ? (row.birim === 'Adet' ? 'Pcs' : row.birim) : row.birim}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#64748b' }}>
                        {row.kritikStokSeviyesi} {lang === 'en' ? (row.birim === 'Adet' ? 'Pcs' : row.birim) : row.birim}
                      </TableCell>
                      <TableCell align="center">
                        {row.isKritik ? (
                          <Chip
                            icon={<WarningIcon fontSize="small" style={{ color: '#dc2626' }} />}
                            label={t('criticalWarning')}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: '#ffffff',
                              color: '#dc2626',
                              border: '1.5px solid #dc2626',
                              height: 24,
                              fontSize: '0.72rem',
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<OkIcon fontSize="small" />}
                            label={t('available')}
                            color="success"
                            variant="outlined"
                            size="small"
                            sx={{ height: 24, fontSize: '0.72rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('kartoteks')}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => navigate(`/kartoteks?malzemeId=${row.malzemeId}&depoId=${row.depoId}`)}
                          >
                            <BookIcon fontSize="small" />
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
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPageSize(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage={t('rowsPerPage')}
            />
          </>
        )}
      </TableContainer>
      </>
      )}
    </Box>
  );
};

export default DashboardStokDurumu;
