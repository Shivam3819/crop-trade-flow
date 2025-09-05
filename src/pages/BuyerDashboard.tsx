import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, ShoppingCart, Calendar as CalendarIcon, Package, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RFQ {
  id: string;
  crop: string;
  grade: string;
  quantity: number;
  delivery_date: string;
  description: string;
  created_at: string;
}

interface Crop {
  id: string;
  name: string;
  grade: string;
  quantity: number;
  price: number;
  location: string;
  description: string;
  profiles: {
    name: string;
    email: string;
  };
}

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    crop: '',
    grade: '',
    quantity: '',
    delivery_date: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchRFQs();
      fetchCrops();
    }
  }, [user]);

  const fetchRFQs = async () => {
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfqs(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch RFQs",
        variant: "destructive"
      });
    }
  };

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
        .order('created_at', { ascending: false })
        .limit(12);

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
    if (!user || !date) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('rfqs')
        .insert({
          buyer_id: user.id,
          crop: formData.crop,
          grade: formData.grade,
          quantity: parseInt(formData.quantity),
          delivery_date: format(date, 'yyyy-MM-dd'),
          description: formData.description
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "RFQ posted successfully!"
      });

      setFormData({
        crop: '',
        grade: '',
        quantity: '',
        delivery_date: '',
        description: ''
      });
      setDate(undefined);

      fetchRFQs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post RFQ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRFQ = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "RFQ deleted successfully!"
      });

      fetchRFQs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete RFQ",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buyer Dashboard</h1>
        <p className="text-muted-foreground">
          Browse crops and post your requirements
        </p>
      </div>

      <Tabs defaultValue="browse-crops" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse-crops">Browse Crops</TabsTrigger>
          <TabsTrigger value="post-demand">Post Demand</TabsTrigger>
          <TabsTrigger value="my-rfqs">My RFQs ({rfqs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse-crops">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Available Crops
                </CardTitle>
                <CardDescription>
                  Browse crops available from farmers
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crops.map((crop) => (
                <Card key={crop.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{crop.name}</CardTitle>
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
          </div>
        </TabsContent>

        <TabsContent value="post-demand">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Post Demand (RFQ)
              </CardTitle>
              <CardDescription>
                Post your crop requirements for farmers to respond
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="crop">Crop Name</Label>
                    <Input
                      id="crop"
                      placeholder="e.g., Wheat, Rice, Corn"
                      value={formData.crop}
                      onChange={(e) => setFormData(prev => ({ ...prev, crop: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Preferred Grade</Label>
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
                    <Label htmlFor="quantity">Required Quantity (kg)</Label>
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
                    <Label>Delivery Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Requirements</Label>
                  <Textarea
                    id="description"
                    placeholder="Specify quality requirements, delivery location, etc."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={loading || !date} className="w-full">
                  {loading ? "Posting..." : "Post RFQ"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-rfqs">
          <div className="space-y-6">
            {rfqs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No RFQs posted yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Post your first demand to get quotes from farmers
                  </p>
                  <Button onClick={() => {
                    const tab = document.querySelector('[value="post-demand"]') as HTMLButtonElement;
                    tab?.click();
                  }}>
                    Post Your First RFQ
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rfqs.map((rfq) => (
                  <Card key={rfq.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{rfq.crop}</CardTitle>
                          <CardDescription>
                            Posted on {new Date(rfq.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{rfq.grade}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{rfq.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{rfq.quantity} kg required</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Delivery: {new Date(rfq.delivery_date).toLocaleDateString()}</span>
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
                          onClick={() => handleDeleteRFQ(rfq.id)}
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

export default BuyerDashboard;