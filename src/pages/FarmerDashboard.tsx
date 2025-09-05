import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, Package, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react';

interface Crop {
  id: string;
  name: string;
  grade: string;
  quantity: number;
  price: number;
  location: string;
  description: string;
  created_at: string;
}

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    quantity: '',
    price: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchCrops();
    }
  }, [user]);

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('farmer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrops(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch crops",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('crops')
        .insert({
          farmer_id: user.id,
          name: formData.name,
          grade: formData.grade,
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          location: formData.location,
          description: formData.description
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Crop listing added successfully!"
      });

      setFormData({
        name: '',
        grade: '',
        quantity: '',
        price: '',
        location: '',
        description: ''
      });

      fetchCrops();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add crop listing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Crop listing deleted successfully!"
      });

      fetchCrops();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete crop listing",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Farmer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your crop listings and track your sales
        </p>
      </div>

      <Tabs defaultValue="add-listing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="add-listing">Add New Listing</TabsTrigger>
          <TabsTrigger value="my-listings">My Listings ({crops.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="add-listing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Add New Crop Listing
              </CardTitle>
              <CardDescription>
                Create a new listing to sell your crops in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Crop Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Wheat, Rice, Corn"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Grade A">Grade A</SelectItem>
                        <SelectItem value="Grade B">Grade B</SelectItem>
                        <SelectItem value="Organic">Organic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (kg)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price per kg ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2.50"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Punjab, India"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your crop quality, harvest details, etc."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Adding..." : "Add Crop Listing"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-listings">
          <div className="space-y-6">
            {crops.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first crop listing to start selling in the marketplace
                  </p>
                  <Button onClick={() => {
                    const tab = document.querySelector('[value="add-listing"]') as HTMLButtonElement;
                    tab?.click();
                  }}>
                    Add Your First Listing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {crops.map((crop) => (
                  <Card key={crop.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{crop.name}</CardTitle>
                          <CardDescription>
                            Listed on {new Date(crop.created_at).toLocaleDateString()}
                          </CardDescription>
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

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(crop.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FarmerDashboard;