import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, Lightbulb, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SoilTest {
  id: string;
  file_url: string;
  file_name: string;
  advice: string | null;
  created_at: string;
}

const Advisory = () => {
  const { user, profile } = useAuth();
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user && profile?.role === 'farmer') {
      fetchSoilTests();
    }
  }, [user, profile]);

  const fetchSoilTests = async () => {
    try {
      const { data, error } = await supabase
        .from('soil_tests')
        .select('*')
        .eq('farmer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSoilTests(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch soil tests",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) {
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('soil-tests')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('soil-tests')
        .getPublicUrl(fileName);

      // Save record to database
      const { error: dbError } = await supabase
        .from('soil_tests')
        .insert({
          farmer_id: user.id,
          file_url: publicUrl,
          file_name: selectedFile.name,
          advice: generateDummyAdvice()
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Soil test uploaded successfully!"
      });

      setSelectedFile(null);
      fetchSoilTests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload soil test",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const generateDummyAdvice = () => {
    const adviceOptions = [
      "Your soil shows good nitrogen levels. Consider adding phosphorus-rich fertilizers to optimize crop yield. The pH level is slightly acidic, which is suitable for most crops but consider lime application for better results.",
      "Soil analysis indicates low organic matter. We recommend incorporating compost or green manure to improve soil structure and water retention. Your potassium levels are adequate for current crop requirements.",
      "Excellent soil health detected! Your soil has balanced nutrients and good drainage. Maintain current practices and consider crop rotation to sustain these optimal conditions for long-term productivity.",
      "The soil shows signs of nutrient depletion. We suggest a comprehensive fertilization program focusing on NPK balance. Also consider soil testing for micronutrients like iron, zinc, and manganese.",
      "Your soil has high clay content which is good for nutrient retention but may require improved drainage. Consider adding organic matter and sand to improve soil structure and aeration for better root development."
    ];
    
    return adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
  };

  if (profile?.role !== 'farmer') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Advisory services are only available to farmers. Please log in with a farmer account to access this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agricultural Advisory</h1>
        <p className="text-muted-foreground">
          Upload soil tests and get expert agricultural advice
        </p>
      </div>

      <Tabs defaultValue="upload-test" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload-test">Upload Soil Test</TabsTrigger>
          <TabsTrigger value="my-tests">My Tests ({soilTests.length})</TabsTrigger>
          <TabsTrigger value="general-advice">General Advice</TabsTrigger>
        </TabsList>

        <TabsContent value="upload-test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Soil Test
              </CardTitle>
              <CardDescription>
                Upload your soil test report (PDF or image) to get personalized advice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="soil-test">Select File</Label>
                <Input
                  id="soil-test"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: PDF, JPG, PNG, GIF (Max size: 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleFileUpload} 
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload & Analyze"}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">How it works</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Upload your soil test report and our AI-powered system will analyze the results 
                      to provide personalized recommendations for your crops, including fertilizer 
                      suggestions, pH adjustments, and best practices for soil health.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-tests">
          <div className="space-y-6">
            {soilTests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No soil tests uploaded yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first soil test to get personalized agricultural advice
                  </p>
                  <Button onClick={() => {
                    const tab = document.querySelector('[value="upload-test"]') as HTMLButtonElement;
                    tab?.click();
                  }}>
                    Upload First Test
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {soilTests.map((test) => (
                  <Card key={test.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            {test.file_name}
                          </CardTitle>
                          <CardDescription>
                            Uploaded on {new Date(test.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Analyzed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Agricultural Advice
                        </h4>
                        <p className="text-muted-foreground bg-muted/30 p-4 rounded-lg">
                          {test.advice}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Report
                        </Button>
                        <Button variant="outline" size="sm">
                          Download Advice
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="general-advice">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  General Agricultural Tips
                </CardTitle>
                <CardDescription>
                  Best practices for sustainable farming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Soil Health</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Test soil pH regularly (optimal range: 6.0-7.0)</li>
                      <li>• Add organic matter to improve soil structure</li>
                      <li>• Practice crop rotation to prevent nutrient depletion</li>
                      <li>• Avoid overuse of chemical fertilizers</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Water Management</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use drip irrigation for water efficiency</li>
                      <li>• Monitor soil moisture levels regularly</li>
                      <li>• Implement mulching to retain moisture</li>
                      <li>• Consider rainwater harvesting systems</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Pest Management</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Use integrated pest management (IPM)</li>
                      <li>• Encourage beneficial insects</li>
                      <li>• Regular field monitoring for early detection</li>
                      <li>• Consider biological control methods</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Crop Planning</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Choose climate-appropriate varieties</li>
                      <li>• Plan planting schedules based on weather</li>
                      <li>• Diversify crops to reduce risk</li>
                      <li>• Keep detailed farming records</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Calendar</CardTitle>
                <CardDescription>
                  Key farming activities by season
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">Spring</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Soil preparation</li>
                      <li>• Seed planting</li>
                      <li>• Apply base fertilizers</li>
                      <li>• Irrigation setup</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-yellow-600">Summer</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Crop monitoring</li>
                      <li>• Pest control</li>
                      <li>• Weed management</li>
                      <li>• Water management</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-600">Autumn</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Harvest planning</li>
                      <li>• Post-harvest processing</li>
                      <li>• Storage preparation</li>
                      <li>• Market analysis</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-600">Winter</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Equipment maintenance</li>
                      <li>• Soil testing</li>
                      <li>• Planning next season</li>
                      <li>• Training and learning</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Advisory;