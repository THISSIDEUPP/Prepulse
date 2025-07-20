
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.daily_pulses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  spy_iwm_rotation TEXT NOT NULL CHECK (spy_iwm_rotation IN ('SPY_LEADING', 'IWM_LEADING', 'NEUTRAL')),
  breadth_score INTEGER NOT NULL CHECK (breadth_score >= 0 AND breadth_score <= 100),
  leading_sector TEXT NOT NULL,
  lagging_sector TEXT NOT NULL,
  market_strength TEXT NOT NULL CHECK (market_strength IN ('BULLISH', 'NEUTRAL', 'BEARISH')),
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

CREATE TABLE public.market_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  symbol TEXT NOT NULL CHECK (symbol IN ('SPY', 'IWM')),
  open_price DECIMAL(10,4) NOT NULL,
  high_price DECIMAL(10,4) NOT NULL,
  low_price DECIMAL(10,4) NOT NULL,
  close_price DECIMAL(10,4) NOT NULL,
  volume BIGINT NOT NULL,
  rsi_14 DECIMAL(6,3), -- 14-day RSI
  macd_line DECIMAL(8,4), -- MACD line
  macd_signal DECIMAL(8,4), -- MACD signal line
  macd_histogram DECIMAL(8,4), -- MACD histogram
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, symbol)
);


ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.daily_pulses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily pulses" ON public.daily_pulses
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can create pulses" ON public.daily_pulses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only creators can update their pulses" ON public.daily_pulses
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Only creators can delete their pulses" ON public.daily_pulses
  FOR DELETE USING (auth.uid() = created_by);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market data" ON public.market_data
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert market data" ON public.market_data
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX idx_daily_pulses_date ON public.daily_pulses(date);
CREATE INDEX idx_daily_pulses_created_at ON public.daily_pulses(created_at);

CREATE INDEX idx_market_data_date ON public.market_data(date);
CREATE INDEX idx_market_data_symbol ON public.market_data(symbol);
CREATE INDEX idx_market_data_date_symbol ON public.market_data(date, symbol);

CREATE TABLE public.short_interest_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  symbol TEXT NOT NULL CHECK (symbol IN ('SPY', 'IWM')),
  short_interest_ratio DECIMAL(6,2) NOT NULL,
  short_interest_percent_float DECIMAL(6,2) NOT NULL,
  total_shares_shorted BIGINT NOT NULL,
  last_report_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, symbol)
);

ALTER TABLE public.short_interest_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view short interest data" ON public.short_interest_data
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert short interest data" ON public.short_interest_data
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_short_interest_date ON public.short_interest_data(date);
CREATE INDEX idx_short_interest_symbol ON public.short_interest_data(symbol);
CREATE INDEX idx_short_interest_date_symbol ON public.short_interest_data(date, symbol);
