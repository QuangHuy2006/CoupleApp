-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  full_name varchar(255) NOT NULL,
  avatar text DEFAULT NULL,
  phone_number varchar(20) DEFAULT NULL,
  cccd varchar(20) UNIQUE DEFAULT NULL,
  profile_complete boolean DEFAULT false,
  user_code varchar(8) UNIQUE NOT NULL,
  is_paired boolean DEFAULT false,
  partner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  partner_name varchar(255) DEFAULT NULL,
  pair_code varchar(10) DEFAULT NULL,
  latitude numeric(10,8) DEFAULT NULL,
  longitude numeric(11,8) DEFAULT NULL,
  anniversary_date date DEFAULT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE couple_pairs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(10) UNIQUE NOT NULL,
  user1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id uuid DEFAULT NULL REFERENCES users(id) ON DELETE CASCADE,
  status varchar(20) DEFAULT 'pending',
  paired_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id uuid NOT NULL REFERENCES couple_pairs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  content text,
  images text,
  location varchar(255) DEFAULT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id uuid NOT NULL REFERENCES couple_pairs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  type varchar(20) DEFAULT 'text',
  media_url text
);

CREATE TABLE user_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_path text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id uuid NOT NULL REFERENCES couple_pairs(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Tạo các function và trigger cho việc tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_locations_updated_at
    BEFORE UPDATE ON user_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
