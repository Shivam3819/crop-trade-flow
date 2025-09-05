import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Wheat, Users, TrendingUp, Shield } from 'lucide-react';

const Home = () => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/5 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Wheat className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CropConnect
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Bridging the gap between farmers and buyers through innovative agricultural technology
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to="/marketplace">
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore Marketplace
                  </Button>
                </Link>
                {profile?.role === 'farmer' ? (
                  <Link to="/farmer-dashboard">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Farmer Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/buyer-dashboard">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Buyer Dashboard
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Marketplace
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-8">
            We're revolutionizing agriculture by creating direct connections between farmers and buyers, 
            ensuring fair prices, transparent transactions, and sustainable farming practices. Our platform 
            empowers farmers with market insights and provides buyers with quality produce directly from the source.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose CropConnect?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Wheat className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Direct Trading</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect farmers directly with buyers, eliminating middlemen and ensuring fair prices
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Smart Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure agreements that protect both farmers and buyers with transparent terms
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time pricing and demand data to help farmers make informed decisions
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Advisory Services</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Soil testing and expert agricultural advice to optimize crop yields
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Agriculture?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of farmers and buyers who are already benefiting from our platform
          </p>
          {!user && (
            <Link to="/auth">
              <Button size="lg">
                Join CropConnect Today
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;