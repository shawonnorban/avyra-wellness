-- MySQL dump 10.13  Distrib 8.4.7, for Win64 (x86_64)
--
-- Host: localhost    Database: avyra_db
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `blocked_devices`
--

DROP TABLE IF EXISTS `blocked_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocked_devices` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `blocked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blocked_devices_device_fingerprint_unique` (`device_fingerprint`),
  KEY `blocked_devices_blocked_by_foreign` (`blocked_by`),
  CONSTRAINT `blocked_devices_blocked_by_foreign` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocked_devices`
--

LOCK TABLES `blocked_devices` WRITE;
/*!40000 ALTER TABLE `blocked_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `blocked_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blocked_ips`
--

DROP TABLE IF EXISTS `blocked_ips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocked_ips` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `blocked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blocked_ips_ip_address_unique` (`ip_address`),
  KEY `blocked_ips_blocked_by_foreign` (`blocked_by`),
  CONSTRAINT `blocked_ips_blocked_by_foreign` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocked_ips`
--

LOCK TABLES `blocked_ips` WRITE;
/*!40000 ALTER TABLE `blocked_ips` DISABLE KEYS */;
/*!40000 ALTER TABLE `blocked_ips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blocked_phones`
--

DROP TABLE IF EXISTS `blocked_phones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blocked_phones` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `blocked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blocked_phones_phone_unique` (`phone`),
  KEY `blocked_phones_blocked_by_foreign` (`blocked_by`),
  CONSTRAINT `blocked_phones_blocked_by_foreign` FOREIGN KEY (`blocked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blocked_phones`
--

LOCK TABLES `blocked_phones` WRITE;
/*!40000 ALTER TABLE `blocked_phones` DISABLE KEYS */;
/*!40000 ALTER TABLE `blocked_phones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('avyra-cache-5c785c036466adea360111aa28563bfd556b5fba','i:1;',1785897046),('avyra-cache-5c785c036466adea360111aa28563bfd556b5fba:timer','i:1785897046;',1785897046),('avyra-cache-66540f729052ffd0181e3802137c0ff94f0643ca','i:1;',1785347027),('avyra-cache-66540f729052ffd0181e3802137c0ff94f0643ca:timer','i:1785347027;',1785347027),('avyra-cache-otp-send:01716196421','i:1;',1785299948),('avyra-cache-otp-send:01716196421:timer','i:1785299948;',1785299948),('avyra-cache-setting:courier_steadfast','a:6:{s:7:\"api_key\";s:0:\"\";s:7:\"enabled\";b:0;s:8:\"base_url\";s:32:\"https://portal.packzy.com/api/v1\";s:9:\"auto_sync\";b:1;s:10:\"secret_key\";s:0:\"\";s:13:\"webhook_token\";s:0:\"\";}',2101115325),('avyra-cache-setting:delivery','a:5:{s:17:\"delivery_discount\";i:60;s:19:\"free_delivery_above\";N;s:19:\"inside_dhaka_charge\";i:60;s:20:\"outside_dhaka_charge\";i:120;s:25:\"delivery_discount_enabled\";b:1;}',2101120261),('avyra-cache-setting:fraud_detection','a:8:{s:7:\"enabled\";b:0;s:13:\"block_message\";s:261:\"দুঃখিত, আপনার অর্ডারটি এই মুহূর্তে সম্পন্ন করা যাচ্ছে না। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।\";s:16:\"ip_block_minutes\";i:30;s:16:\"min_phone_digits\";i:11;s:18:\"min_address_length\";i:15;s:19:\"phone_block_minutes\";i:60;s:21:\"device_fingerprinting\";b:0;s:26:\"delivery_success_threshold\";i:40;}',2101120261),('avyra-cache-setting:order','a:2:{s:11:\"require_otp\";b:0;s:12:\"auto_confirm\";b:0;}',2100706967);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaign_visits`
--

DROP TABLE IF EXISTS `campaign_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_visits` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `campaign_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `landing_page_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'view',
  `utm_source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_medium` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_campaign` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `campaign_visits_campaign_id_foreign` (`campaign_id`),
  KEY `campaign_visits_landing_page_id_event_type_created_at_index` (`landing_page_id`,`event_type`,`created_at`),
  CONSTRAINT `campaign_visits_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_visits_landing_page_id_foreign` FOREIGN KEY (`landing_page_id`) REFERENCES `landing_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaign_visits`
--

LOCK TABLES `campaign_visits` WRITE;
/*!40000 ALTER TABLE `campaign_visits` DISABLE KEYS */;
INSERT INTO `campaign_visits` VALUES ('019facb1-fe79-7024-aae6-67073aff59c5',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:06:14'),('019facb2-4140-7260-a679-ead7a885909d',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','cta_click',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:06:31'),('019facb2-4f2d-70a4-819a-c21e08b2b489',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','cta_click',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:06:34'),('019facb3-6ca6-7290-8838-7e7efb44b32a',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','order',NULL,NULL,NULL,NULL,NULL,'2026-07-29 01:07:47'),('019facb3-6de5-7278-bac5-ca324836fc5d',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','order',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:07:48'),('019facb4-9019-72d9-b761-4e023c8f3f96',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:09:02'),('019facb4-923c-7093-b4c9-f702ecde74e3',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:09:02'),('019facb6-17a9-72e4-bcc3-4f2a81dc3f72',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:10:42'),('019facb6-1ee7-71f4-a667-3ff349978c39',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','cta_click',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:10:44'),('019facb7-79ce-7268-b262-da90cfc6b8a5',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','order',NULL,NULL,NULL,NULL,NULL,'2026-07-29 01:12:13'),('019facb7-7aa0-72cc-9b5b-36bac6780cf8',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','order',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 01:12:13'),('019faecf-0c0b-7338-9698-1303b949ba29',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 10:57:12'),('019faecf-1ec9-7256-ac6c-7d686ba3805d',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 10:57:17'),('019faecf-1fd8-7341-8d66-73211ededecb',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 10:57:17'),('019faecf-2477-71a0-8382-83f13a375585',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 10:57:18'),('019faecf-261b-70f2-bd31-396f5d3e4588',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 10:57:19'),('019faed4-9fc0-71b8-9cd9-aff8d3fbf05e',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','cta_click',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:03:17'),('019faed4-fa4c-71e3-bb59-b8c696f86cb5',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','cta_click',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:03:41'),('019faed6-8b0e-73d1-9db3-c84bb1c673a4',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:05:23'),('019faedb-3a39-738c-a759-f4bd0c70e655',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:10:30'),('019faeec-43fb-701e-bcc8-7436f6bff5e4',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:29:07'),('019faeec-47d2-731c-9a82-3ef902b216bf',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:29:08'),('019faeec-4a40-7383-b0b3-c9d680882faf',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:29:08'),('019faeed-4702-71f4-acc9-4d2257109a0a',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:30:13'),('019faeef-9175-729c-a3e2-ab5cf3ffecec',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:32:43'),('019faef5-a337-703a-8276-cc9a1a59c2a2',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:39:21'),('019faf04-ed57-7352-96d1-ceae8ae3e761',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:56:03'),('019faf07-4c7b-7035-b319-d9cd9243915b',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 11:58:38'),('019faf09-0a22-7361-96c1-da27bf717097',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 12:00:33'),('019fb0a9-d093-70a6-8de6-f3e0ffe2c916',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 19:35:46'),('019fb0aa-43b4-70ca-972e-b8db97caabe3',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 19:36:16'),('019fb146-55bf-70cd-8c97-fdbe1d76e42d',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:26:44'),('019fb146-5818-707d-bb55-2c85328407e4',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:26:45'),('019fb147-5682-7004-878d-09b4e31858c7',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:27:50'),('019fb147-8fec-72be-b8db-fe2786e37ed1',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:28:04'),('019fb152-8b23-7033-b737-237406750d3a',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:40:04'),('019fb154-b964-7112-827f-679dcc295b5b',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:42:27'),('019fb156-2e2f-73f5-a729-c98893cd9fad',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:44:02'),('019fb157-f9e5-71a5-ac8d-18abd4541179',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:46:00'),('019fb158-5b40-70d6-80a4-7f439374f3c4',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:46:25'),('019fb15d-fcd7-737a-b8dd-d1d5dbe6f53b',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:52:34'),('019fb15e-696b-737e-bc2b-e9aa4a280a52',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 22:53:02'),('019fb173-9076-705c-8b66-c28673c682ae',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:16:08'),('019fb173-91ac-73aa-bcce-2a4cbdbbb96f',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:16:09'),('019fb178-8d6d-720c-8983-fae516411103',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:21:35'),('019fb179-42e6-7175-b3ee-c9bd7a16a091',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:22:22'),('019fb182-414e-7150-a5e2-c4124628cce2',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:32:11'),('019fb183-c383-73b2-a391-a7863e00465d',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:33:50'),('019fb188-eb53-731d-900e-064aa781d2f7',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:39:28'),('019fb199-dad5-7258-af8f-6c50569d69fa',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-29 23:57:58'),('019fb19d-db31-728d-85ec-d98808182499',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-30 00:02:20'),('019fb1a5-30e0-7255-a03d-f7b1c22e25c0',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-30 00:10:21'),('019fb1a6-68a7-73dd-9bc0-40d37b7549d4',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','cta_click',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-07-30 00:11:40'),('019fc0ed-4306-7267-b67b-27efcc181b5a',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-01 23:23:22'),('019fc101-b18c-72b5-a434-b0950a41a835',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-01 23:45:41'),('019fc130-77d9-72e1-96b3-2e67bbb40224',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 00:36:46'),('019fc163-170f-7013-9a68-ab17e746a7f8',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 01:32:04'),('019fc201-b845-70d1-a218-faf6b9de61ad',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 04:25:20'),('019fc203-d0cc-72d0-9d3c-6e054169d987',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 04:27:37'),('019fc203-d1de-7349-bfcc-63da975758a1',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 04:27:38'),('019fc203-de94-734e-9727-7c501ceb2e6e',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 04:27:41'),('019fc203-e063-7285-b681-5b6bcabc655c',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 04:27:41'),('019fc203-e234-72e0-a626-560ea3375f05',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 04:27:42'),('019fc203-e543-710a-8ab9-5983d0c0a129',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 04:27:43'),('019fc231-7b30-7057-a2e3-b291f242f90c',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-02 05:17:30'),('019fc26c-a881-7038-972a-d750515d5e44',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36','2026-08-02 06:22:08'),('019fc754-916e-730c-9e76-30150539468c',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-03 05:13:56'),('019fc87e-ec53-704c-885b-41508d905595',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','2026-08-03 10:39:49'),('019fc87f-caa2-724b-b47f-3402a58481e0',NULL,'019facb1-54f6-7213-8844-81cc63ef3abe','view',NULL,NULL,NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0','2026-08-03 10:40:45');
/*!40000 ALTER TABLE `campaign_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `campaign_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Facebook',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `spend` decimal(12,2) NOT NULL DEFAULT '0.00',
  `impressions` bigint unsigned NOT NULL DEFAULT '0',
  `conversions` int unsigned NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `campaigns_campaign_code_unique` (`campaign_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` enum('percent','fixed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `max_discount` decimal(12,2) DEFAULT NULL,
  `max_usage` int unsigned DEFAULT NULL,
  `current_usage` int unsigned NOT NULL DEFAULT '0',
  `starts_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES ('019fa9df-3777-73b3-83ef-045f7fd50e3d','AVYRA10','percent',10.00,1000.00,300.00,500,0,NULL,NULL,1,'2026-07-28 11:56:46','2026-07-28 11:56:46');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courier_consignments`
--

DROP TABLE IF EXISTS `courier_consignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_consignments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `courier` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'steadfast',
  `consignment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `cod_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `courier_charge` decimal(10,2) NOT NULL DEFAULT '0.00',
  `weight` decimal(8,2) NOT NULL DEFAULT '0.50',
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_address` text COLLATE utf8mb4_unicode_ci,
  `recipient_city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_zone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `is_external` tinyint(1) NOT NULL DEFAULT '0',
  `delivered_at` timestamp NULL DEFAULT NULL,
  `returned_at` timestamp NULL DEFAULT NULL,
  `last_synced_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courier_consignments_courier_consignment_id_unique` (`courier`,`consignment_id`),
  KEY `courier_consignments_order_id_foreign` (`order_id`),
  KEY `courier_consignments_tracking_code_index` (`tracking_code`),
  KEY `courier_consignments_invoice_index` (`invoice`),
  KEY `courier_consignments_status_index` (`status`),
  CONSTRAINT `courier_consignments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courier_consignments`
--

LOCK TABLES `courier_consignments` WRITE;
/*!40000 ALTER TABLE `courier_consignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `courier_consignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courier_returns`
--

DROP TABLE IF EXISTS `courier_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_returns` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consignment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `return_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_restored` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `courier_returns_consignment_id_foreign` (`consignment_id`),
  KEY `courier_returns_order_id_foreign` (`order_id`),
  CONSTRAINT `courier_returns_consignment_id_foreign` FOREIGN KEY (`consignment_id`) REFERENCES `courier_consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `courier_returns_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courier_returns`
--

LOCK TABLES `courier_returns` WRITE;
/*!40000 ALTER TABLE `courier_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `courier_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courier_status_logs`
--

DROP TABLE IF EXISTS `courier_status_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courier_status_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consignment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `raw_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sync',
  `note` text COLLATE utf8mb4_unicode_ci,
  `logged_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `courier_status_logs_consignment_id_logged_at_index` (`consignment_id`,`logged_at`),
  CONSTRAINT `courier_status_logs_consignment_id_foreign` FOREIGN KEY (`consignment_id`) REFERENCES `courier_consignments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courier_status_logs`
--

LOCK TABLES `courier_status_logs` WRITE;
/*!40000 ALTER TABLE `courier_status_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `courier_status_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_risk_profiles`
--

DROP TABLE IF EXISTS `customer_risk_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_risk_profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_orders` int unsigned NOT NULL DEFAULT '0',
  `delivered` int unsigned NOT NULL DEFAULT '0',
  `failed` int unsigned NOT NULL DEFAULT '0',
  `failure_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `risk_flag` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Low',
  `is_whitelisted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_risk_profiles_phone_unique` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_risk_profiles`
--

LOCK TABLES `customer_risk_profiles` WRITE;
/*!40000 ALTER TABLE `customer_risk_profiles` DISABLE KEYS */;
INSERT INTO `customer_risk_profiles` VALUES ('019fac3f-6ce4-7249-8981-c07495a57b63','01716196421',1,0,1,100.00,'Low',0,'2026-07-28 23:01:05','2026-07-28 23:01:05');
/*!40000 ALTER TABLE `customer_risk_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Registered','Guest') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Registered',
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `total_orders` int NOT NULL DEFAULT '0',
  `total_spent` decimal(12,2) NOT NULL DEFAULT '0.00',
  `last_order_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_code_unique` (`code`),
  KEY `customers_phone_index` (`phone`),
  KEY `customers_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('019fa9fb-bad4-7171-b5e6-829be7944ee9','CUS-UOSBCGO5','Shaw','Guest','01716196421','admin@norbanlv.com','Dhaka',2,0.00,'2026-08-03','2026-07-28 12:27:54','2026-08-03 06:31:02'),('019facb3-6c50-70e3-90c7-da5413b85cef','CUS-9NTWJWEG','Kamal','Guest','01700000000',NULL,'sdfgsdf',1,0.00,'2026-07-29','2026-07-29 01:07:47','2026-07-29 01:07:47'),('019facb7-7995-70c6-a8c0-9bd8e246baa1','CUS-QAG8PIGI','Korin','Guest','01838603803',NULL,'Dhaka',1,0.00,'2026-07-29','2026-07-29 01:12:13','2026-07-29 01:12:13'),('019faef8-c73c-7297-a368-8d13b0c2c398','CUS-X6LALC4K','Shamim','Guest','01876886655',NULL,'Dhaka',1,0.00,'2026-07-29','2026-07-29 11:42:47','2026-07-29 11:42:47');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fb_event_logs`
--

DROP TABLE IF EXISTS `fb_event_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fb_event_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_name` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'failed',
  `payload` json DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `attempt_count` tinyint unsigned NOT NULL DEFAULT '0',
  `last_attempt_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fb_event_logs_order_id_foreign` (`order_id`),
  KEY `fb_event_logs_status_attempt_count_index` (`status`,`attempt_count`),
  CONSTRAINT `fb_event_logs_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fb_event_logs`
--

LOCK TABLES `fb_event_logs` WRITE;
/*!40000 ALTER TABLE `fb_event_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `fb_event_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fraud_attempt_log`
--

DROP TABLE IF EXISTS `fraud_attempt_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fraud_attempt_log` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fraud_attempt_log_phone_created_at_index` (`phone`,`created_at`),
  KEY `fraud_attempt_log_ip_address_created_at_index` (`ip_address`,`created_at`),
  KEY `fraud_attempt_log_device_fingerprint_created_at_index` (`device_fingerprint`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fraud_attempt_log`
--

LOCK TABLES `fraud_attempt_log` WRITE;
/*!40000 ALTER TABLE `fraud_attempt_log` DISABLE KEYS */;
INSERT INTO `fraud_attempt_log` VALUES ('019fa9fb-baaa-71a8-9a75-a7425a2aa7c1','01716196421','127.0.0.1','fp_1solzgd','2026-07-28 18:27:54'),('019facb3-6c2f-7036-b9f9-02476abf91e2','01700000000','127.0.0.1','fp_1solzgd','2026-07-29 07:07:47'),('019facb7-795f-73a9-9cdc-ed5573a76c19','01838603803','127.0.0.1','fp_1solzgd','2026-07-29 07:12:13'),('019faef8-c6c9-703a-94fa-0d4f21c879f1','01876886655','127.0.0.1','fp_1solzgd','2026-07-29 17:42:47'),('019fc79b-2664-720c-bda2-9e232d4f2c36','01716196421','127.0.0.1','fp_1u2nk2j','2026-08-03 12:31:01');
/*!40000 ALTER TABLE `fraud_attempt_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `landing_pages`
--

DROP TABLE IF EXISTS `landing_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `landing_pages` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campaign_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `headline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_headline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hero_image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sections` json DEFAULT NULL,
  `show_header` tinyint(1) NOT NULL DEFAULT '0',
  `show_footer` tinyint(1) NOT NULL DEFAULT '0',
  `cta_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'অর্ডার করুন',
  `cta_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'order_form',
  `cta_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countdown_end` timestamp NULL DEFAULT NULL,
  `delivery_charge_inside` decimal(10,2) DEFAULT NULL,
  `delivery_charge_outside` decimal(10,2) DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `landing_pages_slug_unique` (`slug`),
  KEY `landing_pages_product_id_foreign` (`product_id`),
  KEY `landing_pages_campaign_id_foreign` (`campaign_id`),
  KEY `landing_pages_created_by_foreign` (`created_by`),
  CONSTRAINT `landing_pages_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL,
  CONSTRAINT `landing_pages_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `landing_pages_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `landing_pages`
--

LOCK TABLES `landing_pages` WRITE;
/*!40000 ALTER TABLE `landing_pages` DISABLE KEYS */;
INSERT INTO `landing_pages` VALUES ('019facb1-54f6-7213-8844-81cc63ef3abe','vital-plus','Avyra Vital Plus','019fa9df-3742-7152-815f-5f31135c0fc7',NULL,'Avyra Vital Plus','vital-plus',NULL,'[{\"type\": \"order_form\"}, {\"type\": \"reviews\", \"images\": [\"reviews/2026/07/1b6327df-fd11-470e-8551-a4b4a25188ae.webp\", \"reviews/2026/07/65031e19-18bb-439e-9145-ef5c367b5662.webp\", \"reviews/2026/07/9ba45c74-2f18-41b1-a0b0-c3e73c055397.webp\", \"reviews/2026/07/01724654-0298-465d-891d-d728f8a04561.webp\", \"reviews/2026/07/7b5850f6-b15c-470f-b4a6-319aaa51c2d7.webp\"]}, {\"type\": \"gallery\", \"images\": [\"landing/2026/07/f0785ae1-2a4d-4a60-aa9a-d817abb544da.webp\", \"landing/2026/07/8b951006-398f-4048-aca4-8cd77325c038.webp\", \"landing/2026/07/4bde3f2d-1e12-412a-90eb-4aaa5a04164b.webp\", \"landing/2026/07/b3920372-c9e0-4de2-bd15-3a60bd49bcaf.webp\", \"landing/2026/07/14e3391b-396d-44e8-9e87-74a2ade704fc.webp\"], \"heading\": null}, {\"type\": \"faq\", \"items\": [{\"a\": \"Vital Plus একটি প্রাকৃতিক ভেষজ উপাদানে তৈরি ওয়েলনেস ফুড, যা শরীরের এনার্জি, স্ট্যামিনা, রোগ প্রতিরোধ ক্ষমতা ও সার্বিক সুস্থতা বজায় রাখতে সহায়তা করে। এটি ক্লান্তি কমাতে, কর্মক্ষমতা বাড়াতে এবং দৈনন্দিন পুষ্টির চাহিদা পূরণে সহায়ক। পাশাপাশি, এটি প্রাকৃতিকভাবে ব্যক্তিগত সুস্থতা, আত্মবিশ্বাস ও দাম্পত্য জীবনের প্রাণশক্তি বজায় রাখতেও সহায়ক।\", \"q\": \"অ্যাভিরা ভাইটাল প্লাস কী?\"}, {\"a\": \"আমাদের আশেপাশের সবকিছু যখন ভেজালে ভরে যাচ্ছে, তখন আমরা চেষ্টা করেছি প্রাকৃতিক উপাদান দিয়ে তৈরি একটি ওয়েলনেস ফুড আপনাদের হাতে তুলে দিতে, যা পুরুষ সাস্থে সহায়ক।\", \"q\": \"কেন অ্যাভিরা ভাইটাল প্লাস?\"}, {\"a\": \"AVYRA Vital Plus তাদের জন্য, যারা প্রতিদিনের এনার্জি, প্রাণশক্তি ও কর্মক্ষমতা বজায় রাখতে চান। বিশেষ করে যেসব পুরুষ স্ট্যামিনা, আত্মবিশ্বাস ও দাম্পত্য জীবনে আত্মবিশ্বাসের জন্য প্রাকৃতিক ভেষজ সাপোর্ট খুঁজছেন, তাদের দৈনন্দিন ওয়েলনেস রুটিনে এটি একটি উপযোগী সংযোজন।\", \"q\": \"এই পণ্যটি কাদের জন্য?\"}, {\"a\": \"১৮টিরও বেশি প্রিমিয়াম প্রাকৃতিক ও ভেষজ উপাদানের সমন্বয়ে তৈরি। এর বিশেষ ফর্মুলায় রয়েছে খাঁটি মধু, অশ্বগন্ধা, চিলগুজার শাঁস, শতমূলী, পানিফল, রুমি মস্তগি, এলাচ, পেস্তা বাদাম, কাজু বাদাম, কাঠ বাদাম, চুনিয়া গদ, জয়ফল, আমলকী, চিনা বাদাম, ঘি এবং আরও বহু মূল্যবান ভেষজ উপাদান। প্রতিটি উপাদান যত্নসহকারে নির্বাচন করে এমনভাবে সংযোজন করা হয়েছে, যাতে এটি আপনার প্রতিদিনের সুস্থতা, প্রাণশক্তি ও সক্রিয় জীবনধারাকে প্রাকৃতিকভাবে সাপোর্ট করতে পারে।\", \"q\": \"মূল উপাদানগুলো কী কী?\"}, {\"a\": \"ভাইটাল প্লাস একটি প্রাকৃতিক ভেষজ উপাদানে তৈরি ওয়েলনেস ফুড, যা শরীরের শক্তি, স্ট্যামিনা, রোগ প্রতিরোধ ক্ষমতা ও সার্বিক সুস্থতা বজায় রাখতে সাহায্য করে। এটি ক্লান্তি কমাতে, পারফরম্যান্স বাড়াতে ও দৈনিক পুষ্টির চাহিদা মেটাতে সহায়তা করে। পাশাপাশি প্রাকৃতিকভাবে ব্যক্তিগত সুস্থতা, আত্মবিশ্বাস ও দাম্পত্য প্রাণশক্তি বজায় রাখতেও সহায়ক।\", \"q\": \"মূল উপাদানগুলো কী কী?\"}, {\"a\": \"যেহেতু ভাইটাল প্লাস সম্পূর্ণ প্রাকৃতিক ভেষজ উপাদানে তৈরি একটি ফাংশনাল ফুড, তাই কোনো ক্ষতিকর পার্শ্বপ্রতিক্রিয়ার ঝুঁকি নেই। এটি সাধারণ খাবারের মতোই শরীরের জন্য নিরাপদ এবং দীর্ঘমেয়াদী ব্যবহারের উপযোগী।\", \"q\": \"এর কি কোনো পার্শ্বপ্রতিক্রিয়া আছে?\"}, {\"a\": \"ভালো ফলাফলের জন্য প্রতিদিন সকালে ও রাতে খাবারের পর এক চামচ ভাইটাল প্লাস খেলে খুব দ্রুত প্রত্যাশিত ফলাফল পাওয়া যায়।\", \"q\": \"ভাইটাল প্লাস খাওয়ার নিয়ম কি ?\"}], \"heading\": \"সাধারণ জিজ্ঞাসা\"}, {\"url\": \"https://www.youtube.com/watch?v=QEce1CCsJNM\", \"type\": \"video\", \"heading\": null}]',0,0,'অর্ডার করুন','order_form',NULL,NULL,60.00,80.00,'Avyra Vital Plus','Avyra Vital Plus',1,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 01:05:30','2026-07-29 23:39:21');
/*!40000 ALTER TABLE `landing_pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_07_28_000001_create_warehouses_table',1),(5,'2026_07_28_000002_create_products_table',1),(6,'2026_07_28_000003_create_product_variants_table',1),(7,'2026_07_28_000004_create_product_stock_movements_table',1),(8,'2026_07_28_000005_create_shop_banners_table',1),(9,'2026_07_28_000006_create_customers_table',1),(10,'2026_07_28_000007_create_orders_table',1),(11,'2026_07_28_000008_create_order_items_table',1),(12,'2026_07_28_000009_create_settings_table',1),(13,'2026_07_28_000010_add_profile_fields_to_users_table',1),(14,'2026_07_28_000011_create_user_roles_table',1),(15,'2026_07_28_000012_create_role_permissions_table',1),(16,'2026_07_28_000013_create_notifications_table',1),(17,'2026_07_28_000014_add_content_fields_to_products_table',1),(18,'2026_07_28_000015_add_checkout_fields_to_orders_table',1),(19,'2026_07_28_000016_add_variant_to_order_items_table',1),(20,'2026_07_28_000017_create_coupons_table',1),(21,'2026_07_28_000018_create_campaigns_table',1),(22,'2026_07_28_000019_create_landing_pages_table',1),(23,'2026_07_28_000020_create_campaign_visits_table',1),(24,'2026_07_28_000021_create_courier_consignments_table',1),(25,'2026_07_28_000022_create_courier_status_logs_table',1),(26,'2026_07_28_000023_create_courier_returns_table',1),(27,'2026_07_28_000024_create_blocklist_tables',1),(28,'2026_07_28_000025_create_fraud_attempt_log_table',1),(29,'2026_07_28_000026_create_order_risk_scores_table',1),(30,'2026_07_28_000027_create_customer_risk_profiles_table',1),(31,'2026_07_28_000028_create_otp_tables',1),(32,'2026_07_28_000029_create_suppliers_table',1),(33,'2026_07_28_000030_create_purchases_table',1),(34,'2026_07_28_162225_create_personal_access_tokens_table',1),(35,'2026_07_29_000001_create_uploads_table',2),(36,'2026_07_29_000002_convert_image_columns_to_paths',2),(37,'2026_07_30_000001_add_compare_at_price',3),(38,'2026_08_03_000001_collapse_order_statuses',4),(39,'2026_08_03_000002_add_facebook_tracking',4);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_is_read_created_at_index` (`is_read`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('019fa9fb-bb20-7191-b856-360fdd697f09','order','New order received','AVY-20260728-0001 — Shaw (৳1,560.00)','/admin/orders/019fa9fb-badb-701a-8297-0893b263da20','{\"order_id\": \"019fa9fb-badb-701a-8297-0893b263da20\"}',0,'2026-07-28 12:27:54','2026-07-28 12:27:54'),('019facb3-6cb2-7172-8ecf-33b3e4f9c151','order','New order received','AVY-20260729-0001 — Kamal (৳1,510.00)','/admin/orders/019facb3-6c55-7043-a4ab-ef85194a791f','{\"order_id\": \"019facb3-6c55-7043-a4ab-ef85194a791f\"}',0,'2026-07-29 01:07:47','2026-07-29 01:07:47'),('019facb7-79d4-707f-bf9e-22a848d05982','order','New order received','AVY-20260729-0002 — Korin (৳960.00)','/admin/orders/019facb7-79a1-7143-a431-cfb66b01f45c','{\"order_id\": \"019facb7-79a1-7143-a431-cfb66b01f45c\"}',0,'2026-07-29 01:12:13','2026-07-29 01:12:13'),('019faef8-c78c-7034-8b77-0f8cc8f055ab','order','New order received','AVY-20260729-0003 — Shamim (৳1,540.00)','/admin/orders/019faef8-c748-7220-866b-d44bd3d97548','{\"order_id\": \"019faef8-c748-7220-866b-d44bd3d97548\"}',0,'2026-07-29 11:42:47','2026-07-29 11:42:47'),('019fc79b-27db-709b-b363-429f59bce599','order','New order received','AVY-20260803-0001 — Shawon (৳1,540.00)','/admin/orders/019fc79b-270e-72fa-a0f3-50ec58b4db54','{\"order_id\": \"019fc79b-270e-72fa-a0f3-50ec58b4db54\"}',0,'2026-08-03 06:31:02','2026-08-03 06:31:02');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variant_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `variant_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_foreign` (`order_id`),
  KEY `order_items_product_id_foreign` (`product_id`),
  KEY `order_items_variant_id_foreign` (`variant_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `order_items_variant_id_foreign` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES ('019fa9fb-baf0-7036-bb97-a6ed0d526967','019fa9fb-badb-701a-8297-0893b263da20','019fa9df-3742-7152-815f-5f31135c0fc7',NULL,'Vital Plus','250g',1,1490.00,'2026-07-28 12:27:54'),('019facb3-6c68-72c7-9425-91e836d0369b','019facb3-6c55-7043-a4ab-ef85194a791f','019fa9df-3742-7152-815f-5f31135c0fc7',NULL,'Vital Plus','500gm',1,1450.00,'2026-07-29 01:07:47'),('019facb7-79b0-728b-b10f-caf77acad09d','019facb7-79a1-7143-a431-cfb66b01f45c','019fa9df-3742-7152-815f-5f31135c0fc7',NULL,'Vital Plus','250gm',1,900.00,'2026-07-29 01:12:13'),('019faef8-c75c-707a-8c95-61c56555bff0','019faef8-c748-7220-866b-d44bd3d97548','019fa9df-3742-7152-815f-5f31135c0fc7','019faef5-5ce9-73e2-a3e6-f00b5ea6539c','Vital Plus','500gm',1,1540.00,'2026-07-29 11:42:47'),('019fc79b-277b-72ed-afeb-9c1f8989b9fd','019fc79b-270e-72fa-a0f3-50ec58b4db54','019fa9df-3742-7152-815f-5f31135c0fc7','019faef5-5ce9-73e2-a3e6-f00b5ea6539c','Vital Plus','500gm',1,1540.00,'2026-08-03 06:31:02');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_risk_scores`
--

DROP TABLE IF EXISTS `order_risk_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_risk_scores` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `risk_score` int unsigned NOT NULL DEFAULT '0',
  `risk_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Low',
  `signals` json DEFAULT NULL,
  `action_taken` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'allowed',
  `reviewed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_risk_scores_order_id_foreign` (`order_id`),
  KEY `order_risk_scores_reviewed_by_foreign` (`reviewed_by`),
  KEY `order_risk_scores_risk_level_created_at_index` (`risk_level`,`created_at`),
  KEY `order_risk_scores_action_taken_created_at_index` (`action_taken`,`created_at`),
  CONSTRAINT `order_risk_scores_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_risk_scores_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_risk_scores`
--

LOCK TABLES `order_risk_scores` WRITE;
/*!40000 ALTER TABLE `order_risk_scores` DISABLE KEYS */;
INSERT INTO `order_risk_scores` VALUES ('019fa9fb-bb2e-7296-a44f-e58e423a25bd','019fa9fb-badb-701a-8297-0893b263da20','01716196421','127.0.0.1','fp_1solzgd',30,'Medium','[{\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','flagged',NULL,NULL,'2026-07-28 12:27:54','2026-07-28 12:27:54'),('019facb3-6cc4-7266-ba26-4182b540eb14','019facb3-6c55-7043-a4ab-ef85194a791f','01700000000','127.0.0.1','fp_1solzgd',30,'Medium','[{\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','flagged',NULL,NULL,'2026-07-29 01:07:47','2026-07-29 01:07:47'),('019facb4-efb6-73e9-aa70-3d198c159719',NULL,'01609775788','127.0.0.1','fp_1solzgd',230,'Critical','[{\"code\": \"ip_repeat\", \"label\": \"Another checkout from this IP within 30 min\", \"score\": 100}, {\"code\": \"device_repeat\", \"label\": \"Another checkout from this device within the block window\", \"score\": 100}, {\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','blocked',NULL,NULL,'2026-07-29 01:09:26','2026-07-29 01:09:26'),('019facb5-2528-7362-a938-31555463e224',NULL,'01609775788','127.0.0.1','fp_1solzgd',230,'Critical','[{\"code\": \"ip_repeat\", \"label\": \"Another checkout from this IP within 30 min\", \"score\": 100}, {\"code\": \"device_repeat\", \"label\": \"Another checkout from this device within the block window\", \"score\": 100}, {\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','blocked',NULL,NULL,'2026-07-29 01:09:40','2026-07-29 01:09:40'),('019facb5-79f6-72c8-a60f-59f8671c2c33',NULL,'01609775788','127.0.0.1','fp_1solzgd',230,'Critical','[{\"code\": \"ip_repeat\", \"label\": \"Another checkout from this IP within 30 min\", \"score\": 100}, {\"code\": \"device_repeat\", \"label\": \"Another checkout from this device within the block window\", \"score\": 100}, {\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','blocked',NULL,NULL,'2026-07-29 01:10:02','2026-07-29 01:10:02'),('019facb5-8b77-7130-82b1-ef02cc898029',NULL,'01609775788','127.0.0.1','fp_1solzgd',230,'Critical','[{\"code\": \"ip_repeat\", \"label\": \"Another checkout from this IP within 30 min\", \"score\": 100}, {\"code\": \"device_repeat\", \"label\": \"Another checkout from this device within the block window\", \"score\": 100}, {\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','blocked',NULL,NULL,'2026-07-29 01:10:06','2026-07-29 01:10:06'),('019facb6-05a1-73a6-a25e-1ce49ec774dc',NULL,'01898608608','127.0.0.1','fp_1solzgd',230,'Critical','[{\"code\": \"ip_repeat\", \"label\": \"Another checkout from this IP within 30 min\", \"score\": 100}, {\"code\": \"device_repeat\", \"label\": \"Another checkout from this device within the block window\", \"score\": 100}, {\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','blocked',NULL,NULL,'2026-07-29 01:10:37','2026-07-29 01:10:37'),('019facb6-776e-72c5-bf8f-454be52f374e',NULL,'01838603803','127.0.0.1','fp_1solzgd',230,'Critical','[{\"code\": \"ip_repeat\", \"label\": \"Another checkout from this IP within 30 min\", \"score\": 100}, {\"code\": \"device_repeat\", \"label\": \"Another checkout from this device within the block window\", \"score\": 100}, {\"code\": \"short_address\", \"label\": \"Delivery address is implausibly short\", \"score\": 30}]','blocked',NULL,NULL,'2026-07-29 01:11:07','2026-07-29 01:11:07'),('019facb7-79dd-71e1-82d3-d8137e009449','019facb7-79a1-7143-a431-cfb66b01f45c','01838603803','127.0.0.1','fp_1solzgd',0,'Low','[]','allowed',NULL,NULL,'2026-07-29 01:12:13','2026-07-29 01:12:13'),('019faef8-c799-7295-898d-a457b70faeb0','019faef8-c748-7220-866b-d44bd3d97548','01876886655','127.0.0.1','fp_1solzgd',0,'Low','[]','allowed',NULL,NULL,'2026-07-29 11:42:47','2026-07-29 11:42:47'),('019fc79b-27fe-72ae-ae83-14c0ee26c502','019fc79b-270e-72fa-a0f3-50ec58b4db54','01716196421','127.0.0.1','fp_1u2nk2j',0,'Low','[]','allowed',NULL,NULL,'2026-08-03 06:31:02','2026-08-03 06:31:02');
/*!40000 ALTER TABLE `order_risk_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `items_count` int NOT NULL DEFAULT '1',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `delivery_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `coupon_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_zone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `status_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_date` date NOT NULL,
  `order_source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Manual',
  `branch` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Main',
  `warehouse_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cash',
  `payment_sender_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_txn_ref` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `fbclid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fbc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fbp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fb_events_sent` json DEFAULT NULL,
  `utm_source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_medium` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_campaign` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_term` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_content` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `landing_url` text COLLATE utf8mb4_unicode_ci,
  `referrer` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_fingerprint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lazychat_order_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_unique` (`order_number`),
  KEY `orders_customer_id_foreign` (`customer_id`),
  KEY `orders_created_by_foreign` (`created_by`),
  KEY `orders_status_order_date_index` (`status`,`order_date`),
  KEY `orders_phone_index` (`phone`),
  KEY `orders_warehouse_id_foreign` (`warehouse_id`),
  KEY `orders_created_at_index` (`created_at`),
  CONSTRAINT `orders_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `orders_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('019fa9fb-badb-701a-8297-0893b263da20','AVY-20260728-0001','019fa9fb-bad4-7171-b5e6-829be7944ee9','Shaw','01716196421','30',1,1490.00,0.00,70.00,NULL,'inside_dhaka',1560.00,'confirm',NULL,'2026-07-28','Website','Main',NULL,'COD',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'http://localhost:3000/',NULL,'127.0.0.1',NULL,'fp_1solzgd',NULL,NULL,'2026-07-28 12:27:54','2026-07-29 01:11:13'),('019facb3-6c55-7043-a4ab-ef85194a791f','AVY-20260729-0001','019facb3-6c50-70e3-90c7-da5413b85cef','Kamal','01700000000','sdfgsdf',1,1450.00,0.00,60.00,NULL,'inside_dhaka',1510.00,'confirm',NULL,'2026-07-29','Landing Page','Main',NULL,'COD',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'http://localhost:3000/lp/vital-plus',NULL,'127.0.0.1',NULL,'fp_1solzgd',NULL,NULL,'2026-07-29 01:07:47','2026-07-29 01:07:47'),('019facb7-79a1-7143-a431-cfb66b01f45c','AVY-20260729-0002','019facb7-7995-70c6-a8c0-9bd8e246baa1','Korin','01838603803','Dhaka',1,900.00,0.00,60.00,NULL,'inside_dhaka',960.00,'confirm',NULL,'2026-07-29','Landing Page','Main',NULL,'COD',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'http://localhost:3000/lp/vital-plus',NULL,'127.0.0.1',NULL,'fp_1solzgd',NULL,NULL,'2026-07-29 01:12:13','2026-07-29 01:12:13'),('019faef8-c748-7220-866b-d44bd3d97548','AVY-20260729-0003','019faef8-c73c-7297-a368-8d13b0c2c398','Shamim','01876886655','Dhaka',1,1540.00,0.00,0.00,NULL,'inside_dhaka',1540.00,'pending',NULL,'2026-07-29','Landing Page','Main',NULL,'COD',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'http://localhost:3000/lp/vital-plus-offer',NULL,'127.0.0.1',NULL,'fp_1solzgd',NULL,NULL,'2026-07-29 11:42:47','2026-07-29 11:42:47'),('019fc79b-270e-72fa-a0f3-50ec58b4db54','AVY-20260803-0001','019fa9fb-bad4-7171-b5e6-829be7944ee9','Shawon','01716196421','Dhaka',1,1540.00,0.00,0.00,NULL,'inside_dhaka',1540.00,'pending',NULL,'2026-08-03','Website','Main',NULL,'COD',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'http://localhost:3000/avyravitalplus',NULL,'127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36','fp_1u2nk2j',NULL,NULL,'2026-08-03 06:31:01','2026-08-03 06:31:01');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_logs`
--

DROP TABLE IF EXISTS `otp_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `response_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detail` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `otp_logs_phone_created_at_index` (`phone`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_logs`
--

LOCK TABLES `otp_logs` WRITE;
/*!40000 ALTER TABLE `otp_logs` DISABLE KEYS */;
INSERT INTO `otp_logs` VALUES ('019fa9ee-af93-7379-97cc-5544ae2225e6','01716196421','log',1,'logged',NULL,'Written to the application log; no SMS was sent.','2026-07-28 18:13:39'),('019fa9fa-c6db-71da-8613-886cb36d8b68','01716196421','bulksmsbd',1,'202',NULL,'{\"response_code\":202,\"message_id\":6020771,\"success_message\":\"SMS Submitted Successfully 1\",\"error_message\":\"\"}','2026-07-28 18:26:52'),('019fa9fb-5ccb-73fa-8e74-d620bbaabf1e','01716196421','bulksmsbd',1,'202',NULL,'{\"response_code\":202,\"message_id\":6020795,\"success_message\":\"SMS Submitted Successfully 1\",\"error_message\":\"\"}','2026-07-28 18:27:30'),('019fac22-2f2f-7055-b54c-6d2d01c204a7','01716196421','bulksmsbd',1,'202',NULL,'{\"response_code\":202,\"message_id\":6040121,\"success_message\":\"SMS Submitted Successfully 1\",\"error_message\":\"\"}','2026-07-29 04:29:09');
/*!40000 ALTER TABLE `otp_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `expires_at` timestamp NOT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `otp_verifications_phone_expires_at_index` (`phone`,`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
INSERT INTO `otp_verifications` VALUES ('019fa9fb-5a81-70dc-93cc-eed6e9c34ecb','01716196421','$2y$12$tCgPQw.JKQVT4M4A.GnIw.XLn9vq0UVxEy3kdWcgfJ4K4k.72VeOO',1,1,'2026-07-28 12:32:30','2026-07-28 12:27:50','2026-07-28 12:27:30','2026-07-28 12:27:50'),('019fac22-2ca5-7255-9f04-567645ac6ecc','01716196421','$2y$12$r2WG1I82ySj28kfFXwjCeeVxfrJt.Lb9lCkTm9CQd1SJCAxGHlF2G',0,0,'2026-07-28 22:34:08',NULL,'2026-07-28 22:29:08','2026-07-28 22:29:08');
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_stock_movements`
--

DROP TABLE IF EXISTS `product_stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_stock_movements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `change_qty` decimal(12,2) NOT NULL,
  `movement_type` enum('IN','OUT','ADJUST','TRANSFER_IN','TRANSFER_OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouse_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouse_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batch_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_cost_at_time` decimal(12,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `changed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_stock_movements_warehouse_id_foreign` (`warehouse_id`),
  KEY `product_stock_movements_changed_by_foreign` (`changed_by`),
  KEY `product_stock_movements_product_id_created_at_index` (`product_id`,`created_at`),
  CONSTRAINT `product_stock_movements_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `product_stock_movements_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `product_stock_movements_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_stock_movements`
--

LOCK TABLES `product_stock_movements` WRITE;
/*!40000 ALTER TABLE `product_stock_movements` DISABLE KEYS */;
INSERT INTO `product_stock_movements` VALUES ('019fa9e8-cdc9-7144-bca2-20587362835d','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',100.00,'ADJUST','manual',NULL,NULL,NULL,NULL,900.00,NULL,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 12:07:14'),('019fa9fb-bb09-728e-8b7a-f2e4b4f9a121','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',-1.00,'OUT','order','019fa9fb-badb-701a-8297-0893b263da20',NULL,NULL,NULL,900.00,NULL,NULL,'2026-07-28 12:27:54'),('019fac3f-6cb3-71b1-a2da-05cd0ca4d5be','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',1.00,'IN','order_return','019fa9fb-badb-701a-8297-0893b263da20',NULL,NULL,NULL,900.00,'Order marked Cancelled',NULL,'2026-07-28 23:01:05'),('019fac40-f622-7187-8ae8-61f251c83231','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',1000.00,'IN','purchase','019fac40-bf15-71eb-9b1a-80931b563058',NULL,NULL,NULL,500.00,'Stock-in from PO-2026-0001','019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:02:46'),('019facb3-6c7d-730c-a743-3a5e1bbc9dfa','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',-1.00,'OUT','order','019facb3-6c55-7043-a4ab-ef85194a791f',NULL,NULL,NULL,900.00,NULL,NULL,'2026-07-29 01:07:47'),('019facb7-79bc-73f1-aa5b-b05b656eda7b','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',-1.00,'OUT','order','019facb7-79a1-7143-a431-cfb66b01f45c',NULL,NULL,NULL,900.00,NULL,NULL,'2026-07-29 01:12:13'),('019faef8-c76d-7135-ac06-efebdfdfc3b3','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',-1.00,'OUT','order','019faef8-c748-7220-866b-d44bd3d97548',NULL,NULL,NULL,900.00,NULL,NULL,'2026-07-29 11:42:47'),('019fc79b-27ad-7171-b932-38457e7ee1dd','019fa9df-3742-7152-815f-5f31135c0fc7','Vital Plus',-1.00,'OUT','order','019fc79b-270e-72fa-a0f3-50ec58b4db54',NULL,NULL,NULL,900.00,NULL,NULL,'2026-08-03 06:31:02');
/*!40000 ALTER TABLE `product_stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku_suffix` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `cost_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sell_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `compare_at_price` decimal(12,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_variants_product_id_foreign` (`product_id`),
  CONSTRAINT `product_variants_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES ('019faef5-5ce9-73e2-a3e6-f00b5ea6539c','019fa9df-3742-7152-815f-5f31135c0fc7','500gm',NULL,'500GM','products/2026/08/590ee44f-d242-4fe7-a716-7e2e51dc5138.webp',98,900.00,1540.00,1640.00,1,'2026-07-29 11:39:03','2026-08-03 06:31:02'),('019faef7-0e82-724a-9d80-93ec7840188c','019fa9df-3742-7152-815f-5f31135c0fc7','250gm',NULL,'250GM','products/2026/08/726fcb2d-7d50-48f1-9de3-8a21fdcc090f.webp',150,520.00,900.00,1000.00,1,'2026-07-29 11:40:54','2026-08-02 00:36:36');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facility_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `short_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `long_description` longtext COLLATE utf8mb4_unicode_ci,
  `images` json DEFAULT NULL,
  `gallery_images` json DEFAULT NULL,
  `pack_options` json DEFAULT NULL,
  `ingredients` json DEFAULT NULL,
  `nutrition` json DEFAULT NULL,
  `benefits_section` json DEFAULT NULL,
  `trust_section` json DEFAULT NULL,
  `suitability` json DEFAULT NULL,
  `certificates` json DEFAULT NULL,
  `faqs` json DEFAULT NULL,
  `delivery_info` json DEFAULT NULL,
  `terms_conditions` text COLLATE utf8mb4_unicode_ci,
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8mb4_unicode_ci,
  `warehouse` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Dhaka WH-1',
  `quantity` int NOT NULL DEFAULT '0',
  `min_stock` int NOT NULL DEFAULT '20',
  `cost_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sell_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `compare_at_price` decimal(12,2) DEFAULT NULL,
  `last_sale_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_sku_unique` (`sku`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_index` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('019fa9df-3742-7152-815f-5f31135c0fc7','AVY-VP-001','vital-plus','Vital Plus','Men\'s Natural Wellness Formula','Best Seller','Made in a certified facility','Vital Plus','A honey-based blend of pine nuts, cashew, ashwagandha and mastic gum.','Vital Plus combines traditional ingredients into a daily wellness spread.','Vital Plus is built around whole ingredients — no fillers, no synthetic additives. Take one spoon daily, on its own or with warm milk.','[\"products/2026/08/fcebd8ef-646d-4c98-995b-d46a53530a92.webp\"]','[\"products/2026/08/2c11e9bd-184e-4eda-814b-5354a421d03c.webp\", \"products/2026/08/1ae29a30-0754-4eea-80f1-e17d89785827.webp\", \"products/2026/08/1d5f5913-ffa7-494a-85b8-54e64893f48e.webp\", \"products/2026/08/ce87b823-b4cd-47af-8ee1-1bd29d0727e7.webp\", \"products/2026/08/4da1db0c-b421-47d0-b919-1c0f2e861507.webp\"]',NULL,'[{\"name\": \"Pine Nuts\", \"benefit\": \"Zinc and healthy fats\"}, {\"name\": \"Cashew Nuts\", \"benefit\": \"Magnesium and protein\"}, {\"name\": \"Honey\", \"benefit\": \"Natural energy base\"}, {\"name\": \"Ashwagandha\", \"benefit\": \"Traditional adaptogen\"}, {\"name\": \"Mastic Gum\", \"benefit\": \"Digestive support\"}]',NULL,NULL,NULL,NULL,NULL,'[{\"a\": \"One tablespoon daily, preferably in the morning.\", \"q\": \"How do I take it?\"}, {\"a\": \"It is formulated for adult men. Consult a doctor if you are on medication.\", \"q\": \"Is it suitable for everyone?\"}]','[]',NULL,'Vital Plus — Avyra Wellness','Natural men\'s wellness formula from Avyra Wellness.','Dhaka WH-1',248,20,900.00,1490.00,NULL,NULL,1,'2026-07-28 11:56:46','2026-08-03 06:31:02');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items`
--

DROP TABLE IF EXISTS `purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variant_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `received_qty` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rejected_qty` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pcs',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_cost` decimal(14,2) NOT NULL DEFAULT '0.00',
  `batch_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_items_purchase_id_foreign` (`purchase_id`),
  KEY `purchase_items_product_id_foreign` (`product_id`),
  KEY `purchase_items_variant_id_foreign` (`variant_id`),
  CONSTRAINT `purchase_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_items_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_items_variant_id_foreign` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items`
--

LOCK TABLES `purchase_items` WRITE;
/*!40000 ALTER TABLE `purchase_items` DISABLE KEYS */;
INSERT INTO `purchase_items` VALUES ('019fac40-bf5d-7329-86de-76fcd825ffca','019fac40-bf15-71eb-9b1a-80931b563058','019fa9df-3742-7152-815f-5f31135c0fc7',NULL,'Vital Plus',1000.00,1000.00,0.00,'pcs',500.00,500000.00,NULL,'2026-07-28 23:02:32','2026-07-28 23:02:46');
/*!40000 ALTER TABLE `purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `order_date` date NOT NULL,
  `expected_delivery` date DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `items_count` int unsigned NOT NULL DEFAULT '0',
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `shipping_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `other_cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchases_purchase_number_unique` (`purchase_number`),
  KEY `purchases_supplier_id_foreign` (`supplier_id`),
  KEY `purchases_warehouse_id_foreign` (`warehouse_id`),
  KEY `purchases_created_by_foreign` (`created_by`),
  KEY `purchases_status_order_date_index` (`status`,`order_date`),
  CONSTRAINT `purchases_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchases_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchases_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES ('019fac40-bf15-71eb-9b1a-80931b563058','PO-2026-0001','019fac3f-eccb-73f2-a480-7a095d902c88','Hasan',NULL,'Received','2026-07-29',NULL,'2026-07-29',1,500000.00,0.00,0.00,500000.00,0.00,NULL,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:02:32','2026-07-28 23:02:46');
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','employee','manager','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` enum('dashboard','sales','customers','courier','inventory','purchase','marketing','fraud','reports','settings') COLLATE utf8mb4_unicode_ci NOT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT '0',
  `can_create` tinyint(1) NOT NULL DEFAULT '0',
  `can_edit` tinyint(1) NOT NULL DEFAULT '0',
  `can_delete` tinyint(1) NOT NULL DEFAULT '0',
  `can_approve` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_module_unique` (`role`,`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('019fa9df-1d6e-7260-abc9-bd969bd75f4b','manager','dashboard',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1d7e-7207-859b-96639326fbf7','manager','sales',1,1,1,1,1,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1d82-72c6-b7c1-35209be68c1e','manager','customers',1,1,1,1,1,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1d87-72a8-8659-07dfeed191c9','manager','courier',1,1,1,1,1,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1d8c-71a3-bc2b-ffa0d94a0046','manager','inventory',1,1,1,1,1,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1d90-734b-976c-ca86a248132b','manager','purchase',1,1,1,1,1,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1d95-71b3-919e-1a445292e08a','manager','marketing',1,1,1,1,1,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1d9b-725c-b242-491d8859ecdf','manager','fraud',1,1,1,1,1,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1da1-7139-868b-2df7437e8601','manager','reports',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-29 00:30:17'),('019fa9df-1da7-7079-940f-3d04856c0a53','manager','settings',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dac-72c8-a0b3-07b49fe7f679','employee','dashboard',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1db3-7156-8fb6-c9d0a266864b','employee','sales',1,1,1,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1db7-7202-93bb-6ed3974e0889','employee','customers',1,1,1,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dbd-70ee-b88b-8b7bb7ef8ae8','employee','courier',1,1,1,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dc2-7286-82cc-78fd548852f3','employee','inventory',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dc7-726a-afa4-2ca5228bb77a','employee','purchase',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dcc-73f2-8bf2-1100865bc9db','employee','marketing',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dd1-7048-8008-29d2230b5062','employee','fraud',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dd6-704a-959c-f68450329f5d','employee','reports',1,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1ddb-714a-8cec-adf5807a84a1','employee','settings',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1de0-73e3-8ceb-69f99b816df2','user','dashboard',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1de4-73aa-a9cb-ecf00a030a92','user','sales',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1de9-722f-8108-e7f24ca62860','user','customers',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1def-7180-a58f-4c245a88a70e','user','courier',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1df4-70c2-b089-2719f7d2fd28','user','inventory',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dfa-7069-882d-aa0c0ef9938d','user','purchase',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1dff-7167-aa0e-ef7f3bb6ce8a','user','marketing',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1e05-7286-b5ee-6de22112223f','user','fraud',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1e0a-7076-bef3-111bffc22d72','user','reports',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1e11-736a-b11c-60423e7079df','user','settings',0,0,0,0,0,'2026-07-28 11:56:39','2026-07-28 11:56:39');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('0keFdP0WQPQEkDEmHgSZoINA9dUJuBZr1qNz6IBA',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJWdHM3OWs5ajZaMmZPeEVRWkxpQ05BYksxT3pjN0JZbGFjRmhodlhUIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2FkbWluXC9ub3RpZmljYXRpb25zIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785907311),('1sI3Q2r4WWEIk4muukk1BvhmulXsJj5yJuMyVGvJ',NULL,'127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36','eyJfdG9rZW4iOiJvNE0yV2pQWnY2U2pDaENIelNjaEt6bG9lVXBvYldtblcyeXFnRVB2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Jldmlld3MiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785874303),('2HSCUCr71oxCruHOeDeZ6U5NhSfUtYsx8LAKgDqH',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJxb1NiZVhiSFNzd3NYOWFxQjNja0tNSGxUaTBSNkpadVZTYnplODBNIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3NldHRpbmdzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785874301),('6Wu9xCKLyQ6tx84QtEP85870CojXXNG7zQsKN2Dh',NULL,'127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36','eyJfdG9rZW4iOiJoUTVncDEyNVJ4VnFUUUFyWVRYSzBEZGkzTUtoaWV6MW82djdJZEhHIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3NldHRpbmdzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785907313),('8ODfwn84TwOYUWHjRMhK7CHK1cCb5Wm94YFCaEiH',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJhRVNHNEZtbWFhb21NQWlhVzRnQko5QWJ1cGsyb2gxaFBaZlRDcHR3IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2FkbWluXC9kYXNoYm9hcmRcL3JldmVudWUtY2hhcnQiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785907312),('92xiRgslCPdh0kYjqImsPTQeZ4wLSFk8VbDFktnZ',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJpQTBTMjROMlplMTZKSzhxQWlQN25QNTFjTlRUdXZLM3hLMWVUUVJSIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Jldmlld3MiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785913395),('BD1ouuOkPhLNpj7IlkGARp0CN7IbQCvz4gVVjopj',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJPNGdQRkRhakIwMDVuVWJLOXcxYk9sZkE5S0FrT0pFcVpzMjFnVlRLIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2F1dGhcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785907312),('cFqN4JYHbR46wY8wFfxrqymeNYNTEEsTRksE8kDP',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJEN2lsTmR0MTNkTWdUOWl5SDhsaW15dVV3a1kya2VpQU1lQkZEaUZFIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3NldHRpbmdzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785857825),('cRy3ZgURaz8BdB4P6uexQftBffoBcqTnk4XRHDBa',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJ3N2QzU3JWNmdRejVZbWoxZlJ5b0Fla0ZreEg0bFBWMTBMdnZpeE50IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Byb2R1Y3RzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785895200),('dkLzZdu1AZTFvR3dzIiJXRhWq2ltJSPPA91yEOZj',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJKeFZVb2o0eURobVBxRHRHTWlxTnNTM2o0UjBCZVlHd3NOYUtpZFFSIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL2Jhbm5lcnMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785907315),('ea6poqo5akWCLuBD4CIMWk1oHUeWQlvyP4kdGPvm',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJXQ3FhRVhmZDJvZ0F6Zmo1cDVhZVg3SHhGV3ZyMmZNRXNTZTcwaGF6IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2F1dGhcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785857826),('EOXPiQGKNa9Jj5w2XPVpiwVkT3H0fmrX9QQhLLET',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJTc3lqUDNzZ2J3UnV0allGWkNPMU9CcG9GSU1LUm91TmtlT1Vic3RaIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL2Jhbm5lcnMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785874302),('gy86H24yHSB8kaWS9jFOsLQwd4CswJIdvvF1i5lw',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJPa3ZjTFNKOXBPM014cmdsTU5jQndZa2NGSUJ2S1A1OG53Q0oxdjRmIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Byb2R1Y3RzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785874302),('hvAmmMe44QIDMMg8ZfcRXtH3GrX6n2eFcB52ze7Z',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJab2EwcldFUUNmWEdLS3VqNTN1YnJ4WEpKa3VJak9hWjBUY1FDYzc1IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3NldHRpbmdzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785907314),('ihWtm831w62FikQHmwr2wPwxMyhLhHGN6mCG2jO5',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJCSkoxOHEwU2dkWWkyRlBqNm1iU3l4bUpJVUpUMlRMY3hmNnRHZElhIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2F1dGhcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785895200),('K4eIbYI4jm4ewZLUwikoTkW4R4UPbR5k3gOog6nN',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJ2ZUh2cVpteklIWHFxejliTlNTWVZoMndrc1VZTEs4Q3I1b2R1dFU4IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Byb2R1Y3RzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785907314),('kJX3qek2Ydz5GksQE6qapS4orNQqwolNDH9qOHhO','019fa9df-1f78-7184-ba0e-cb038ae0bfea','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJmWVZBcExTVGFVYVdQWWZ6VkNuWHAxcUdDTnlhWFRLVVBsRDczS0pKIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2FkbWluXC9ub3RpZmljYXRpb25zIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX0sImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjoiMDE5ZmE5ZGYtMWY3OC03MTg0LWJhMGUtY2IwMzhhZTBiZmVhIiwicGFzc3dvcmRfaGFzaF93ZWIiOiI1YTJjMWMyOWFkMDY5YTFiNDljNTllZWFjYzE4M2E0YWU0N2M4ZDhiMTlmZWIzYTkzZjM4ZmUwMzE1YjVlY2IxIn0=',1785899292),('KNdTXRGKfl94Hy0kR3i3cIFPUHlkjPqtTGzDOX9G',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJUd2JCZWFZOGhnR0pRWTJGRHNKMnU5blg0RHNRTlY1VDc0WE9VUjYzIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2FkbWluXC9zZXR0aW5ncyIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1785857822),('ksN3yPHio2LfgCYr2BPPtBICisarJgQAcWPZMkcb',NULL,'127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36','eyJfdG9rZW4iOiJZWDRjQTZoT0R3dW9GRlFIZUQxVUVEVUpUYTQ3TkdWbHkyWnZsWUlYIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Byb2R1Y3RzXC92aXRhbC1wbHVzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785907313),('kT3MIiOUiSPuGiYgv5TFrsjiRW4BCNH2RsNbBnyd',NULL,'127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36','eyJfdG9rZW4iOiJiYllXNnRkM1dlOHJCc0cwckpuYXJ5MFRVSUpra3JpYTRIbThSVWE1IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Jldmlld3MiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785907314),('kXfeYpShrF0ogZ5CoRLC0Qa3T1itfARwtoLWmY3o',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJuWk04d3c4RUlIbzhEN09Fek9rQVQxT0s4TjBkY1JvSkFIZnNDWUhEIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2F1dGhcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785907311),('l4l2hROnuMRJwTsx3Gp4q62ELfFYFvHdMMDoQxTD',NULL,'127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36','eyJfdG9rZW4iOiJrNlNtUGdKcVZYRmdVZTBQRXg5R2paWFhRek5WNmRiWFdjTHIybDRiIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3NldHRpbmdzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785857840),('mkKL7cxFnROENhJzayJ5H6N2aG1hkzxNbtdahaH7','019fa9df-1f78-7184-ba0e-cb038ae0bfea','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0','eyJfdG9rZW4iOiJnZE9CT2Y4aldlemQwVzVFNzZEcElydkRURGhWU3hrUGtSSHpheWlHIiwibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiOiIwMTlmYTlkZi0xZjc4LTcxODQtYmEwZS1jYjAzOGFlMGJmZWEiLCJwYXNzd29yZF9oYXNoX3dlYiI6IjVhMmMxYzI5YWQwNjlhMWI0OWM1OWVlYWNjMTgzYTRhZTQ3YzhkOGIxOWZlYjNhOTNmMzhmZTAzMTViNWVjYjEiLCJfcHJldmlvdXMiOnsidXJsIjoiaHR0cDpcL1wvbG9jYWxob3N0OjgwMDBcL2FwaVwvc3RvcmVmcm9udFwvcmV2aWV3cyIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==',1785898461),('oSdu90W0ZR20pldAJDjOII0U5cUuY3JA7VyM0HZt',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJtc2J6VFJNWWZsM3hHZTlsbUtSMkpPTUhBelBlWUxjUnRvdDhSNTJIIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2F1dGhcL21lIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785857826),('QvCA20cgDJZd9jVpzLSNa8rCwIkWEqpt9K5Lan6H',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJlUGhUcjRlWUxweGl1T29QNkoySkNaVkhYOHJETDg3c0N5SUVNQXNZIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Byb2R1Y3RzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785857826),('R7CBJc7POHP3MeDqcv7A87Az7AhoOYNPScXrQx20',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJCdjhhVElQeGJuRHBWbFBtNDdxQUljbmxRQ0c2RFlZcUVCOWdJT1psIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2FkbWluXC9kYXNoYm9hcmQiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785907311),('S4xAgzLzjU6k42aZhPwYFyby5SWQg2o3UJHJZLNZ',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','eyJfdG9rZW4iOiIyMjZOVzVpY2RnM1FNcGRUY1o5T01kQ3dGaDhPTFR4anJhMnVnMWtnIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3NldHRpbmdzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785913396),('SNLRNMOgpw1vehEETz37etpQ7rw24Jm7nRGfUhBk',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJNcjJ2bkJFcFd0UDdhMWxBQUVTaHpaWGZzUndDdm1SbVl0V004UEN0IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3NldHRpbmdzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785895199),('WrkCtHQeCHyvMO0kQCUGJRpRElc0DtE5II6yhXWJ','019fa9df-1f78-7184-ba0e-cb038ae0bfea','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0','eyJfdG9rZW4iOiJsOVBCcFdiMHJNVVFYV0FPbXp3dk5IUVhaekE4RFFFN21tU2tKaHQzIiwibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiOiIwMTlmYTlkZi0xZjc4LTcxODQtYmEwZS1jYjAzOGFlMGJmZWEiLCJwYXNzd29yZF9oYXNoX3dlYiI6IjVhMmMxYzI5YWQwNjlhMWI0OWM1OWVlYWNjMTgzYTRhZTQ3YzhkOGIxOWZlYjNhOTNmMzhmZTAzMTViNWVjYjEiLCJfcHJldmlvdXMiOnsidXJsIjoiaHR0cDpcL1wvbG9jYWxob3N0OjgwMDBcL2FwaVwvYXV0aFwvbWUiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785898460),('wuATQROQY3jZt772MZzoO7s1Jo0ByDV9Q8R05nFg',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0','eyJfdG9rZW4iOiJ3Y09OSjlacWZFQ3dEcEVyUWdrYm1aaDFOb3pPUFpYUXpJeHFSYVVWIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL2FkbWluXC9kYXNoYm9hcmRcL3JlY2VudC1vcmRlcnMiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785907312),('wyIotFf5g8TnW1bcB96olNAuanB3bek1nPVnLJQv',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','eyJfdG9rZW4iOiJuWHNndlY2V1ByWGtZeHYwZkZ4NWs0ZE9zcGVyRUFMWFluWTB0NjJTIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9hcGlcL3N0b3JlZnJvbnRcL3Byb2R1Y3RzXC92aXRhbC1wbHVzIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19',1785913396),('yFsZEEfKIeI1nHLyQHZ6MykjcyEvNDrMycBwAuz7','019fa9df-1f78-7184-ba0e-cb038ae0bfea','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0','eyJfdG9rZW4iOiJXTGxZb2VDdkoxSzBkUmFOeVRtcU9HeWhTZjZUM1NuQXpZZlE3RWRMIiwibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiOiIwMTlmYTlkZi0xZjc4LTcxODQtYmEwZS1jYjAzOGFlMGJmZWEiLCJwYXNzd29yZF9oYXNoX3dlYiI6IjVhMmMxYzI5YWQwNjlhMWI0OWM1OWVlYWNjMTgzYTRhZTQ3YzhkOGIxOWZlYjNhOTNmMzhmZTAzMTViNWVjYjEiLCJfcHJldmlvdXMiOnsidXJsIjoiaHR0cDpcL1wvbG9jYWxob3N0OjgwMDBcL2FwaVwvc3RvcmVmcm9udFwvc2V0dGluZ3MiLCJyb3V0ZSI6bnVsbH0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfX0=',1785898460);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('019fa9df-1e1f-7127-bf01-3f9daf876241','company','{\"name\": \"Avyra Wellness\", \"email\": \"connect@avyrabd.com\", \"phone\": \"+8801325115566\", \"slogan\": \"Bringing nature back to everyday life\", \"social\": {\"tiktok\": \"https://tiktok.com/@avyrabd\", \"youtube\": \"https://youtube.com/@avyrabd\", \"facebook\": \"https://facebook.com/avyrabd\", \"instagram\": \"https://instagram.com/avyrabd\"}, \"address\": null, \"tagline\": \"Guided by Nature\", \"currency\": \"BDT\", \"whatsapp\": \"+8801325115566\", \"logo_path\": \"logos/2026/07/b38535a5-9b7e-4ae1-8f83-586fed581256.webp\", \"messenger\": null, \"scroll_text\": null, \"currency_symbol\": \"৳\"}',1,'2026-07-28 11:56:39','2026-08-03 23:59:19'),('019fa9df-1e2f-73a8-91a3-67c0e1cd01eb','delivery','{\"delivery_discount\": 60, \"free_delivery_above\": null, \"inside_dhaka_charge\": 60, \"outside_dhaka_charge\": 120, \"delivery_discount_enabled\": true}',1,'2026-07-28 11:56:39','2026-08-01 23:52:31'),('019fa9df-1e36-7285-a77d-0aef80d5cb14','payment','{\"cod_enabled\": true, \"bkash_number\": null, \"nagad_number\": \"01716196421\", \"rocket_number\": null}',1,'2026-07-28 11:56:39','2026-07-29 11:31:24'),('019fa9df-1e3c-7399-ae06-dd3281780520','pixels','{\"gtag_id\": \"\", \"tiktok_pixel_id\": \"\", \"facebook_pixel_id\": \"\"}',1,'2026-07-28 11:56:39','2026-08-01 23:52:31'),('019fa9df-1e43-70f4-95c3-fc21425bd73f','meta_capi','{\"enabled\": false, \"pixel_id\": \"\", \"access_token\": \"\", \"test_event_code\": \"\"}',0,'2026-07-28 11:56:39','2026-07-28 11:56:39'),('019fa9df-1e48-7289-be1c-42c68bb361fa','fraud_detection','{\"enabled\": false, \"block_message\": \"দুঃখিত, আপনার অর্ডারটি এই মুহূর্তে সম্পন্ন করা যাচ্ছে না। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।\", \"ip_block_minutes\": 30, \"min_phone_digits\": 11, \"min_address_length\": 15, \"phone_block_minutes\": 60, \"device_fingerprinting\": false, \"delivery_success_threshold\": 40}',0,'2026-07-28 11:56:39','2026-08-01 23:52:31'),('019fa9df-1e4e-70b8-886c-8733c9645dad','courier_steadfast','{\"api_key\": \"\", \"enabled\": false, \"base_url\": \"https://portal.packzy.com/api/v1\", \"auto_sync\": true, \"secret_key\": \"\", \"webhook_token\": \"\"}',0,'2026-07-28 11:56:39','2026-08-01 23:52:31'),('019fa9df-1e54-7146-822e-20ce5e0c7b2d','sms','{\"api_key\": \"mj1wD3skYlIRSnoyNcKE\", \"provider\": \"bulksmsbd\", \"sender_id\": \"8809648909193\", \"otp_template\": \"Your Avyra verification code is {otp}\", \"otp_max_attempts\": 5, \"otp_expiry_minutes\": 5}',0,'2026-07-28 11:56:39','2026-08-01 23:52:31'),('019fa9df-1e5a-7386-bbb1-b2f37fafc427','order','{\"require_otp\": false, \"auto_confirm\": false}',0,'2026-07-28 11:56:39','2026-07-29 11:31:36'),('019fb174-2750-70c4-8a25-c49c56acb69e','policies','{\"terms\": \"By ordering from this store you confirm the details you provide are accurate.\\n\\nPrices and offers may change without notice. Vital Plus is a food supplement, not a medicine, and is intended for adults.\", \"privacy\": \"We collect only what is needed to deliver your order: name, phone number and address.\\n\\nWe never sell your data. Your phone number is shared with our courier partner solely to complete delivery.\", \"returns\": \"We accept returns within 7 days of delivery if the seal is intact.\\n\\nTo start a return, call or WhatsApp us with your order number. Once the product reaches us in resalable condition, the refund is issued to the same channel you paid with.\", \"shipping\": \"Orders inside Dhaka are delivered in 1–2 working days; elsewhere in Bangladesh in 2–3 working days.\\n\\nDelivery charges are shown at checkout before you confirm. Cash on delivery is available nationwide.\"}',1,'2026-07-29 23:16:47','2026-08-01 23:52:31'),('019fc107-f365-7229-ad64-5e7de197fb4f','purchase_popup','{\"enabled\": true, \"entries\": \"মোঃ নাসির উদ্দিন | ডেমরা, ঢাকা\\nতানভীর আহমেদ | সাভার, ঢাকা\\nআল আমিন | বগুড়া সদর, বগুড়া\\nশামীম হোসেন | যশোর সদর, যশোর\\nমোস্তাফিজুর রহমান | কুমিল্লা সদর, কুমিল্লা\\nনাঈম ইসলাম | মাধবপুর, হবিগঞ্জ\\nরাশেদ মাহমুদ | ফুলবাড়ী, দিনাজপুর\\nইমরান হোসেন | গফরগাঁও, ময়মনসিংহ\\nসুমন মিয়া | ভোলা সদর, ভোলা\\nফারুক হোসেন | পটুয়াখালী সদর, পটুয়াখালী\\nমিজানুর রহমান | চাঁদপুর সদর, চাঁদপুর\\nহাবিবুর রহমান | নোয়াখালী সদর, নোয়াখালী\\nসাইদুল ইসলাম | লালমনিরহাট সদর, লালমনিরহাট\\nরবিউল ইসলাম | সিরাজগঞ্জ সদর, সিরাজগঞ্জ\\nসোহেল রানা | টঙ্গী, গাজীপুর\\nমাহবুব আলম | নরসিংদী সদর, নরসিংদী\\nআতিকুর রহমান | মিরসরাই, চট্টগ্রাম\\nজুয়েল হোসেন | রাঙ্গুনিয়া, চট্টগ্রাম\\nরুবেল মিয়া | শ্রীপুর, গাজীপুর\\nজসিম উদ্দিন | ফেনী সদর, ফেনী\\nমোঃ রাসেল | কালীগঞ্জ, ঝিনাইদহ\\nকামাল হোসেন | শৈলকুপা, ঝিনাইদহ\\nমামুনুর রশিদ | সাতক্ষীরা সদর, সাতক্ষীরা\\nরফিকুল ইসলাম | বাগেরহাট সদর, বাগেরহাট\\nশহিদুল ইসলাম | পিরোজপুর সদর, পিরোজপুর\\nতৌহিদুল ইসলাম | বরগুনা সদর, বরগুনা\\nনূর আলম | কক্সবাজার সদর, কক্সবাজার\\nসালাহউদ্দিন | উখিয়া, কক্সবাজার\\nমোঃ বাবুল | টেকনাফ, কক্সবাজার\\nআজিজুল হক | নওগাঁ সদর, নওগাঁ\\nমোশাররফ হোসেন | জয়পুরহাট সদর, জয়পুরহাট\\nআব্দুল করিম | চাঁপাইনবাবগঞ্জ সদর, চাঁপাইনবাবগঞ্জ\\nসালামত আলী | নাটোর সদর, নাটোর\\nবেলাল হোসেন | পাবনা সদর, পাবনা\\nহুমায়ুন কবির | কুষ্টিয়া সদর, কুষ্টিয়া\\nআব্দুল্লাহ আল মামুন | মেহেরপুর সদর, মেহেরপুর\\nসেলিম রেজা | মাগুরা সদর, মাগুরা\\nগোলাম রব্বানী | নড়াইল সদর, নড়াইল\\nশফিকুল ইসলাম | ব্রাহ্মণবাড়িয়া সদর, ব্রাহ্মণবাড়িয়া\\nরিয়াজ উদ্দিন | কসবা, ব্রাহ্মণবাড়িয়া\\nতরিকুল ইসলাম | হবিগঞ্জ সদর, হবিগঞ্জ\\nসাইফুদ্দিন | মৌলভীবাজার সদর, মৌলভীবাজার\\nজাহাঙ্গীর আলম | সুনামগঞ্জ সদর, সুনামগঞ্জ\\nমোঃ শামীম | নেত্রকোনা সদর, নেত্রকোনা\\nআব্দুর রহমান | শেরপুর সদর, শেরপুর\\nজাকির হোসেন | জামালপুর সদর, জামালপুর\\nনুরুল ইসলাম | কিশোরগঞ্জ সদর, কিশোরগঞ্জ\\nমোঃ হেলাল | টাঙ্গাইল সদর, টাঙ্গাইল\\nআরমান হোসেন | ঘাটাইল, টাঙ্গাইল\\nসোহাগ মিয়া | বাসাইল, টাঙ্গাইল\", \"interval_seconds\": 20}',1,'2026-08-01 23:52:31','2026-08-02 05:16:56');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_banners`
--

DROP TABLE IF EXISTS `shop_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_banners` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `link_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Shop Now',
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_banners`
--

LOCK TABLES `shop_banners` WRITE;
/*!40000 ALTER TABLE `shop_banners` DISABLE KEYS */;
INSERT INTO `shop_banners` VALUES ('019fa9df-376c-7104-9b73-bedf863c8c02','Guided by Nature','Discover Vital Plus','banners/2026/07/9eff1f98-aba1-498d-9b26-d0342ef4e8c1.webp','/vital-plus','Shop Now',1,1,'2026-07-28 11:56:46','2026-07-29 10:42:20');
/*!40000 ALTER TABLE `shop_banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_payments`
--

DROP TABLE IF EXISTS `supplier_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_payments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `payment_date` date NOT NULL,
  `method` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cash',
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_payments_supplier_id_foreign` (`supplier_id`),
  KEY `supplier_payments_purchase_id_foreign` (`purchase_id`),
  KEY `supplier_payments_created_by_foreign` (`created_by`),
  CONSTRAINT `supplier_payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_payments_purchase_id_foreign` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `supplier_payments_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payments`
--

LOCK TABLES `supplier_payments` WRITE;
/*!40000 ALTER TABLE `supplier_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `payment_terms` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_pos` int unsigned NOT NULL DEFAULT '0',
  `total_paid` decimal(14,2) NOT NULL DEFAULT '0.00',
  `outstanding` decimal(14,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES ('019fac3f-eccb-73f2-a480-7a095d902c88','SUP-YJOBSQ','Hasan',NULL,'01716196521',NULL,NULL,NULL,1,0.00,500000.00,1,'2026-07-28 23:01:38','2026-07-28 23:02:32');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploads`
--

DROP TABLE IF EXISTS `uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploads` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `disk` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `folder` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int unsigned NOT NULL,
  `width` int unsigned DEFAULT NULL,
  `height` int unsigned DEFAULT NULL,
  `uploaded_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uploads_path_unique` (`path`),
  KEY `uploads_uploaded_by_foreign` (`uploaded_by`),
  KEY `uploads_folder_index` (`folder`),
  CONSTRAINT `uploads_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploads`
--

LOCK TABLES `uploads` WRITE;
/*!40000 ALTER TABLE `uploads` DISABLE KEYS */;
INSERT INTO `uploads` VALUES ('019fac64-fb67-7251-9d66-f14f43f75f03','public','products/2026/07/578fb83e-9ccc-4049-8315-db40100ff4b9.webp','products/2026/07/578fb83e-9ccc-4049-8315-db40100ff4b9_thumb.webp','products','test.png','image/webp',4832,800,600,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:42:06','2026-07-28 23:42:06'),('019fac6d-952e-70d1-b77b-411d4ae6f3a9','public','products/2026/07/8adfaa47-9bde-4e52-a67a-6f35c04c4cc0.webp','products/2026/07/8adfaa47-9bde-4e52-a67a-6f35c04c4cc0_thumb.webp','products','IMG_1813.JPG','image/webp',78042,1360,768,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:51:30','2026-07-28 23:51:30'),('019fac6e-bc25-7261-845c-7a686ec88a0e','public','products/2026/07/12e5ef19-6f34-49b8-8296-927504ca38d4.webp','products/2026/07/12e5ef19-6f34-49b8-8296-927504ca38d4_thumb.webp','products','710602853_122113986902732891_6468954101863545237_n.jpg','image/webp',79024,1080,1350,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:52:46','2026-07-28 23:52:46'),('019fac6e-bfe7-71ea-af13-3fbc67813d00','public','products/2026/07/678fe0a4-3e7c-4c63-b798-44eca9eccbcd.webp','products/2026/07/678fe0a4-3e7c-4c63-b798-44eca9eccbcd_thumb.webp','products','712085942_122113986392732891_9059042074330188625_n.jpg','image/webp',97408,1080,1350,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:52:47','2026-07-28 23:52:47'),('019fac6e-c3ec-70b2-82dc-5351f4d7f29e','public','products/2026/07/a63ba508-04a2-41cc-8804-96740823738b.webp','products/2026/07/a63ba508-04a2-41cc-8804-96740823738b_thumb.webp','products','712610079_122113818656732891_8007747107290425425_n.jpg','image/webp',196040,1080,1350,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:52:48','2026-07-28 23:52:48'),('019fac6f-cb26-71fd-b97c-f5499391c8b9','public','products/2026/07/16dec4ec-6a28-4110-a5a7-1c61fd1cb714.webp','products/2026/07/16dec4ec-6a28-4110-a5a7-1c61fd1cb714_thumb.webp','products','image 1.png','image/webp',8894,632,576,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:53:55','2026-07-28 23:53:55'),('019fac71-d2aa-7185-afde-07cdbbe86bba','public','products/2026/07/42fc7271-df00-43ef-b82b-d7c3daef0136.webp','products/2026/07/42fc7271-df00-43ef-b82b-d7c3daef0136_thumb.webp','products','product-view-thumb.png','image/webp',1172,114,104,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-28 23:56:08','2026-07-28 23:56:08'),('019fac85-ac15-7261-996d-f4d77f09fe49','public','products/2026/07/1a0dd828-246b-4dfb-9309-cbc99be61c09.webp','products/2026/07/1a0dd828-246b-4dfb-9309-cbc99be61c09_thumb.webp','products','image-2686.jpg','image/webp',70390,832,1248,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 00:17:49','2026-07-29 00:17:49'),('019fac86-78b6-73d1-9c30-9deb740203a4','public','products/2026/07/e3a463ce-3b95-4325-8225-36fd213b6654.webp','products/2026/07/e3a463ce-3b95-4325-8225-36fd213b6654_thumb.webp','products','1000439182.png','image/webp',79406,832,1479,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 00:18:41','2026-07-29 00:18:41'),('019fac86-7ba8-72a2-b2b0-e8305eee2107','public','products/2026/07/59c05daf-c8c9-4473-98b2-5d078c1fefce.webp','products/2026/07/59c05daf-c8c9-4473-98b2-5d078c1fefce_thumb.webp','products','e0368c30-f655-4716-8456-b3dab58493cf.jpg','image/webp',155676,900,1600,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 00:18:42','2026-07-29 00:18:42'),('019fac86-7dbc-7144-972b-f5fcae4311b5','public','products/2026/07/b6a6fe47-b7c9-4118-949c-dbb6ae922037.webp','products/2026/07/b6a6fe47-b7c9-4118-949c-dbb6ae922037_thumb.webp','products','image-2431.jpg','image/webp',75608,832,1248,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 00:18:43','2026-07-29 00:18:43'),('019fac8d-877e-72a3-9d61-90070bba4a25','public','logos/2026/07/b91e77be-1d1f-4a38-bc79-a6fcc071229f.webp','logos/2026/07/b91e77be-1d1f-4a38-bc79-a6fcc071229f_thumb.webp','logos','Gemini_Generated_Image_mmd4j0mmd4j0mmd4.png','image/webp',19968,600,600,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 00:26:24','2026-07-29 00:26:24'),('019fac8f-01d0-7139-b141-640d0e515387','public','logos/2026/07/b38535a5-9b7e-4ae1-8f83-586fed581256.webp','logos/2026/07/b38535a5-9b7e-4ae1-8f83-586fed581256_thumb.webp','logos','company-logo-1780299182280.png','image/webp',1284,63,78,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 00:28:01','2026-07-29 00:28:01'),('019fac90-3ce3-72f4-a246-74b78c7b6724','public','avatars/2026/07/255a9b3a-ff8b-4f64-b820-afa81f6f837e.webp','avatars/2026/07/255a9b3a-ff8b-4f64-b820-afa81f6f837e_thumb.webp','avatars','IMG_1323.JPG','image/webp',18456,267,400,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 00:29:21','2026-07-29 00:29:21'),('019facad-6395-71f8-9c7c-e447d81c7499','public','landing/2026/07/2e1f8c0e-6cf0-419d-9b06-279e709c7f35.webp','landing/2026/07/2e1f8c0e-6cf0-419d-9b06-279e709c7f35_thumb.webp','landing','IMG_3243.png','image/webp',58756,1440,832,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 01:01:12','2026-07-29 01:01:12'),('019facad-9afd-711b-a034-75615523378a','public','landing/2026/07/ff2c891b-4927-4a7b-a042-aa897e8642eb.webp','landing/2026/07/ff2c891b-4927-4a7b-a042-aa897e8642eb_thumb.webp','landing','WhatsApp Image 2026-07-28 at 11.20.57 AM.jpeg','image/webp',53068,1248,832,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 01:01:26','2026-07-29 01:01:26'),('019facaf-244b-723c-8108-da7bc1623b8f','public','landing/2026/07/82cb39d9-5cb3-46a3-a779-ea659cad6298.webp','landing/2026/07/82cb39d9-5cb3-46a3-a779-ea659cad6298_thumb.webp','landing','aifaceswap-f168aaabddf97c363c1cf28f2e047016.jpg','image/webp',150908,1200,1600,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 01:03:07','2026-07-29 01:03:07'),('019facaf-27a7-734a-92c8-73c9192dad5d','public','landing/2026/07/56b9aff7-e332-4dc3-8d88-2352364b04c6.webp','landing/2026/07/56b9aff7-e332-4dc3-8d88-2352364b04c6_thumb.webp','landing','aifaceswap-40f49b978edc10efeabb5fe51cd0257b.jpg','image/webp',147034,1200,1600,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 01:03:07','2026-07-29 01:03:07'),('019facaf-2b84-7102-bb26-201c935b4f07','public','landing/2026/07/15bb1b5b-84be-42bc-8e2f-7963abc97668.webp','landing/2026/07/15bb1b5b-84be-42bc-8e2f-7963abc97668_thumb.webp','landing','aifaceswap-68e2220b9668536a0432db018519f8bb.jpg','image/webp',140662,1200,1600,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 01:03:08','2026-07-29 01:03:08'),('019facb0-83e6-7368-8dab-d314d8c2bb71','public','reviews/2026/07/b78160a2-3b2a-4a10-99d8-67df4774bcc2.webp','reviews/2026/07/b78160a2-3b2a-4a10-99d8-67df4774bcc2_thumb.webp','reviews','1784614268311-x4jla66tbpj.png','image/webp',55886,888,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 01:04:37','2026-07-29 01:04:37'),('019faec0-454f-7139-a95a-aff9d8178d8c','public','products/2026/07/fb3fa5b4-988d-4133-8edb-0d6709cf5581.webp','products/2026/07/fb3fa5b4-988d-4133-8edb-0d6709cf5581_thumb.webp','products','vital-plus-box.png','image/webp',14940,548,652,NULL,'2026-07-29 10:41:04','2026-07-29 10:41:04'),('019faec1-6d76-715e-b10a-a0ad1cd91a92','public','products/2026/07/62e97ffc-eb0b-406a-912d-1436d1f3ceec.webp','products/2026/07/62e97ffc-eb0b-406a-912d-1436d1f3ceec_thumb.webp','products','vital-plus-jar.png','image/webp',35112,1024,1536,NULL,'2026-07-29 10:42:19','2026-07-29 10:42:19'),('019faec1-6f8a-711a-b5c3-eca32aa37ac0','public','products/2026/07/7748fcfa-eb3f-42b5-a8e5-2c5f48cdd79b.webp','products/2026/07/7748fcfa-eb3f-42b5-a8e5-2c5f48cdd79b_thumb.webp','products','ingredients.jpg','image/webp',161458,1600,900,NULL,'2026-07-29 10:42:20','2026-07-29 10:42:20'),('019faec1-70a6-72f3-a2ad-119859ce682d','public','banners/2026/07/9eff1f98-aba1-498d-9b26-d0342ef4e8c1.webp','banners/2026/07/9eff1f98-aba1-498d-9b26-d0342ef4e8c1_thumb.webp','banners','shop-hero-banner.jpg','image/webp',180140,1920,512,NULL,'2026-07-29 10:42:20','2026-07-29 10:42:20'),('019fb154-01a3-7338-875e-558f5129c141','public','landing/2026/07/d85145ba-ce5d-46ab-b691-7fed895cdec0.webp','landing/2026/07/d85145ba-ce5d-46ab-b691-7fed895cdec0_thumb.webp','landing','gallery-0-1784452505417.jpeg','image/webp',90874,1080,1350,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 22:41:40','2026-07-29 22:41:40'),('019fb154-0301-70ce-8599-846de9d155d0','public','landing/2026/07/1bdfb77f-b290-445d-a49d-dbee229ce2eb.webp','landing/2026/07/1bdfb77f-b290-445d-a49d-dbee229ce2eb_thumb.webp','landing','gallery-1-1784452508691.jpeg','image/webp',76588,1080,1350,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 22:41:40','2026-07-29 22:41:40'),('019fb154-042d-70f7-93b2-15b3d638802a','public','landing/2026/07/914e1e8f-9dd5-4bb2-b60c-474ddd5f52e1.webp','landing/2026/07/914e1e8f-9dd5-4bb2-b60c-474ddd5f52e1_thumb.webp','landing','gallery-2-1784452519467.webp','image/webp',79542,800,1001,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 22:41:41','2026-07-29 22:41:41'),('019fb154-0593-7058-bb80-690730d59a73','public','landing/2026/07/4b647b94-3703-4592-a660-b445d7539274.webp','landing/2026/07/4b647b94-3703-4592-a660-b445d7539274_thumb.webp','landing','gallery-3-1784542807480.jpg','image/webp',126674,1033,1033,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 22:41:41','2026-07-29 22:41:41'),('019fb178-eb56-7302-ad0e-47c2972d9269','public','landing/2026/07/f0785ae1-2a4d-4a60-aa9a-d817abb544da.webp','landing/2026/07/f0785ae1-2a4d-4a60-aa9a-d817abb544da_thumb.webp','landing','hero-1782367903393 (1).webp','image/webp',43764,1200,675,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:21:59','2026-07-29 23:21:59'),('019fb179-0cf7-715e-a97e-bd7458b24d05','public','landing/2026/07/8b951006-398f-4048-aca4-8cd77325c038.webp','landing/2026/07/8b951006-398f-4048-aca4-8cd77325c038_thumb.webp','landing','gallery-0-1784452505417.jpeg','image/webp',90874,1080,1350,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:22:08','2026-07-29 23:22:08'),('019fb179-0e22-73fc-8531-99ec47ea1d98','public','landing/2026/07/4bde3f2d-1e12-412a-90eb-4aaa5a04164b.webp','landing/2026/07/4bde3f2d-1e12-412a-90eb-4aaa5a04164b_thumb.webp','landing','gallery-1-1784452508691.jpeg','image/webp',76588,1080,1350,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:22:08','2026-07-29 23:22:08'),('019fb179-0efb-70f2-8fca-18447e17493c','public','landing/2026/07/b3920372-c9e0-4de2-bd15-3a60bd49bcaf.webp','landing/2026/07/b3920372-c9e0-4de2-bd15-3a60bd49bcaf_thumb.webp','landing','gallery-2-1784452519467.webp','image/webp',79542,800,1001,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:22:08','2026-07-29 23:22:08'),('019fb179-105e-709c-9940-dec07be1aa97','public','landing/2026/07/14e3391b-396d-44e8-9e87-74a2ade704fc.webp','landing/2026/07/14e3391b-396d-44e8-9e87-74a2ade704fc_thumb.webp','landing','gallery-3-1784542807480.jpg','image/webp',126674,1033,1033,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:22:09','2026-07-29 23:22:09'),('019fb179-a7cc-7349-9241-b55f6851410a','public','reviews/2026/07/f9450c44-12ac-4fc7-ab44-b6b6200e715e.webp','reviews/2026/07/f9450c44-12ac-4fc7-ab44-b6b6200e715e_thumb.webp','reviews','1784614265210-kmm2i4n0iig.png','image/webp',64748,889,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:22:47','2026-07-29 23:22:47'),('019fb179-c5a7-70ef-8635-eb62f9d9e713','public','reviews/2026/07/4b76a4e0-acc6-4b4b-a167-2bc84a1bded6.webp','reviews/2026/07/4b76a4e0-acc6-4b4b-a167-2bc84a1bded6_thumb.webp','reviews','1784614268311-x4jla66tbpj.png','image/webp',55886,888,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:22:55','2026-07-29 23:22:55'),('019fb17a-b743-7047-8f0f-93416732693d','public','reviews/2026/07/1b6327df-fd11-470e-8551-a4b4a25188ae.webp','reviews/2026/07/1b6327df-fd11-470e-8551-a4b4a25188ae_thumb.webp','reviews','1784614265210-kmm2i4n0iig.png','image/webp',64748,889,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:23:57','2026-07-29 23:23:57'),('019fb17a-c9cc-7043-84ba-b5a746421dc8','public','reviews/2026/07/65031e19-18bb-439e-9145-ef5c367b5662.webp','reviews/2026/07/65031e19-18bb-439e-9145-ef5c367b5662_thumb.webp','reviews','1784614268311-x4jla66tbpj.png','image/webp',55886,888,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:24:02','2026-07-29 23:24:02'),('019fb181-e108-7263-8350-8299057dcb3f','public','reviews/2026/07/9ba45c74-2f18-41b1-a0b0-c3e73c055397.webp','reviews/2026/07/9ba45c74-2f18-41b1-a0b0-c3e73c055397_thumb.webp','reviews','1784614269480-eybbirsnf3m.webp','image/webp',55548,887,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:31:46','2026-07-29 23:31:46'),('019fb181-fbe9-7014-847e-4221ad267792','public','reviews/2026/07/01724654-0298-465d-891d-d728f8a04561.webp','reviews/2026/07/01724654-0298-465d-891d-d728f8a04561_thumb.webp','reviews','1784614270779-2yeisaln1k7.webp','image/webp',65288,887,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:31:53','2026-07-29 23:31:53'),('019fb187-b5e6-729c-94b1-ded2ddc31c19','public','reviews/2026/07/1ee77b70-9b4b-47c3-b5dc-81c313823cbb.webp','reviews/2026/07/1ee77b70-9b4b-47c3-b5dc-81c313823cbb_thumb.webp','reviews','test.png','image/webp',4832,800,600,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:38:08','2026-07-29 23:38:08'),('019fb188-bdb3-73a7-97ac-2f9d7b661093','public','reviews/2026/07/7b5850f6-b15c-470f-b4a6-319aaa51c2d7.webp','reviews/2026/07/7b5850f6-b15c-470f-b4a6-319aaa51c2d7_thumb.webp','reviews','gallery-1-1784452508691.jpeg','image/webp',58870,960,1200,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-07-29 23:39:16','2026-07-29 23:39:16'),('019fc12f-c57a-727c-995a-66ef989946ae','public','products/2026/08/2c11e9bd-184e-4eda-814b-5354a421d03c.webp','products/2026/08/2c11e9bd-184e-4eda-814b-5354a421d03c_thumb.webp','products','p1.webp','image/webp',146378,980,1225,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:36:01','2026-08-02 00:36:01'),('019fc12f-c6dc-73a0-87d9-ca3a5a907710','public','products/2026/08/1ae29a30-0754-4eea-80f1-e17d89785827.webp','products/2026/08/1ae29a30-0754-4eea-80f1-e17d89785827_thumb.webp','products','p2.jpg','image/webp',85632,729,912,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:36:01','2026-08-02 00:36:01'),('019fc12f-c8a4-70d6-b693-35a672592ca6','public','products/2026/08/1d5f5913-ffa7-494a-85b8-54e64893f48e.webp','products/2026/08/1d5f5913-ffa7-494a-85b8-54e64893f48e_thumb.webp','products','p3.webp','image/webp',86310,1068,1336,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:36:02','2026-08-02 00:36:02'),('019fc12f-ca55-7230-9f56-75e9eb5ad94d','public','products/2026/08/ce87b823-b4cd-47af-8ee1-1bd29d0727e7.webp','products/2026/08/ce87b823-b4cd-47af-8ee1-1bd29d0727e7_thumb.webp','products','p4.webp','image/webp',69422,876,1096,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:36:02','2026-08-02 00:36:02'),('019fc12f-cb98-72a0-89ea-a59cee22baf6','public','products/2026/08/4da1db0c-b421-47d0-b919-1c0f2e861507.webp','products/2026/08/4da1db0c-b421-47d0-b919-1c0f2e861507_thumb.webp','products','p5.png','image/webp',14940,548,652,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:36:02','2026-08-02 00:36:02'),('019fc130-1c27-70ae-b54c-db0ca6f4da92','public','products/2026/08/590ee44f-d242-4fe7-a716-7e2e51dc5138.webp','products/2026/08/590ee44f-d242-4fe7-a716-7e2e51dc5138_thumb.webp','products','p4.webp','image/webp',69422,876,1096,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:36:23','2026-08-02 00:36:23'),('019fc130-4977-71d2-b651-3217108d70bc','public','products/2026/08/726fcb2d-7d50-48f1-9de3-8a21fdcc090f.webp','products/2026/08/726fcb2d-7d50-48f1-9de3-8a21fdcc090f_thumb.webp','products','p3.webp','image/webp',86310,1068,1336,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:36:35','2026-08-02 00:36:35'),('019fc131-8dca-7205-8ac4-1b4eeba2366d','public','products/2026/08/fcebd8ef-646d-4c98-995b-d46a53530a92.webp','products/2026/08/fcebd8ef-646d-4c98-995b-d46a53530a92_thumb.webp','products','gallery-2-1784452519467.webp','image/webp',79542,800,1001,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-02 00:37:58','2026-08-02 00:37:58'),('019fcbe9-1710-70ae-a18b-32867857c7e7','public','avatars/2026/08/6396f03e-d6ba-46fe-9f09-57edcadff16a.webp','avatars/2026/08/6396f03e-d6ba-46fe-9f09-57edcadff16a_thumb.webp','avatars','lp-logo (1).png','image/webp',15392,320,400,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-04 02:34:38','2026-08-04 02:34:38'),('019fcbe9-71e2-7201-ae67-89dbd5e19f2d','public','avatars/2026/08/5b3d9087-f986-4c14-86d6-56aa371adf81.webp','avatars/2026/08/5b3d9087-f986-4c14-86d6-56aa371adf81_thumb.webp','avatars','Untitled.png','image/webp',1268,57,57,'019fa9df-1f78-7184-ba0e-cb038ae0bfea','2026-08-04 02:35:01','2026-08-04 02:35:01');
/*!40000 ALTER TABLE `uploads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','employee','manager','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_user_id_role_unique` (`user_id`,`role`),
  CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES ('019fcbe9-1cfc-739e-8831-4fce01ad9b86','019fac90-ea66-7000-b503-9573dfabfed8','manager','2026-08-04 02:34:39','2026-08-04 02:34:39'),('019fcbe9-7426-7235-a790-1e473497959c','019fa9df-1f78-7184-ba0e-cb038ae0bfea','admin','2026-08-04 02:35:02','2026-08-04 02:35:02');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('019fa9df-1f78-7184-ba0e-cb038ae0bfea','Avyra Admin','admin@avyrabd.com','01716196421','avatars/2026/07/255a9b3a-ff8b-4f64-b820-afa81f6f837e.webp',1,'2026-07-28 11:56:39','$2y$12$8NbwElxUqJJw0YsHolk5uuxHGUaxdb2yLJJ4Zg0Fsu6zxONPUcArK','dgRBY6XYJMupEim0ag8FUbAnrieFdMLeuqFwJbnJ7mAU4abYDT7SWei5CoPP','2026-07-28 11:56:39','2026-07-29 00:29:33'),('019fac90-ea66-7000-b503-9573dfabfed8','Adnan','admin@norbanlv.com','admin@avyrabd.com','avatars/2026/08/6396f03e-d6ba-46fe-9f09-57edcadff16a.webp',1,NULL,'$2y$12$ZL8kWe3kb/mo2lIobjvZxu.SQEbOH/kyNL0/4.Og2GugtjXtTLWHK',NULL,'2026-07-29 00:30:06','2026-08-04 02:34:39');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `warehouses_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES ('019fa9df-1e66-70ce-8609-f8ac18c01373','Dhaka WH-1','DHK-1','Dhaka, Bangladesh',1,'2026-07-28 11:56:39','2026-07-28 11:56:39');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-05 13:30:23
