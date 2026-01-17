import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, MapPin, ZoomIn, Users, FileCheck, Fingerprint, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { normalizeStateName, VALID_INDIAN_STATES } from '@/lib/indianStates';

type DataCategory = 'enrollment' | 'demographic' | 'biometric' | 'all';

interface StateFeature {
  type: string;
  properties: {
    NAME_1?: string;
    name?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: string;
    coordinates: unknown[];
  };
}

interface GeoJsonData {
  type: string;
  features: StateFeature[];
}

function geoJsonToSvgPath(coordinates: unknown[], bounds: { minX: number; maxX: number; minY: number; maxY: number }, width: number, height: number): string {
  const scale = (coord: [number, number]): [number, number] => {
    const x = ((coord[0] - bounds.minX) / (bounds.maxX - bounds.minX)) * width;
    const y = height - ((coord[1] - bounds.minY) / (bounds.maxY - bounds.minY)) * height;
    return [x, y];
  };

  const processRing = (ring: [number, number][]): string => {
    if (!ring || ring.length < 2) return '';
    const scaled = ring.map(scale);
    return scaled.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + ' Z';
  };

  if (!Array.isArray(coordinates) || coordinates.length === 0) return '';
  
  const first = coordinates[0];
  if (typeof first === 'number') {
    return '';
  } else if (Array.isArray(first) && typeof first[0] === 'number') {
    return processRing(coordinates as [number, number][]);
  } else if (Array.isArray(first) && Array.isArray(first[0]) && typeof first[0][0] === 'number') {
    return (coordinates as [number, number][][]).map(ring => processRing(ring)).join(' ');
  } else {
    return (coordinates as [number, number][][][]).map(polygon => 
      polygon.map((ring) => processRing(ring)).join(' ')
    ).join(' ');
  }
}

export function IndiaChoroplethMap() {
  const { 
    selectedState, 
    setSelectedState, 
    selectedDistrict, 
    setSelectedDistrict,
    enrollmentData,
    demographicData,
    biometricData
  } = useData();

  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [dataCategory, setDataCategory] = useState<DataCategory>('all');
  const [geoData, setGeoData] = useState<GeoJsonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
      .then(res => res.json())
      .then(data => {
        setGeoData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load India GeoJSON:', err);
        setLoading(false);
      });
  }, []);

  const bounds = useMemo(() => {
    if (!geoData) return { minX: 68, maxX: 98, minY: 6, maxY: 38 };
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    const processCoords = (coords: unknown[]) => {
      if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        minX = Math.min(minX, coords[0]);
        maxX = Math.max(maxX, coords[0]);
        minY = Math.min(minY, coords[1]);
        maxY = Math.max(maxY, coords[1]);
      } else if (Array.isArray(coords)) {
        coords.forEach(c => processCoords(c as unknown[]));
      }
    };
    
    geoData.features.forEach(feature => {
      processCoords(feature.geometry.coordinates);
    });
    
    const padX = (maxX - minX) * 0.02;
    const padY = (maxY - minY) * 0.02;
    
    return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
  }, [geoData]);

  const svgWidth = 600;
  const svgHeight = 700;

  const stateStats = useMemo(() => {
    const stats = new Map<string, { enrollment: number; demographic: number; biometric: number; total: number }>();

    enrollmentData.forEach(d => {
      const stateName = normalizeStateName(d.state);
      if (!stateName || !VALID_INDIAN_STATES.includes(stateName)) return;
      const key = stateName.toLowerCase();
      const current = stats.get(key) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.age_0_5 + d.age_5_17 + d.age_18_greater;
      stats.set(key, { ...current, enrollment: current.enrollment + value, total: current.total + value });
    });

    demographicData.forEach(d => {
      const stateName = normalizeStateName(d.state);
      if (!stateName || !VALID_INDIAN_STATES.includes(stateName)) return;
      const key = stateName.toLowerCase();
      const current = stats.get(key) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.demo_age_5_17 + d.demo_age_17_plus;
      stats.set(key, { ...current, demographic: current.demographic + value, total: current.total + value });
    });

    biometricData.forEach(d => {
      const stateName = normalizeStateName(d.state);
      if (!stateName || !VALID_INDIAN_STATES.includes(stateName)) return;
      const key = stateName.toLowerCase();
      const current = stats.get(key) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.bio_age_5_17 + d.bio_age_17_plus;
      stats.set(key, { ...current, biometric: current.biometric + value, total: current.total + value });
    });

    return stats;
  }, [enrollmentData, demographicData, biometricData]);

  const maxValue = useMemo(() => {
    let max = 0;
    stateStats.forEach(stat => {
      const value = dataCategory === 'all' ? stat.total :
                    dataCategory === 'enrollment' ? stat.enrollment :
                    dataCategory === 'demographic' ? stat.demographic :
                    stat.biometric;
      max = Math.max(max, value);
    });
    return max || 1;
  }, [stateStats, dataCategory]);

  const getStateColor = (stateName: string): string => {
    const normalizedName = normalizeStateName(stateName).toLowerCase();
    const stat = stateStats.get(normalizedName);
    
    if (!stat) return 'hsl(var(--muted))';
    
    const value = dataCategory === 'all' ? stat.total :
                  dataCategory === 'enrollment' ? stat.enrollment :
                  dataCategory === 'demographic' ? stat.demographic :
                  stat.biometric;
    
    if (value === 0) return 'hsl(var(--muted))';
    const intensity = value / maxValue;
    
    if (intensity > 0.75) return 'hsl(27, 95%, 45%)';
    if (intensity > 0.5) return 'hsl(27, 95%, 55%)';
    if (intensity > 0.25) return 'hsl(27, 95%, 70%)';
    return 'hsl(27, 95%, 85%)';
  };

  const getStatData = (stateName: string) => {
    const normalizedName = normalizeStateName(stateName).toLowerCase();
    return stateStats.get(normalizedName) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
  };

  const getDistrictsForState = (state: string) => {
    const districts = new Map<string, { enrollment: number; demographic: number; biometric: number; total: number }>();
    const normSearch = normalizeStateName(state).toLowerCase();
    
    enrollmentData.filter(d => normalizeStateName(d.state).toLowerCase() === normSearch).forEach(d => {
      const current = districts.get(d.district) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.age_0_5 + d.age_5_17 + d.age_18_greater;
      districts.set(d.district, { ...current, enrollment: current.enrollment + value, total: current.total + value });
    });
    
    demographicData.filter(d => normalizeStateName(d.state).toLowerCase() === normSearch).forEach(d => {
      const current = districts.get(d.district) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.demo_age_5_17 + d.demo_age_17_plus;
      districts.set(d.district, { ...current, demographic: current.demographic + value, total: current.total + value });
    });
    
    biometricData.filter(d => normalizeStateName(d.state).toLowerCase() === normSearch).forEach(d => {
      const current = districts.get(d.district) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.bio_age_5_17 + d.bio_age_17_plus;
      districts.set(d.district, { ...current, biometric: current.biometric + value, total: current.total + value });
    });
    
    return Array.from(districts.entries()).sort((a, b) => b[1].total - a[1].total);
  };

  const getPincodesForDistrict = (state: string, district: string) => {
    const pincodes = new Map<string, { enrollment: number; demographic: number; biometric: number; total: number }>();
    const normSearch = normalizeStateName(state).toLowerCase();
    
    enrollmentData.filter(d => normalizeStateName(d.state).toLowerCase() === normSearch && d.district === district).forEach(d => {
      const current = pincodes.get(d.pincode) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.age_0_5 + d.age_5_17 + d.age_18_greater;
      pincodes.set(d.pincode, { ...current, enrollment: current.enrollment + value, total: current.total + value });
    });
    
    demographicData.filter(d => normalizeStateName(d.state).toLowerCase() === normSearch && d.district === district).forEach(d => {
      const current = pincodes.get(d.pincode) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.demo_age_5_17 + d.demo_age_17_plus;
      pincodes.set(d.pincode, { ...current, demographic: current.demographic + value, total: current.total + value });
    });
    
    biometricData.filter(d => normalizeStateName(d.state).toLowerCase() === normSearch && d.district === district).forEach(d => {
      const current = pincodes.get(d.pincode) || { enrollment: 0, demographic: 0, biometric: 0, total: 0 };
      const value = d.bio_age_5_17 + d.bio_age_17_plus;
      pincodes.set(d.pincode, { ...current, biometric: current.biometric + value, total: current.total + value });
    });
    
    return Array.from(pincodes.entries()).sort((a, b) => b[1].total - a[1].total);
  };

  const handleBack = () => {
    if (selectedDistrict) setSelectedDistrict(null);
    else if (selectedState) setSelectedState(null);
  };

  const districts = selectedState ? getDistrictsForState(selectedState) : [];
  const maxDistrictValue = districts.length > 0 ? Math.max(...districts.map(d => d[1].total)) : 1;
  const pincodes = selectedState && selectedDistrict ? getPincodesForDistrict(selectedState, selectedDistrict) : [];

  const getDistrictColor = (value: number, max: number): string => {
    if (value === 0 || max === 0) return 'bg-muted';
    const intensity = value / max;
    if (intensity > 0.75) return 'bg-primary';
    if (intensity > 0.5) return 'bg-primary/75';
    if (intensity > 0.25) return 'bg-primary/50';
    return 'bg-primary/25';
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

    const renderMapContent = (isFullscreenMode: boolean) => {
      if (!selectedState) {
        return (
          <div className={`relative ${isFullscreenMode ? 'flex-1 flex flex-col items-center justify-center min-h-0' : ''}`}>
            {loading ? (
              <div className={`flex items-center justify-center ${isFullscreenMode ? 'h-full' : 'h-[500px]'}`}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading map...</span>
              </div>
            ) : geoData ? (
              <div className={`relative ${isFullscreenMode ? 'flex-1 w-full flex items-center justify-center min-h-0' : ''}`}>
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className={isFullscreenMode ? 'h-full w-auto max-w-full' : 'w-full h-auto max-h-[500px]'}
                  style={{ background: 'hsl(var(--background))' }}
                >
                  {geoData.features.map((feature, idx) => {
                    const stateName = feature.properties.NAME_1 || feature.properties.name || `State${idx}`;
                    const path = geoJsonToSvgPath(feature.geometry.coordinates, bounds, svgWidth, svgHeight);
                    const isHovered = hoveredState === stateName;
                    
                    return (
                      <path
                        key={idx}
                        d={path}
                        fill={getStateColor(stateName)}
                        stroke={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                        strokeWidth={isHovered ? 2 : 0.5}
                        className="cursor-pointer transition-all duration-200"
                        style={{ filter: isHovered ? 'brightness(1.1)' : 'none' }}
                        onMouseEnter={(e) => { setHoveredState(stateName); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => { setHoveredState(null); setTooltipPos(null); }}
                        onClick={() => setSelectedState(stateName)}
                      />
                    );
                  })}
                </svg>
                
                {hoveredState && tooltipPos && (
                  <div className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-lg p-3 pointer-events-none" style={{ left: tooltipPos.x + 15, top: tooltipPos.y + 15 }}>
                    <p className="font-semibold text-sm mb-2">{hoveredState}</p>
                    <div className="text-xs space-y-1">
                      <p className="flex items-center gap-1"><Users className="h-3 w-3 text-chart-1" /> Enrollments: {getStatData(hoveredState).enrollment.toLocaleString()}</p>
                      <p className="flex items-center gap-1"><FileCheck className="h-3 w-3 text-chart-2" /> Demographics: {getStatData(hoveredState).demographic.toLocaleString()}</p>
                      <p className="flex items-center gap-1"><Fingerprint className="h-3 w-3 text-chart-3" /> Biometrics: {getStatData(hoveredState).biometric.toLocaleString()}</p>
                      <p className="font-semibold border-t pt-1 mt-1">Total: {getStatData(hoveredState).total.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex items-center justify-center ${isFullscreenMode ? 'h-full' : 'h-[500px]'} text-muted-foreground`}>Failed to load map data</div>
            )}
            
            <div className={`flex items-center justify-center gap-4 mt-4 text-xs ${isFullscreenMode ? 'shrink-0 pb-2' : ''}`}>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-muted border" /><span>No data</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded" style={{ background: 'hsl(27, 95%, 85%)' }} /><span>Low</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded" style={{ background: 'hsl(27, 95%, 70%)' }} /><span>Medium</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded" style={{ background: 'hsl(27, 95%, 55%)' }} /><span>High</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded" style={{ background: 'hsl(27, 95%, 45%)' }} /><span>Very High</span></div>
            </div>
          </div>
        );
    } else if (!selectedDistrict) {
      return (
        <ScrollArea className={isFullscreenMode ? 'h-full' : 'h-[450px]'}>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Districts in {selectedState} ({districts.length} found)</p>
            {districts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data available for this state</p>
            ) : (
              districts.map(([name, stats]) => (
                <div key={name} className="p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors" onClick={() => setSelectedDistrict(name)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${getDistrictColor(stats.total, maxDistrictValue)}`} />
                      <span className="font-medium">{name}</span>
                    </div>
                    <Badge variant="secondary">{stats.total.toLocaleString()}</Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {stats.enrollment.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><FileCheck className="h-3 w-3" /> {stats.demographic.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> {stats.biometric.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      );
    } else {
      return (
        <ScrollArea className={isFullscreenMode ? 'h-full' : 'h-[450px]'}>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Pincodes in {selectedDistrict} ({pincodes.length} found)</p>
            {pincodes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No pincode data available for this district</p>
            ) : (
              pincodes.map(([pincode, stats]) => (
                <div key={pincode} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium">{pincode}</span>
                    <Badge variant="secondary">{stats.total.toLocaleString()}</Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {stats.enrollment.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><FileCheck className="h-3 w-3" /> {stats.demographic.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> {stats.biometric.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      );
    }
  };

  return (
    <>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto p-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                {(selectedState || selectedDistrict) && (
                  <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="h-4 w-4" /></Button>
                )}
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />India Choropleth Map
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDistrict ? `${selectedDistrict}, ${selectedState}` : selectedState ? selectedState : 'All India - Click a state to drill down'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs"><ZoomIn className="h-3 w-3 mr-1" />{selectedDistrict ? 'Pincode Level' : selectedState ? 'District Level' : 'State Level'}</Badge>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Exit fullscreen"><Minimize2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
              <Tabs value={dataCategory} onValueChange={(v) => setDataCategory(v as DataCategory)} className="shrink-0">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all" className="text-xs">All Data</TabsTrigger>
                  <TabsTrigger value="enrollment" className="text-xs"><Users className="h-3 w-3 mr-1" />Enrollment</TabsTrigger>
                  <TabsTrigger value="demographic" className="text-xs"><FileCheck className="h-3 w-3 mr-1" />Demographic</TabsTrigger>
                  <TabsTrigger value="biometric" className="text-xs"><Fingerprint className="h-3 w-3 mr-1" />Biometric</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex-1 overflow-auto">{renderMapContent(true)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            {(selectedState || selectedDistrict) && (
              <Button variant="ghost" size="sm" onClick={handleBack}><ArrowLeft className="h-4 w-4" /></Button>
            )}
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />India Choropleth Map
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedDistrict ? `${selectedDistrict}, ${selectedState}` : selectedState ? selectedState : 'All India - Click a state to drill down'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs"><ZoomIn className="h-3 w-3 mr-1" />{selectedDistrict ? 'Pincode Level' : selectedState ? 'District Level' : 'State Level'}</Badge>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="View fullscreen"><Maximize2 className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={dataCategory} onValueChange={(v) => setDataCategory(v as DataCategory)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all" className="text-xs">All Data</TabsTrigger>
              <TabsTrigger value="enrollment" className="text-xs"><Users className="h-3 w-3 mr-1" />Enrollment</TabsTrigger>
              <TabsTrigger value="demographic" className="text-xs"><FileCheck className="h-3 w-3 mr-1" />Demographic</TabsTrigger>
              <TabsTrigger value="biometric" className="text-xs"><Fingerprint className="h-3 w-3 mr-1" />Biometric</TabsTrigger>
            </TabsList>
          </Tabs>
          {renderMapContent(false)}
        </CardContent>
      </Card>
    </>
  );
}
