'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  MapPin,
  Building2,
  GraduationCap,
  Train,
  Heart,
  Navigation,
  Filter,
  X,
  CheckCircle,
  Fingerprint,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils/constants';

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

// Types
export interface ServiceLocation {
  id: string;
  name: string;
  category: 'bank' | 'hospital' | 'university' | 'transport';
  address: string;
  coordinates: [number, number];
  services: string[];
  hours: string;
  hasSignLanguageInterpreter: boolean;
  isSmartIDEnabled: boolean;
  phone?: string;
}

// Mock data for Malaysian service locations
const mockLocations: ServiceLocation[] = [
  {
    id: '1',
    name: 'Maybank HQ - Menara Maybank',
    category: 'bank',
    address: '100, Jalan Tun Perak, 50050 Kuala Lumpur',
    coordinates: [3.1478, 101.6953],
    services: ['Account Services', 'Loans', 'Insurance'],
    hours: 'Mon-Fri: 9:00 AM - 4:30 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '1-300-88-6688',
  },
  {
    id: '2',
    name: 'CIMB Bank Berhad - PJ Branch',
    category: 'bank',
    address: 'Jalan Sultan, 46200 Petaling Jaya, Selangor',
    coordinates: [3.0973, 101.6430],
    services: ['Account Services', 'Business Banking', 'Wealth Management'],
    hours: 'Mon-Fri: 9:15 AM - 4:45 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-6204 7788',
  },
  {
    id: '3',
    name: 'Public Bank - KLCC Branch',
    category: 'bank',
    address: 'Ground Floor, Suria KLCC, 50088 Kuala Lumpur',
    coordinates: [3.1579, 101.7119],
    services: ['Personal Banking', 'Credit Cards', 'Foreign Exchange'],
    hours: 'Mon-Fri: 9:30 AM - 4:00 PM, Sat: 9:30 AM - 12:00 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-2163 9000',
  },
  {
    id: '4',
    name: 'Hospital Kuala Lumpur (HKL)',
    category: 'hospital',
    address: 'Jalan Pahang, 50586 Kuala Lumpur',
    coordinates: [3.1714, 101.7006],
    services: ['Emergency', 'Outpatient', 'Specialist Clinics', 'Pharmacy'],
    hours: 'Open 24 Hours (Emergency)',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-2615 5555',
  },
  {
    id: '5',
    name: 'Hospital Putrajaya',
    category: 'hospital',
    address: 'Pusat Pentadbiran Kerajaan Persekutuan, 62250 Putrajaya',
    coordinates: [2.9264, 101.6964],
    services: ['Emergency', 'Maternity', 'Pediatrics', 'General Medicine'],
    hours: 'Open 24 Hours (Emergency)',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-8312 4200',
  },
  {
    id: '6',
    name: 'Sunway Medical Centre',
    category: 'hospital',
    address: '5, Jalan Lagoon Selatan, 47500 Bandar Sunway, Selangor',
    coordinates: [3.0679, 101.6039],
    services: ['Emergency', 'Cancer Centre', 'Heart Centre', 'Eye Centre'],
    hours: 'Open 24 Hours',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-7491 9191',
  },
  {
    id: '7',
    name: 'Universiti Malaya (UM)',
    category: 'university',
    address: '50603 Kuala Lumpur',
    coordinates: [3.1209, 101.6538],
    services: ['Admissions', 'Student Services', 'Library', 'Career Centre'],
    hours: 'Mon-Fri: 8:30 AM - 5:30 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-7967 3000',
  },
  {
    id: '8',
    name: 'Universiti Kebangsaan Malaysia (UKM)',
    category: 'university',
    address: '43600 UKM Bangi, Selangor',
    coordinates: [2.9253, 101.7868],
    services: ['Admissions', 'Student Affairs', 'Research Services'],
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-8921 5555',
  },
  {
    id: '9',
    name: 'Universiti Teknologi Malaysia (UTM) KL',
    category: 'university',
    address: 'Jalan Sultan Yahya Petra, 54100 Kuala Lumpur',
    coordinates: [3.1688, 101.7227],
    services: ['Admissions', 'Academic Services', 'International Office'],
    hours: 'Mon-Fri: 8:30 AM - 5:00 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-2615 4100',
  },
  {
    id: '10',
    name: 'KL Sentral Station',
    category: 'transport',
    address: 'Jalan Stesen Sentral, 50470 Kuala Lumpur',
    coordinates: [3.1343, 101.6865],
    services: ['KTM', 'LRT', 'MRT', 'ERL', 'Bus Terminal', 'Taxi Stand'],
    hours: 'Open 5:00 AM - 12:00 AM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-2274 7788',
  },
  {
    id: '11',
    name: 'Terminal Bersepadu Selatan (TBS)',
    category: 'transport',
    address: 'Jalan Terminal Selatan, Bandar Tasik Selatan, 57100 Kuala Lumpur',
    coordinates: [3.0822, 101.7098],
    services: ['Long Distance Bus', 'Ticket Counter', 'Waiting Area'],
    hours: 'Open 24 Hours',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-9051 2000',
  },
  {
    id: '12',
    name: 'KLIA Transit - KLIA2 Station',
    category: 'transport',
    address: 'KLIA2, 64000 KLIA, Selangor',
    coordinates: [2.7456, 101.7072],
    services: ['Airport Express', 'Transit Service', 'Ticketing'],
    hours: 'Open 5:00 AM - 1:00 AM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-2267 8000',
  },
  {
    id: '13',
    name: 'JPJ Wangsa Maju',
    category: 'transport',
    address: 'Jalan Genting Kelang, 53300 Wangsa Maju, Kuala Lumpur',
    coordinates: [3.2048, 101.7334],
    services: ['Driving License', 'Vehicle Registration', 'Road Tax Renewal'],
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-4149 8888',
  },
  {
    id: '14',
    name: 'Immigration Office Putrajaya',
    category: 'transport',
    address: 'No. 15, Persiaran Perdana, 62550 Putrajaya',
    coordinates: [2.9419, 101.6963],
    services: ['Passport', 'Visa', 'Travel Documents'],
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-8880 1000',
  },
  {
    id: '15',
    name: 'RHB Bank - Bangsar Branch',
    category: 'bank',
    address: '166, Jalan Maarof, 59000 Bangsar, Kuala Lumpur',
    coordinates: [3.1297, 101.6726],
    services: ['Personal Banking', 'SME Banking', 'Premier Banking'],
    hours: 'Mon-Fri: 9:00 AM - 4:00 PM',
    hasSignLanguageInterpreter: true,
    isSmartIDEnabled: true,
    phone: '03-9206 8118',
  },
];

// Category configuration
const categories = [
  { id: 'bank', label: 'Banks', icon: Building2, color: 'bg-green-500' },
  { id: 'hospital', label: 'Hospitals', icon: Heart, color: 'bg-red-500' },
  { id: 'university', label: 'Universities', icon: GraduationCap, color: 'bg-blue-500' },
  { id: 'transport', label: 'Transport', icon: Train, color: 'bg-orange-500' },
] as const;

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'bank',
    'hospital',
    'university',
    'transport',
  ]);
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter locations based on search and categories
  const filteredLocations = useMemo(() => {
    return mockLocations.filter((location) => {
      const matchesCategory = selectedCategories.includes(location.category);
      const matchesSearch =
        searchQuery === '' ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategories]);

  // Toggle category filter
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enable location services.');
        setIsLocating(false);
      }
    );
  };

  // Open directions in Google Maps
  const openDirections = (location: ServiceLocation) => {
    const destination = `${location.coordinates[0]},${location.coordinates[1]}`;
    const origin = userLocation ? `${userLocation[0]},${userLocation[1]}` : '';
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${destination}`
      : `https://www.google.com/maps/dir//${destination}`;
    window.open(url, '_blank');
  };

  // Get category info
  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-white/80 px-4 py-6 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="container mx-auto">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                National Accessibility Map
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find Smart ID-enabled, sign-language-friendly services near you
              </p>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle & Location Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {selectedCategories.length < 4 && (
                  <Badge variant="default" className="ml-1">
                    {selectedCategories.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={getUserLocation}
                disabled={isLocating}
                className="flex items-center gap-2"
              >
                <Navigation className={cn('h-4 w-4', isLocating && 'animate-pulse')} />
                {isLocating ? 'Locating...' : 'My Location'}
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                      isSelected
                        ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full', category.color)} />
                    <Icon className="h-4 w-4" />
                    {category.label}
                    {isSelected && <CheckCircle className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredLocations.length} accessible service{filteredLocations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Map and Details Section */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Map Container */}
        <div className="relative h-[50vh] flex-1 lg:h-auto">
          <MapComponent
            locations={filteredLocations}
            userLocation={userLocation}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            categories={categories}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:bg-gray-900/95">
            <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Legend</p>
            <div className="space-y-1">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 text-xs">
                  <span className={cn('h-3 w-3 rounded-full', category.color)} />
                  <span className="text-gray-600 dark:text-gray-400">{category.label}</span>
                </div>
              ))}
              {userLocation && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-gray-600 dark:text-gray-400">Your Location</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Details Sidebar */}
        <div className="w-full border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:w-96 lg:border-l lg:border-t-0 lg:overflow-y-auto lg:max-h-[calc(100vh-200px)]">
          {selectedLocation ? (
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="space-y-4">
                  {/* Location Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'rounded-lg p-2',
                          getCategoryInfo(selectedLocation.category)?.color
                        )}
                      >
                        {(() => {
                          const Icon = getCategoryInfo(selectedLocation.category)?.icon || MapPin;
                          return <Icon className="h-5 w-5 text-white" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {selectedLocation.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getCategoryInfo(selectedLocation.category)?.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Accessibility Badges */}
                  <div className="flex flex-wrap gap-2">
                    {selectedLocation.isSmartIDEnabled && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Fingerprint className="h-3 w-3" />
                        Smart ID Enabled
                      </Badge>
                    )}
                    {selectedLocation.hasSignLanguageInterpreter && (
                      <Badge variant="default" className="flex items-center gap-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
                        <CheckCircle className="h-3 w-3" />
                        Sign Language Support
                      </Badge>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedLocation.address}
                    </p>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedLocation.hours}
                    </p>
                  </div>

                  {/* Services */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Available Services
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedLocation.services.map((service, index) => (
                        <Badge key={index} variant="default" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Phone */}
                  {selectedLocation.phone && (
                    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Phone: <span className="font-medium">{selectedLocation.phone}</span>
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => openDirections(selectedLocation)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Get Directions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${selectedLocation.coordinates[0]},${selectedLocation.coordinates[1]}`,
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <MapPin className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">
                Select a Location
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click on a marker on the map to view details about the accessible service location.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
