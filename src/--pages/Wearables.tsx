import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Zap, TrendingUp, Check, RefreshCw, Loader2 } from 'lucide-react';
import { ChevronArrowIcon } from '@/components/icons/ChevronArrowIcon';
import { useLocale } from '@/hooks/useLocale';
import { localizeRelativeTimeString, getJustNowText } from '@/lib/dateUtils';
import { useResults } from '@/hooks/useResults';
import { useUserProfile } from '@/hooks/useUser';
import { ProFeatureGate } from '@/components/shared/ProFeatureGate';
import { 
  WearableMetricDetailCard,
  PeriodSelector,
} from '@/components/wearables';
import { DEMO_WEARABLE_SUMMARY_DATA } from '@/lib/wearableBiomarkerMapping';
import type { WearableSummaryPeriod } from '@/types/wearables';

// Import logo images
import appleHealthLogo from '@/assets/wearables/apple-health.png';
import garminLogo from '@/assets/wearables/garmin.png';
import fitbitLogo from '@/assets/wearables/fitbit.png';
import pelotonLogo from '@/assets/wearables/peloton.png';
import polarLogo from '@/assets/wearables/polar.png';
import corosLogo from '@/assets/wearables/coros.png';
import suuntoLogo from '@/assets/wearables/suunto.png';
import zeppLogo from '@/assets/wearables/zepp.png';
import freestyleLibreLogo from '@/assets/wearables/freestyle-libre.png';
import ultrahumanLogo from '@/assets/wearables/ultrahuman.png';

// Featured wearable images
import appleWatchImg from '@/assets/wearables/apple-watch.png';
import ouraRingImg from '@/assets/wearables/oura-ring.png';
import whoopImg from '@/assets/wearables/whoop.png';

// Why connect wearables background images
import whyConnectImg1 from '@/assets/wearables/why-connect-1.jpg';
import whyConnectImg2 from '@/assets/wearables/why-connect-2.jpg';
import whyConnectImg3 from '@/assets/wearables/why-connect-3.jpg';

interface WearableDevice {
  id: string;
  name: string;
  logo: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  lastSyncedMinutes?: number; // Store as minutes for dynamic localization
  justConnected?: boolean; // Flag for "just now" state
}

interface FeaturedWearable extends WearableDevice {
  description: string;
  metrics: string[];
  moreCount: number;
  image: string;
}

// Improved image component with smooth loading
function LoadingImage({ 
  src, 
  alt, 
  className,
  containerClassName,
  shimmerSize = 'auto'
}: { 
  src: string; 
  alt: string; 
  className?: string;
  containerClassName?: string;
  shimmerSize?: 'auto' | 'centered';
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  const shimmerClasses = shimmerSize === 'centered' 
    ? 'w-28 h-28 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl'
    : 'inset-0 rounded-xl';

  return (
    <div className={`relative ${containerClassName || ''}`}>
      {/* Shimmer skeleton - centered for featured, full for available */}
      <div 
        className={`absolute overflow-hidden transition-opacity duration-500 ${shimmerClasses} ${
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Base skeleton with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-border/60 via-muted/80 to-border/60" />
        {/* Shimmer overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]"
        />
      </div>
      
      {/* Actual image with blur fade-in */}
      <img 
        src={src} 
        alt={alt} 
        className={`${className || ''} transition-all duration-700 ease-out ${
          isLoaded 
            ? 'opacity-100 blur-0 scale-100' 
            : 'opacity-0 blur-md scale-[1.02]'
        }`}
        onLoad={() => setIsLoaded(true)}
      />
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

// Connected badge with pulsing green dot
function ConnectedBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-card/90 backdrop-blur-sm rounded-full border border-border/40 shadow-sm">
      {/* Pulsing green dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span 
          className="absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ 
            backgroundColor: '#22c55e',
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
          }} 
        />
        <span 
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: '#22c55e' }}
        />
      </span>
      <span className="text-xs text-foreground font-medium">Connected</span>
      
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

const featuredWearables: FeaturedWearable[] = [
  {
    id: 'apple-watch',
    name: 'Apple Watch',
    logo: appleHealthLogo,
    image: appleWatchImg,
    description: 'Comprehensive health tracking with heart rate, activity, and workout monitoring.',
    metrics: ['Heart Rate', 'HRV', 'Activity'],
    moreCount: 3,
    isConnected: true,
    lastSyncedMinutes: 2,
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    logo: ultrahumanLogo,
    image: ouraRingImg,
    description: 'Advanced sleep and recovery insights with continuous monitoring.',
    metrics: ['Sleep Quality', 'HRV', 'Body Temperature'],
    moreCount: 2,
    isConnected: false,
  },
  {
    id: 'whoop',
    name: 'Whoop',
    logo: corosLogo,
    image: whoopImg,
    description: 'Performance optimization with strain, recovery, and sleep coaching.',
    metrics: ['Strain', 'Recovery', 'Sleep'],
    moreCount: 3,
    isConnected: false,
  },
];

const availableWearables: WearableDevice[] = [
  { id: 'apple-health', name: 'Apple Health', logo: appleHealthLogo, isConnected: true, lastSyncedMinutes: 5 },
  { id: 'garmin', name: 'Garmin', logo: garminLogo, isConnected: true, lastSyncedMinutes: 60 },
  { id: 'fitbit', name: 'Fitbit', logo: fitbitLogo, isConnected: false },
  { id: 'peloton', name: 'Peloton', logo: pelotonLogo, isConnected: false },
  { id: 'polar', name: 'Polar', logo: polarLogo, isConnected: false },
  { id: 'coros', name: 'Coros', logo: corosLogo, isConnected: false },
  { id: 'suunto', name: 'Suunto', logo: suuntoLogo, isConnected: false },
  { id: 'zepp', name: 'Zepp', logo: zeppLogo, isConnected: false },
  { id: 'freestyle-libre', name: 'Freestyle Libre', logo: freestyleLibreLogo, isConnected: false },
  { id: 'ultrahuman', name: 'Ultrahuman', logo: ultrahumanLogo, isConnected: false },
];

// Placeholder for non-members
function WearablesPlaceholder() {
  return (
    <div className="space-y-10">
      {/* Health Summary placeholder */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Featured Wearables placeholder */}
      <section>
        <Skeleton className="h-6 w-40 mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Wearables() {
  const { t, locale } = useLocale();
  const { data: user, isLoading: userLoading } = useUserProfile();
  const isMember = user?.activeMembershipInfo?.isMember ?? false;
  const [devices, setDevices] = useState(availableWearables);
  const [featured, setFeatured] = useState(featuredWearables);
  const [period, setPeriod] = useState<WearableSummaryPeriod>('biweekly');
  const { data: resultsData } = useResults();
  
  // Get latest biomarkers for status display
  const latestBiomarkers = resultsData?.results?.[0]?.biomarkers || [];

  // Helper to format sync time
  const formatSyncTime = (minutes?: number, justConnected?: boolean) => {
    if (justConnected) return getJustNowText(locale);
    if (!minutes) return null;
    if (minutes < 60) {
      return localizeRelativeTimeString(`${minutes} min ago`, locale);
    }
    const hours = Math.floor(minutes / 60);
    return localizeRelativeTimeString(`${hours} hour${hours > 1 ? 's' : ''} ago`, locale);
  };

  const benefits = [
    {
      icon: Activity,
      title: t('wearables.realTimeTracking'),
      description: t('wearables.realTimeTrackingDesc'),
      image: whyConnectImg1,
    },
    {
      icon: Zap,
      title: t('wearables.automatedSync'),
      description: t('wearables.automatedSyncDesc'),
      image: whyConnectImg2,
    },
    {
      icon: TrendingUp,
      title: t('wearables.deeperInsights'),
      description: t('wearables.deeperInsightsDesc'),
      image: whyConnectImg3,
    },
  ];

  const toggleConnection = async (id: string, isFeatured: boolean = false) => {
    const setState = isFeatured ? setFeatured : setDevices;
    
    // Set connecting state
    setState(prev => prev.map(d => 
      d.id === id ? { ...d, isConnecting: true } : d
    ));
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Complete connection
    setState(prev => prev.map(d => 
      d.id === id 
        ? { 
            ...d, 
            isConnecting: false,
            isConnected: !d.isConnected, 
            lastSyncedMinutes: !d.isConnected ? 0 : undefined,
            justConnected: !d.isConnected ? true : false
          }
        : d
    ));
  };

  return (
    <PageLayout
      title={t('wearables.title')}
      subtitle={t('wearables.subtitle')}
      isLoading={userLoading}
      loadingSkeleton={<WearablesPlaceholder />}
    >
      <ProFeatureGate
        isMember={isMember}
        isLoading={userLoading}
        placeholder={<WearablesPlaceholder />}
        featureName="wearables"
      >
        <div className="space-y-10">
          {/* Biomarker-Led Health Summary Section */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="title-md text-foreground">{t('wearables.summary')}</h2>
              <PeriodSelector value={period} onChange={setPeriod} />
            </div>
            
            {/* Metric Detail Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_WEARABLE_SUMMARY_DATA.map((metric) => (
                <WearableMetricDetailCard
                  key={metric.id}
                  metric={metric}
                  biomarkers={latestBiomarkers}
                  showChart={true}
                />
              ))}
            </div>
          </section>

          {/* Featured Wearables */}
          <section>
            <h2 className="title-md text-foreground mb-5">{t('wearables.featuredWearables')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {featured.map((device) => (
                <Card 
                  key={device.id} 
                  className={`group overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 border-0 ${
                    device.isConnected 
                      ? 'bg-gradient-to-br from-hm-optimal/5 via-white to-white' 
                      : 'bg-white'
                  }`}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Image section with subtle pattern */}
                    <div className="relative h-48 bg-gradient-to-b from-muted/40 via-muted/20 to-transparent flex items-center justify-center overflow-hidden">
                      {/* Subtle dot pattern */}
                      <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '16px 16px'
                      }} />
                      
                      {/* Image with loading state */}
                      <LoadingImage 
                        src={device.image} 
                        alt={device.name}
                        containerClassName="h-40 w-full flex items-center justify-center relative z-10"
                        className="h-40 w-auto object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                        shimmerSize="centered"
                      />
                      
                      {/* Connected badge with green dot */}
                      {device.isConnected && (
                        <div className="absolute top-3 right-3 z-20">
                          <ConnectedBadge />
                        </div>
                      )}
                    </div>
                    
                    {/* Content section */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="title-sm text-foreground mb-2">{device.name}</h3>
                      <p className="body-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
                        {device.description}
                      </p>
                      
                      {/* Last synced info */}
                      {device.isConnected && (device.lastSyncedMinutes !== undefined || device.justConnected) && (
                        <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                          <span className="caption-sm">{t('wearables.synced')} {formatSyncTime(device.lastSyncedMinutes, device.justConnected)}</span>
                        </div>
                      )}
                      
                      {/* Metrics */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {device.metrics.map((metric) => (
                            <span 
                              key={metric} 
                              className="px-3 py-1 bg-bg-sodium rounded-full caption-sm text-muted-foreground"
                            >
                              {metric}
                            </span>
                          ))}
                          <span className="px-3 py-1 bg-bg-sodium rounded-full caption-sm text-muted-foreground">
                            +{device.moreCount}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action button - simple text, no wifi icon */}
                      <button 
                        onClick={() => toggleConnection(device.id, true)}
                        disabled={device.isConnecting}
                        className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ease-out flex items-center justify-center gap-2 disabled:opacity-70 ${
                          device.isConnected 
                            ? 'bg-foreground text-background hover:bg-foreground/90' 
                            : 'bg-foreground/5 text-foreground border border-border/50 hover:bg-foreground/10 hover:border-border'
                        }`}
                      >
                        {device.isConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : device.isConnected ? (
                          <>
                            <Check className="h-4 w-4" />
                            Connected
                          </>
                        ) : (
                          <>
                            Connect
                            <ChevronArrowIcon size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Available Integrations */}
          <section>
            <h2 className="title-md text-foreground mb-5">{t('wearables.available')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {devices.map((device) => (
                <button 
                  key={device.id} 
                  onClick={() => toggleConnection(device.id)}
                  disabled={device.isConnecting}
                  className="group relative rounded-xl p-6 text-left transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 disabled:opacity-70 border-0 bg-white"
                >
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 rounded-xl opacity-[0.02] pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '12px 12px'
                  }} />
                  
                  {device.isConnected && !device.isConnecting && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                      <Check className="h-3 w-3 text-background" strokeWidth={3} />
                    </div>
                  )}
                  
                  {/* Connecting spinner */}
                  {device.isConnecting && (
                    <div className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                    </div>
                  )}
                  
                  {/* Logo with loading state */}
                  <div className="flex justify-center mb-4 relative z-10">
                    <LoadingImage 
                      src={device.logo} 
                      alt={device.name}
                      containerClassName="w-14 h-14"
                      className={`w-14 h-14 object-contain transition-all duration-300 ease-out ${
                        device.isConnecting ? 'opacity-50' : 'group-hover:scale-105'
                      }`}
                    />
                  </div>
                  
                  {/* Name */}
                  <p className="text-sm font-medium text-foreground text-center mb-1 relative z-10">
                    {device.name}
                  </p>
                  
                  {/* Action / Status */}
                  <div className="relative z-10">
                    {device.isConnecting ? (
                      <p className="caption-sm text-muted-foreground text-center">
                        Connecting...
                      </p>
                    ) : device.isConnected ? (
                      <p className="caption-sm text-foreground text-center flex items-center justify-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {formatSyncTime(device.lastSyncedMinutes, device.justConnected)}
                      </p>
                    ) : (
                      <p className="caption-sm text-muted-foreground text-center group-hover:text-foreground transition-colors">
                        {t('common.connect')}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Why Connect Wearables */}
          <section>
            <h2 className="title-md text-foreground mb-5">{t('wearables.whyConnect')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="relative rounded-2xl overflow-hidden min-h-[180px] group"
                >
                  {/* Background image */}
                  <img 
                    src={benefit.image} 
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Dark overlay for text readability */}
                  <div className="absolute inset-0 bg-black/40" />
                  
                  {/* Content - vertically centered */}
                  <div className="relative z-10 p-6 h-full flex flex-col justify-center">
                    <h3 className="text-white font-bold text-xl leading-tight mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ProFeatureGate>
    </PageLayout>
  );
}
