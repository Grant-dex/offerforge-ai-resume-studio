-- OfferForge Database Schema

CREATE DATABASE IF NOT EXISTS offerforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE offerforge;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nickname    VARCHAR(50) DEFAULT '',
  phone       VARCHAR(20)  UNIQUE DEFAULT NULL,
  email       VARCHAR(100) UNIQUE DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  wechat_openid VARCHAR(100) UNIQUE DEFAULT NULL,
  avatar_url  VARCHAR(500) DEFAULT '',
  is_pro      TINYINT(1)  DEFAULT 0,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Verification codes table
CREATE TABLE IF NOT EXISTS verify_codes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  target      VARCHAR(100) NOT NULL,
  code        VARCHAR(10)  NOT NULL,
  type        ENUM('sms','email') NOT NULL,
  used        TINYINT(1)  DEFAULT 0,
  expires_at  DATETIME    NOT NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target_type (target, type)
);

-- WeChat ticket table
CREATE TABLE IF NOT EXISTS wechat_tickets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  scene_id    VARCHAR(64) NOT NULL UNIQUE,
  ticket      VARCHAR(255) DEFAULT NULL,
  qr_url      VARCHAR(500) DEFAULT NULL,
  openid      VARCHAR(100) DEFAULT NULL,
  status      ENUM('pending','scanned','confirmed','expired') DEFAULT 'pending',
  expires_at  DATETIME    NOT NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scene_id (scene_id)
);
