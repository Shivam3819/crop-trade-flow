-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('farmer', 'buyer');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create crops table
CREATE TABLE public.crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on crops
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Create RFQs (Request for Quotations) table
CREATE TABLE public.rfqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  crop TEXT NOT NULL,
  grade TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  delivery_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rfqs
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  crop TEXT NOT NULL,
  acreage DECIMAL(10,2),
  quantity INTEGER,
  price DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create soil tests table
CREATE TABLE public.soil_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on soil_tests
ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for soil test files
INSERT INTO storage.buckets (id, name, public) VALUES ('soil-tests', 'soil-tests', false);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'farmer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at
  BEFORE UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for crops
CREATE POLICY "Anyone can view crops" ON public.crops
  FOR SELECT USING (true);

CREATE POLICY "Farmers can insert their own crops" ON public.crops
  FOR INSERT WITH CHECK (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );

CREATE POLICY "Farmers can update their own crops" ON public.crops
  FOR UPDATE USING (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );

CREATE POLICY "Farmers can delete their own crops" ON public.crops
  FOR DELETE USING (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );

-- RLS Policies for rfqs
CREATE POLICY "Anyone can view RFQs" ON public.rfqs
  FOR SELECT USING (true);

CREATE POLICY "Buyers can insert their own RFQs" ON public.rfqs
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'buyer')
  );

CREATE POLICY "Buyers can update their own RFQs" ON public.rfqs
  FOR UPDATE USING (
    auth.uid() = buyer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'buyer')
  );

CREATE POLICY "Buyers can delete their own RFQs" ON public.rfqs
  FOR DELETE USING (
    auth.uid() = buyer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'buyer')
  );

-- RLS Policies for contracts
CREATE POLICY "Users can view contracts they are part of" ON public.contracts
  FOR SELECT USING (auth.uid() = farmer_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can insert contracts they are part of" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = farmer_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can update contracts they are part of" ON public.contracts
  FOR UPDATE USING (auth.uid() = farmer_id OR auth.uid() = buyer_id);

-- RLS Policies for soil_tests
CREATE POLICY "Farmers can view their own soil tests" ON public.soil_tests
  FOR SELECT USING (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );

CREATE POLICY "Farmers can insert their own soil tests" ON public.soil_tests
  FOR INSERT WITH CHECK (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );

-- Storage policies for soil-tests bucket
CREATE POLICY "Farmers can upload their own soil tests" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'soil-tests' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );

CREATE POLICY "Farmers can view their own soil test files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'soil-tests' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );

CREATE POLICY "Farmers can delete their own soil test files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'soil-tests' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'farmer')
  );