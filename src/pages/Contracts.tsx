import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Plus, FileText, Calendar as CalendarIcon, Users, DollarSign, Wheat } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Contract {
  id: string;
  crop: string;
  acreage: number | null;
  quantity: number | null;
  price: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  farmer_profile?: {
    name: string;
    email: string;
  };
  buyer_profile?: {
    name: string;
    email: string;
  };
}

interface Profile {
  user_id: string;
  name: string;
  email: string;
  role: 'farmer' | 'buyer';
}

const Contracts = () => {
  const { user, profile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [formData, setFormData] = useState({
    crop: '',
    acreage: '',
    quantity: '',
    price: '',
    farmer_id: '',
    buyer_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchContracts();
      fetchProfiles();
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          farmer_profile:profiles!contracts_farmer_id_fkey(name, email),
          buyer_profile:profiles!contracts_buyer_id_fkey(name, email)
        `)
        .or(`farmer_id.eq.${user?.id},buyer_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contracts",
        variant: "destructive"
      });
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email, role')
        .neq('user_id', user?.id);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profiles",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate) return;

    // Determine farmer_id and buyer_id based on current user role
    let farmer_id = formData.farmer_id;
    let buyer_id = formData.buyer_id;

    if (profile?.role === 'farmer') {
      farmer_id = user.id;
    } else if (profile?.role === 'buyer') {
      buyer_id = user.id;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .insert({
          farmer_id,
          buyer_id,
          crop: formData.crop,
          acreage: formData.acreage ? parseFloat(formData.acreage) : null,
          quantity: formData.quantity ? parseInt(formData.quantity) : null,
          price: parseFloat(formData.price),
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract created successfully!"
      });

      setFormData({
        crop: '',
        acreage: '',
        quantity: '',
        price: '',
        farmer_id: '',
        buyer_id: ''
      });
      setStartDate(undefined);
      setEndDate(undefined);

      fetchContracts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create contract",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContractStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Contract ${status} successfully!`
      });

      fetchContracts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contract",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contracts</h1>
        <p className="text-muted-foreground">
          Create and manage contracts between farmers and buyers
        </p>
      </div>

      <Tabs defaultValue="my-contracts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-contracts">My Contracts ({contracts.length})</TabsTrigger>
          <TabsTrigger value="create-contract">Create Contract</TabsTrigger>
        </TabsList>

        <TabsContent value="my-contracts">
          <div className="space-y-6">
            {contracts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No contracts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first contract to start trading
                  </p>
                  <Button onClick={() => {
                    const tab = document.querySelector('[value="create-contract"]') as HTMLButtonElement;
                    tab?.click();
                  }}>
                    Create First Contract
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {contracts.map((contract) => (
                  <Card key={contract.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <Wheat className="h-5 w-5 mr-2" />
                            {contract.crop}
                          </CardTitle>
                          <CardDescription>
                            Created on {new Date(contract.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Farmer:</span>
                          <div className="font-medium">{contract.farmer_profile?.name}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Buyer:</span>
                          <div className="font-medium">{contract.buyer_profile?.name}</div>
                        </div>
                        {contract.acreage && (
                          <div>
                            <span className="text-muted-foreground">Acreage:</span>
                            <div className="font-medium">{contract.acreage} acres</div>
                          </div>
                        )}
                        {contract.quantity && (
                          <div>
                            <span className="text-muted-foreground">Quantity:</span>
                            <div className="font-medium">{contract.quantity} kg</div>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Price:</span>
                          <div className="font-medium flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {contract.price}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <div className="font-medium">
                            {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {contract.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateContractStatus(contract.id, 'approved')}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => updateContractStatus(contract.id, 'rejected')}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {contract.status === 'approved' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateContractStatus(contract.id, 'completed')}
                          className="w-full"
                        >
                          Mark as Completed
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create-contract">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create New Contract
              </CardTitle>
              <CardDescription>
                Create a contract between a farmer and buyer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="crop">Crop</Label>
                    <Input
                      id="crop"
                      placeholder="e.g., Wheat, Rice, Corn"
                      value={formData.crop}
                      onChange={(e) => setFormData(prev => ({ ...prev, crop: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2500.00"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acreage">Acreage (optional)</Label>
                    <Input
                      id="acreage"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 10.5"
                      value={formData.acreage}
                      onChange={(e) => setFormData(prev => ({ ...prev, acreage: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (kg, optional)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>

                  {profile?.role !== 'farmer' && (
                    <div className="space-y-2">
                      <Label htmlFor="farmer">Farmer</Label>
                      <Select
                        value={formData.farmer_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, farmer_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select farmer" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.filter(p => p.role === 'farmer').map((farmer) => (
                            <SelectItem key={farmer.user_id} value={farmer.user_id}>
                              {farmer.name} ({farmer.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {profile?.role !== 'buyer' && (
                    <div className="space-y-2">
                      <Label htmlFor="buyer">Buyer</Label>
                      <Select
                        value={formData.buyer_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select buyer" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.filter(p => p.role === 'buyer').map((buyer) => (
                            <SelectItem key={buyer.user_id} value={buyer.user_id}>
                              {buyer.name} ({buyer.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !startDate || !endDate} 
                  className="w-full"
                >
                  {loading ? "Creating..." : "Create Contract"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Contracts;