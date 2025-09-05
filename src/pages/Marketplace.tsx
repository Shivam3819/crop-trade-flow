import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Package, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Crop {
  id: string;
  name: string;
  grade: string;
  quantity: number;
  price: number;
  location: string;
  description: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

const Marketplace = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchCrops();
  }, []);

  useEffect(() => {
    filterCrops();
  }, [crops, searchTerm, gradeFilter, locationFilter]);

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrops(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch crops",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCrops = () => {
    let filtered = crops;

    if (searchTerm) {
      filtered = filtered.filter(crop =>
        crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crop.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter(crop => crop.grade === gradeFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(crop =>
        crop.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredCrops(filtered);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
        <p className="text-muted-foreground mb-6">
          Discover fresh crops from farmers across the region
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
              <SelectItem value="Grade A">Grade A</SelectItem>
              <SelectItem value="Grade B">Grade B</SelectItem>
              <SelectItem value="Organic">Organic</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />

          <Button onClick={() => {
            setSearchTerm('');
            setGradeFilter('all');
            setLocationFilter('');
          }} variant="outline">
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Crops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCrops.map((crop) => (
          <Card key={crop.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{crop.name}</CardTitle>
                  <CardDescription>by {crop.profiles?.name}</CardDescription>
                </div>
                <Badge variant="secondary">{crop.grade}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{crop.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{crop.quantity} kg available</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{crop.location}</span>
                </div>
                
                <div className="flex items-center text-lg font-semibold text-primary">
                  <DollarSign className="h-5 w-5 mr-1" />
                  <span>{crop.price}/kg</span>
                </div>
              </div>

              <Button className="w-full">
                Contact Farmer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCrops.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No crops found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or check back later for new listings.
          </p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;