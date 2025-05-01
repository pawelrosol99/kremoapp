-- Utworzenie tabeli dla kontrahentów
CREATE TABLE contractors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  street TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  nip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla pracowników
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla użytkowników (uwierzytelnianie)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'worker')),
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla firm przypisanych do kontrahentów
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  street TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  nip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla kierowców przypisanych do firm
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla pieców
CREATE TABLE ovens (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  custom_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla kremacji
CREATE TABLE cremations (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  cremation_date DATE NOT NULL,
  cremation_time TIME NOT NULL,
  family_visit TEXT CHECK (family_visit IN ('present', 'not_present', 'no_data')),
  cremation_type TEXT CHECK (cremation_type IN ('normal', 'exhumation')),
  weight TEXT CHECK (weight IN ('up_to_100kg', 'plus_100kg', 'max')),
  password TEXT,
  unique_number TEXT NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla danych zmarłego
CREATE TABLE deceased_data (
  id SERIAL PRIMARY KEY,
  cremation_id INTEGER REFERENCES cremations(id) ON DELETE CASCADE,
  full_name TEXT,
  birth_place TEXT,
  birth_date DATE,
  death_place TEXT,
  death_date DATE,
  registry_office TEXT,
  death_certificate_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla danych zleceniodawcy
CREATE TABLE commissioner_data (
  id SERIAL PRIMARY KEY,
  cremation_id INTEGER REFERENCES cremations(id) ON DELETE CASCADE,
  full_name TEXT,
  residence TEXT,
  phone TEXT,
  email TEXT,
  id_number TEXT,
  id_series TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla czasu pracy pracowników
CREATE TABLE work_time (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours_worked NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla logów
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli dla wzorów świadectw kremacji
CREATE TABLE cremation_certificates (
  id SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  template_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dodanie super admina
INSERT INTO users (login, password, role) 
VALUES ('superadmin', 'superadminjogi123', 'super_admin');
