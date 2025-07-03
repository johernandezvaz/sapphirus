/*
  # Agregar sistema de direcciones de envío

  1. Nueva tabla
    - `shipping_addresses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `full_name` (text)
      - `phone` (text)
      - `street_address` (text)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `is_default` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modificar tabla orders
    - Agregar `shipping_address_id` (uuid, foreign key)
    - Agregar `shipping_cost` (numeric)

  3. Seguridad
    - Enable RLS en `shipping_addresses`
    - Políticas para que usuarios solo vean sus direcciones
*/

-- Crear tabla de direcciones de envío
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agregar columnas a la tabla orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_address_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_address_id uuid REFERENCES shipping_addresses(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_cost numeric DEFAULT 0 CHECK (shipping_cost >= 0);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para shipping_addresses
CREATE POLICY "Users can view own shipping addresses"
  ON shipping_addresses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shipping addresses"
  ON shipping_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shipping addresses"
  ON shipping_addresses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shipping addresses"
  ON shipping_addresses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Función para asegurar que solo una dirección sea default por usuario
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE shipping_addresses 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para la función
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON shipping_addresses;
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();