-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: tastyigniter
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `address_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `address_1` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postcode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`address_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,2,'100 API Test Street',NULL,'Casablanca','Casablanca','20000',223,'2026-08-06 13:42:01','2026-08-06 13:42:01');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_user_groups`
--

DROP TABLE IF EXISTS `admin_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user_groups` (
  `user_group_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_group_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `auto_assign` tinyint(1) DEFAULT '0',
  `auto_assign_mode` tinyint DEFAULT '1',
  `auto_assign_limit` int DEFAULT '20',
  `auto_assign_availability` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_user_groups`
--

LOCK TABLES `admin_user_groups` WRITE;
/*!40000 ALTER TABLE `admin_user_groups` DISABLE KEYS */;
INSERT INTO `admin_user_groups` VALUES (1,'Owners','Default group for owners',0,1,20,1,'2026-07-27 11:24:06','2026-07-27 11:24:06'),(2,'Managers','Default group for managers',0,1,20,1,'2026-07-27 11:24:06','2026-07-27 11:24:06'),(3,'Waiters','Default group for waiters.',0,1,20,1,'2026-07-27 11:24:06','2026-07-27 11:24:06'),(4,'Delivery','Default group for delivery drivers.',0,1,20,1,'2026-07-27 11:24:06','2026-07-27 11:24:06');
/*!40000 ALTER TABLE `admin_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_user_preferences`
--

DROP TABLE IF EXISTS `admin_user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user_preferences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_user_preferences`
--

LOCK TABLES `admin_user_preferences` WRITE;
/*!40000 ALTER TABLE `admin_user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_user_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_user_roles`
--

DROP TABLE IF EXISTS `admin_user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user_roles` (
  `user_role_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `permissions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_user_roles`
--

LOCK TABLES `admin_user_roles` WRITE;
/*!40000 ALTER TABLE `admin_user_roles` DISABLE KEYS */;
INSERT INTO `admin_user_roles` VALUES (1,'Owner','owner','Default role for restaurant owners',NULL,'2026-07-27 11:24:06','2026-07-27 11:24:06'),(2,'Manager','manager','Default role for restaurant managers.','a:16:{s:15:\"Admin.Dashboard\";s:1:\"1\";s:16:\"Admin.Categories\";s:1:\"1\";s:14:\"Admin.Statuses\";s:1:\"1\";s:12:\"Admin.Staffs\";s:1:\"1\";s:17:\"Admin.StaffGroups\";s:1:\"1\";s:15:\"Admin.Customers\";s:1:\"1\";s:20:\"Admin.CustomerGroups\";s:1:\"1\";s:14:\"Admin.Payments\";s:1:\"1\";s:18:\"Admin.Reservations\";s:1:\"1\";s:12:\"Admin.Orders\";s:1:\"1\";s:12:\"Admin.Tables\";s:1:\"1\";s:15:\"Admin.Locations\";s:1:\"1\";s:15:\"Admin.Mealtimes\";s:1:\"1\";s:11:\"Admin.Menus\";s:1:\"1\";s:11:\"Site.Themes\";s:1:\"1\";s:18:\"Admin.MediaManager\";s:1:\"1\";}','2026-07-27 11:24:06','2026-07-27 11:24:06'),(3,'Waiter','waiter','Default role for restaurant waiters.','a:4:{s:16:\"Admin.Categories\";s:1:\"1\";s:18:\"Admin.Reservations\";s:1:\"1\";s:12:\"Admin.Orders\";s:1:\"1\";s:11:\"Admin.Menus\";s:1:\"1\";}','2026-07-27 11:24:06','2026-07-27 11:24:06'),(4,'Delivery','delivery','Default role for restaurant delivery.','a:3:{s:14:\"Admin.Statuses\";s:1:\"1\";s:18:\"Admin.Reservations\";s:1:\"1\";s:12:\"Admin.Orders\";s:1:\"1\";}','2026-07-27 11:24:06','2026-07-27 11:24:06');
/*!40000 ALTER TABLE `admin_user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_role_id` bigint unsigned DEFAULT NULL,
  `language_id` bigint unsigned DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `sale_permission` tinyint NOT NULL DEFAULT '0',
  `username` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `super_user` tinyint(1) DEFAULT NULL,
  `reset_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_time` datetime DEFAULT NULL,
  `activation_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_activated` tinyint(1) DEFAULT NULL,
  `activated_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `last_seen` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `invited_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `admin_users_username_unique` (`username`),
  UNIQUE KEY `admin_users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'Foodly','admin@admin.com',NULL,1,NULL,1,0,'admin','$2y$10$8oizSFQ1m9ULYteGh9SSa.MUtqeokJem.JiffkTCpo/14bSWVFIz2',1,NULL,NULL,NULL,'dPDIgqFJOhqpfPdYgFx9MthQribLFhdEbF3Hxhg2i8e4rzcAExnKXUJYLWSm',1,'2026-07-27 12:37:52','2026-07-27 12:38:11','2026-07-27 13:24:05','2026-07-27 12:37:52','2026-07-27 13:24:05',NULL);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users_groups`
--

DROP TABLE IF EXISTS `admin_users_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users_groups` (
  `user_id` int unsigned NOT NULL,
  `user_group_id` int unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`user_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users_groups`
--

LOCK TABLES `admin_users_groups` WRITE;
/*!40000 ALTER TABLE `admin_users_groups` DISABLE KEYS */;
INSERT INTO `admin_users_groups` VALUES (1,1);
/*!40000 ALTER TABLE `admin_users_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignable_logs`
--

DROP TABLE IF EXISTS `assignable_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignable_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `assignable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignable_id` bigint unsigned NOT NULL,
  `assignee_id` int unsigned DEFAULT NULL,
  `assignee_group_id` int unsigned DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `status_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignable_logs_assignable` (`assignable_type`,`assignable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignable_logs`
--

LOCK TABLES `assignable_logs` WRITE;
/*!40000 ALTER TABLE `assignable_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignable_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_id` int DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `nest_left` int DEFAULT NULL,
  `nest_right` int DEFAULT NULL,
  `permalink_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  KEY `idx_categories_status` (`status`),
  KEY `idx_categories_status_priority` (`status`,`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Appetizer','Sed consequat, sapien in scelerisque egestas, neque nisi dapibus magna, non malesuada lectus ligula vel justo. Vestibulum felis nisi, tincidunt eu est quis, faucibus tincidunt ante.',NULL,1,1,NULL,NULL,'appetizer','2026-07-27 11:24:06','2026-07-27 11:24:06'),(2,'Main Course','',NULL,6,1,NULL,NULL,'main-course','2026-07-27 11:24:06','2026-07-27 11:24:06'),(3,'Salads','Etiam tristique pretium enim, vel convallis sem fermentum eget. Donec porta risus vestibulum elit gravida ornare. Quisque neque mi, tincidunt quis leo eget, ornare aliquam nulla. Morbi at lacinia lorem. Aenean at accumsan turpis.',NULL,3,1,NULL,NULL,'salads','2026-07-27 11:24:06','2026-07-27 11:24:06'),(4,'Seafoods','Morbi blandit massa et massa ornare, sed aliquam risus suscipit. Suspendisse et felis vitae ex pulvinar dictum et non dui. Suspendisse ullamcorper diam ac aliquet malesuada. Duis auctor nisi turpis, a ornare nisi auctor sit amet. Suspendisse imperdiet magna accumsan libero laoreet, consectetur sollicitudin sem maximus.',NULL,4,1,NULL,NULL,'seafoods','2026-07-27 11:24:06','2026-07-27 11:24:06'),(5,'Traditional','Vivamus interdum erat ac aliquam porttitor. Morbi malesuada ligula non elit sagittis, et facilisis dolor porta. Aenean aliquet leo eu massa tempor varius. Donec a erat massa. Praesent vitae libero a ligula auctor laoreet.',NULL,5,1,NULL,NULL,'traditional','2026-07-27 11:24:06','2026-07-27 11:24:06'),(6,'Desserts','',NULL,8,1,NULL,NULL,'desserts','2026-07-27 11:24:06','2026-07-27 11:24:06'),(7,'Drinks','',NULL,9,1,NULL,NULL,'drinks','2026-07-27 11:24:06','2026-07-27 11:24:06'),(8,'Specials','Praesent nec velit faucibus, consequat justo eu, malesuada est. Aenean leo ipsum, venenatis nec dapibus ullamcorper, volutpat eget leo. Phasellus nec ipsum lorem. Etiam nec ullamcorper augue. Phasellus mauris turpis, consequat et rutrum at, bibendum eu mi.',NULL,2,1,NULL,NULL,'specials','2026-07-27 11:24:06','2026-07-27 11:24:06');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries` (
  `country_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `country_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `iso_code_2` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iso_code_3` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `format` text COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `priority` int NOT NULL DEFAULT '999',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`country_id`),
  KEY `idx_countries_status_default` (`status`,`is_default`)
) ENGINE=InnoDB AUTO_INCREMENT=240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries`
--

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` VALUES (1,'Afghanistan','AF','AFG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(2,'Albania','AL','ALB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(3,'Algeria','DZ','DZA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(4,'American Samoa','AS','ASM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(5,'Andorra','AD','AND',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(6,'Angola','AO','AGO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(7,'Anguilla','AI','AIA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(8,'Antarctica','AQ','ATA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(9,'Antigua and Barbuda','AG','ATG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(10,'Argentina','AR','ARG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(11,'Armenia','AM','ARM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(12,'Aruba','AW','ABW',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(13,'Australia','AU','AUS',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(14,'Austria','AT','AUT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(15,'Azerbaijan','AZ','AZE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(16,'Bahamas','BS','BHS',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(17,'Bahrain','BH','BHR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(18,'Bangladesh','BD','BGD',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(19,'Barbados','BB','BRB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(20,'Belarus','BY','BLR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(21,'Belgium','BE','BEL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(22,'Belize','BZ','BLZ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(23,'Benin','BJ','BEN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(24,'Bermuda','BM','BMU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(25,'Bhutan','BT','BTN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(26,'Bolivia','BO','BOL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(27,'Bosnia and Herzegowina','BA','BIH',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(28,'Botswana','BW','BWA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(29,'Bouvet Island','BV','BVT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(30,'Brazil','BR','BRA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(31,'British Indian Ocean Territory','IO','IOT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(32,'Brunei Darussalam','BN','BRN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(33,'Bulgaria','BG','BGR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(34,'Burkina Faso','BF','BFA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(35,'Burundi','BI','BDI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(36,'Cambodia','KH','KHM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(37,'Cameroon','CM','CMR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(38,'Canada','CA','CAN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(39,'Cape Verde','CV','CPV',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(40,'Cayman Islands','KY','CYM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(41,'Central African Republic','CF','CAF',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(42,'Chad','TD','TCD',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(43,'Chile','CL','CHL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(44,'China','CN','CHN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(45,'Christmas Island','CX','CXR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(46,'Cocos (Keeling) Islands','CC','CCK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(47,'Colombia','CO','COL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(48,'Comoros','KM','COM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(49,'Congo','CG','COG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(50,'Cook Islands','CK','COK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(51,'Costa Rica','CR','CRI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(52,'Cote D\'Ivoire','CI','CIV',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(53,'Croatia','HR','HRV',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(54,'Cuba','CU','CUB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(55,'Cyprus','CY','CYP',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(56,'Czech Republic','CZ','CZE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(57,'Denmark','DK','DNK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(58,'Djibouti','DJ','DJI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(59,'Dominica','DM','DMA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(60,'Dominican Republic','DO','DOM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(61,'East Timor','TP','TMP',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(62,'Ecuador','EC','ECU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(63,'Egypt','EG','EGY',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(64,'El Salvador','SV','SLV',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(65,'Equatorial Guinea','GQ','GNQ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(66,'Eritrea','ER','ERI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(67,'Estonia','EE','EST',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(68,'Ethiopia','ET','ETH',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(69,'Falkland Islands (Malvinas)','FK','FLK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(70,'Faroe Islands','FO','FRO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(71,'Fiji','FJ','FJI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(72,'Finland','FI','FIN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(73,'France','FR','FRA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(74,'France, Metropolitan','FX','FXX',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(75,'French Guiana','GF','GUF',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(76,'French Polynesia','PF','PYF',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(77,'French Southern Territories','TF','ATF',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(78,'Gabon','GA','GAB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(79,'Gambia','GM','GMB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(80,'Georgia','GE','GEO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(81,'Germany','DE','DEU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(82,'Ghana','GH','GHA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(83,'Gibraltar','GI','GIB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(84,'Greece','GR','GRC',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(85,'Greenland','GL','GRL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(86,'Grenada','GD','GRD',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(87,'Guadeloupe','GP','GLP',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(88,'Guam','GU','GUM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(89,'Guatemala','GT','GTM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(90,'Guinea','GN','GIN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(91,'Guinea-bissau','GW','GNB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(92,'Guyana','GY','GUY',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(93,'Haiti','HT','HTI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(94,'Heard and Mc Donald Islands','HM','HMD',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(95,'Honduras','HN','HND',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(96,'Hong Kong','HK','HKG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(97,'Hungary','HU','HUN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(98,'Iceland','IS','ISL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(99,'India','IN','IND',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(100,'Indonesia','ID','IDN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(101,'Iran (Islamic Republic of)','IR','IRN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(102,'Iraq','IQ','IRQ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(103,'Ireland','IE','IRL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(104,'Israel','IL','ISR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(105,'Italy','IT','ITA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(106,'Jamaica','JM','JAM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(107,'Japan','JP','JPN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(108,'Jordan','JO','JOR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(109,'Kazakhstan','KZ','KAZ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(110,'Kenya','KE','KEN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(111,'Kiribati','KI','KIR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(112,'North Korea','KP','PRK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(113,'Korea, Republic of','KR','KOR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(114,'Kuwait','KW','KWT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(115,'Kyrgyzstan','KG','KGZ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(116,'Lao People\'s Democratic Republic','LA','LAO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(117,'Latvia','LV','LVA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(118,'Lebanon','LB','LBN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(119,'Lesotho','LS','LSO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(120,'Liberia','LR','LBR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(121,'Libyan Arab Jamahiriya','LY','LBY',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(122,'Liechtenstein','LI','LIE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(123,'Lithuania','LT','LTU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(124,'Luxembourg','LU','LUX',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(125,'Macau','MO','MAC',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(126,'FYROM','MK','MKD',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(127,'Madagascar','MG','MDG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(128,'Malawi','MW','MWI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(129,'Malaysia','MY','MYS',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(130,'Maldives','MV','MDV',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(131,'Mali','ML','MLI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(132,'Malta','MT','MLT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(133,'Marshall Islands','MH','MHL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(134,'Martinique','MQ','MTQ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(135,'Mauritania','MR','MRT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(136,'Mauritius','MU','MUS',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(137,'Mayotte','YT','MYT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(138,'Mexico','MX','MEX',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(139,'Micronesia, Federated States of','FM','FSM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(140,'Moldova, Republic of','MD','MDA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(141,'Monaco','MC','MCO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(142,'Mongolia','MN','MNG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(143,'Montserrat','MS','MSR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(144,'Morocco','MA','MAR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(145,'Mozambique','MZ','MOZ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(146,'Myanmar','MM','MMR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(147,'Namibia','NA','NAM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(148,'Nauru','NR','NRU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(149,'Nepal','NP','NPL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(150,'Netherlands','NL','NLD',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(151,'Netherlands Antilles','AN','ANT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(152,'New Caledonia','NC','NCL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(153,'New Zealand','NZ','NZL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(154,'Nicaragua','NI','NIC',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(155,'Niger','NE','NER',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(156,'Nigeria','NG','NGA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(157,'Niue','NU','NIU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(158,'Norfolk Island','NF','NFK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(159,'Northern Mariana Islands','MP','MNP',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(160,'Norway','NO','NOR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(161,'Oman','OM','OMN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(162,'Pakistan','PK','PAK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(163,'Palau','PW','PLW',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(164,'Panama','PA','PAN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(165,'Papua New Guinea','PG','PNG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(166,'Paraguay','PY','PRY',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(167,'Peru','PE','PER',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(168,'Philippines','PH','PHL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(169,'Pitcairn','PN','PCN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(170,'Poland','PL','POL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(171,'Portugal','PT','PRT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(172,'Puerto Rico','PR','PRI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(173,'Qatar','QA','QAT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(174,'Reunion','RE','REU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(175,'Romania','RO','ROM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(176,'Russian Federation','RU','RUS',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(177,'Rwanda','RW','RWA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(178,'Saint Kitts and Nevis','KN','KNA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(179,'Saint Lucia','LC','LCA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(180,'Saint Vincent and the Grenadines','VC','VCT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(181,'Samoa','WS','WSM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(182,'San Marino','SM','SMR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(183,'Sao Tome and Principe','ST','STP',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(184,'Saudi Arabia','SA','SAU',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(185,'Senegal','SN','SEN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(186,'Seychelles','SC','SYC',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(187,'Sierra Leone','SL','SLE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(188,'Singapore','SG','SGP',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(189,'Slovak Republic','SK','SVK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(190,'Slovenia','SI','SVN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(191,'Solomon Islands','SB','SLB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(192,'Somalia','SO','SOM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(193,'South Africa','ZA','ZAF',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(194,'South Georgia &amp; South Sandwich Islands','GS','SGS',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(195,'Spain','ES','ESP',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(196,'Sri Lanka','LK','LKA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(197,'St. Helena','SH','SHN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(198,'St. Pierre and Miquelon','PM','SPM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(199,'Sudan','SD','SDN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(200,'Suriname','SR','SUR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(201,'Svalbard and Jan Mayen Islands','SJ','SJM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(202,'Swaziland','SZ','SWZ',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',1),(203,'Sweden','SE','SWE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(204,'Switzerland','CH','CHE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(205,'Syrian Arab Republic','SY','SYR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(206,'Taiwan','TW','TWN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(207,'Tajikistan','TJ','TJK',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(208,'Tanzania, United Republic of','TZ','TZA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(209,'Thailand','TH','THA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(210,'Togo','TG','TGO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(211,'Tokelau','TK','TKL',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(212,'Tonga','TO','TON',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(213,'Trinidad and Tobago','TT','TTO',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(214,'Tunisia','TN','TUN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(215,'Turkey','TR','TUR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(216,'Turkmenistan','TM','TKM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(217,'Turks and Caicos Islands','TC','TCA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(218,'Tuvalu','TV','TUV',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(219,'Uganda','UG','UGA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(220,'Ukraine','UA','UKR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(221,'United Arab Emirates','AE','ARE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(222,'United Kingdom','GB','GBR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(223,'United States','US','USA',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(224,'United States Minor Outlying Islands','UM','UMI',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(225,'Uruguay','UY','URY',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(226,'Uzbekistan','UZ','UZB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(227,'Vanuatu','VU','VUT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(228,'Vatican City State (Holy See)','VA','VAT',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(229,'Venezuela','VE','VEN',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(230,'Viet Nam','VN','VNM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(231,'Virgin Islands (British)','VG','VGB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(232,'Virgin Islands (U.S.)','VI','VIR',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(233,'Wallis and Futuna Islands','WF','WLF',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(234,'Western Sahara','EH','ESH',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(235,'Yemen','YE','YEM',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(236,'Yugoslavia','YU','YUG',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(237,'Democratic Republic of Congo','CD','COD',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(238,'Zambia','ZM','ZMB',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(239,'Zimbabwe','ZW','ZWE',NULL,1,999,'2026-07-27 11:24:04','2026-07-27 11:24:04',0);
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `currency_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `country_id` int NOT NULL,
  `currency_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency_code` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency_symbol` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency_rate` decimal(15,8) NOT NULL,
  `symbol_position` tinyint(1) DEFAULT NULL,
  `thousand_sign` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `decimal_sign` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `decimal_position` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `iso_alpha2` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iso_alpha3` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iso_numeric` int DEFAULT NULL,
  `currency_status` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`currency_id`),
  KEY `idx_currencies_status_default` (`currency_status`,`is_default`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES (1,222,'Pound Sterling','GBP','£',0.00000000,0,',','.','2','GB','GBR',826,1,'2026-07-27 11:24:04','2026-07-27 11:24:04',1),(2,73,'Euro','EUR','€',0.00000000,0,',','.','2','FR','FRA',0,0,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(3,223,'US Dollar','USD','$',0.00000000,0,',','.','2','US','USA',840,0,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(4,44,'Yuan Renminbi','CNY','¥',0.00000000,0,',','.','2','CN','CHN',156,0,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(5,13,'Australian Dollar','AUD','$',0.00000000,0,',','.','2','AU','AUS',36,1,'2026-07-27 11:24:04','2026-07-27 11:24:04',0),(6,156,'Naira','NGN','₦',0.00000000,0,',','.','2','NG','NGA',566,1,'2026-07-27 11:24:05','2026-07-27 11:24:05',0);
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_groups`
--

DROP TABLE IF EXISTS `customer_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_groups` (
  `customer_group_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `approval` tinyint(1) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`customer_group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_groups`
--

LOCK TABLES `customer_groups` WRITE;
/*!40000 ALTER TABLE `customer_groups` DISABLE KEYS */;
INSERT INTO `customer_groups` VALUES (1,'Default group',NULL,0,1,'2026-07-27 11:24:05','2026-07-27 11:24:05');
/*!40000 ALTER TABLE `customer_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(96) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telephone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_id` int DEFAULT NULL,
  `newsletter` tinyint(1) DEFAULT NULL,
  `customer_group_id` int NOT NULL,
  `ip_address` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL,
  `status` tinyint(1) NOT NULL,
  `reset_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_time` datetime DEFAULT NULL,
  `activation_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remember_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_activated` tinyint(1) DEFAULT NULL,
  `activated_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `last_seen` datetime DEFAULT NULL,
  `updated_at` timestamp NOT NULL,
  `invited_at` timestamp NULL DEFAULT NULL,
  `last_location_area` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `customers_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'API','Check','api-check-20260806123942@example.test','$2y$10$FU0svtKRmtDeSGfBKLXLj.UOy7lf5Q6a6xXQ19C.wpv1C8BPIN2dS','+15550100000',NULL,NULL,1,NULL,'2026-08-06 13:39:44',1,NULL,NULL,NULL,NULL,1,'2026-08-06 13:39:44',NULL,NULL,'2026-08-06 13:39:44',NULL,''),(2,'Verify','Customer','api-verified-20260806124152@example.test','$2y$10$NodINnVvsN75rYjgQGrB6OrJaltUQ4OvUVxf/LGUL52ZaZ7Ypzjzi','+15550100001',NULL,NULL,1,NULL,'2026-08-06 13:41:54',1,NULL,NULL,NULL,NULL,1,'2026-08-06 13:41:54',NULL,NULL,'2026-08-06 13:41:54',NULL,''),(3,'Order','Check','api-order-20260806124348@example.test','$2y$10$XMeZWYjdtnb3OtlBi78f.O88v6bqVfNQVSZOPl5J8HXnlzPXXzbJK','+15550100002',NULL,NULL,1,NULL,'2026-08-06 13:43:51',1,NULL,NULL,NULL,NULL,1,'2026-08-06 13:43:51',NULL,NULL,'2026-08-06 13:43:51',NULL,''),(4,'Final','Check','api-final-20260806124518@example.test','$2y$10$S8ntD2A.hsuY7dYnq2wZguX0eO5gLrink3R3VfGhOg8StFVAlqLfO','+15550100003',NULL,NULL,1,NULL,'2026-08-06 13:45:20',1,NULL,NULL,NULL,NULL,1,'2026-08-06 13:45:20',NULL,NULL,'2026-08-06 13:45:20',NULL,''),(5,'Complete','Check','api-complete-20260806124704@example.test','$2y$10$rHavvfIcCAcr8KRKm/gKaepBRwApnHYhxqJl0s9m5mf97LGzGpn.C','+15550100004',NULL,NULL,1,NULL,'2026-08-06 13:47:06',1,NULL,NULL,NULL,NULL,1,'2026-08-06 13:47:06',NULL,NULL,'2026-08-06 13:47:06',NULL,''),(6,'Profile','Check','api-profile-20260806124818@example.test','$2y$10$mGqhuh7AHvTLwknwVa7kj.jUxFXq4xsncgcZhoSTZHc6LVDpwaNg2','+15550100005',NULL,NULL,1,NULL,'2026-08-06 13:48:21',1,NULL,NULL,NULL,NULL,1,'2026-08-06 13:48:21',NULL,NULL,'2026-08-06 13:48:21',NULL,''),(7,'Profile','Verified','api-profile-final-20260806124906@example.test','$2y$10$nlHAZOOSv5XkqNVlZqxakuFErK4V7TSDmDUXGF3Z5nq3PuVohq4/i','+15550100008',NULL,0,1,NULL,'2026-08-06 13:49:08',1,NULL,NULL,NULL,NULL,1,'2026-08-06 13:49:08',NULL,NULL,'2026-08-06 13:49:15',NULL,'');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dining_areas`
--

DROP TABLE IF EXISTS `dining_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dining_areas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `floor_plan` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dining_areas_location_id` (`id`,`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dining_areas`
--

LOCK TABLES `dining_areas` WRITE;
/*!40000 ALTER TABLE `dining_areas` DISABLE KEYS */;
INSERT INTO `dining_areas` VALUES (1,1,'Default',NULL,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:05');
/*!40000 ALTER TABLE `dining_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dining_sections`
--

DROP TABLE IF EXISTS `dining_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dining_sections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dining_sections_location_id_index` (`location_id`),
  KEY `idx_dining_sections_enabled` (`id`,`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dining_sections`
--

LOCK TABLES `dining_sections` WRITE;
/*!40000 ALTER TABLE `dining_sections` DISABLE KEYS */;
/*!40000 ALTER TABLE `dining_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dining_tables`
--

DROP TABLE IF EXISTS `dining_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dining_tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dining_area_id` bigint unsigned NOT NULL,
  `dining_section_id` bigint unsigned DEFAULT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shape` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `min_capacity` int NOT NULL DEFAULT '0',
  `max_capacity` int NOT NULL DEFAULT '0',
  `extra_capacity` int NOT NULL DEFAULT '0',
  `is_combo` tinyint(1) NOT NULL DEFAULT '0',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `nest_left` int DEFAULT NULL,
  `nest_right` int DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `seat_layout` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dining_tables_dining_area_id_index` (`dining_area_id`),
  KEY `dining_tables_dining_section_id_index` (`dining_section_id`),
  KEY `dining_tables_parent_id_index` (`parent_id`),
  KEY `idx_dining_tables_booked_filter` (`parent_id`,`is_enabled`,`min_capacity`,`max_capacity`,`dining_area_id`,`dining_section_id`),
  KEY `idx_dining_tables_capacity` (`min_capacity`,`max_capacity`),
  KEY `idx_dining_tables_priority` (`id`,`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dining_tables`
--

LOCK TABLES `dining_tables` WRITE;
/*!40000 ALTER TABLE `dining_tables` DISABLE KEYS */;
INSERT INTO `dining_tables` VALUES (1,1,NULL,NULL,'Table 1','rectangle',2,9,0,0,1,1,2,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(2,1,NULL,NULL,'Table 2','rectangle',3,12,0,0,1,3,4,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(3,1,NULL,NULL,'Table 3','rectangle',5,10,0,0,1,5,6,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(4,1,NULL,NULL,'Table 4','rectangle',3,7,0,0,1,7,8,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(5,1,NULL,NULL,'Table 5','rectangle',4,7,0,0,1,9,10,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(6,1,NULL,NULL,'Table 6','rectangle',2,12,0,0,1,11,12,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(7,1,NULL,NULL,'Table 7','rectangle',2,9,0,0,1,13,14,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(8,1,NULL,NULL,'Table 8','rectangle',5,10,0,0,1,15,16,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(9,1,NULL,NULL,'Table 9','rectangle',3,6,0,0,1,17,18,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(10,1,NULL,NULL,'Table 10','rectangle',5,12,0,0,1,19,20,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(11,1,NULL,NULL,'Table 11','rectangle',5,12,0,0,1,21,22,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(12,1,NULL,NULL,'Table 12','rectangle',2,7,0,0,1,23,24,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(13,1,NULL,NULL,'Table 13','rectangle',2,12,0,0,1,25,26,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52'),(14,1,NULL,NULL,'Table 14','rectangle',2,8,0,0,1,27,28,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:52');
/*!40000 ALTER TABLE `dining_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extension_settings`
--

DROP TABLE IF EXISTS `extension_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extension_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `extension_settings_item_unique` (`item`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extension_settings`
--

LOCK TABLES `extension_settings` WRITE;
/*!40000 ALTER TABLE `extension_settings` DISABLE KEYS */;
INSERT INTO `extension_settings` VALUES (1,'igniter_review_settings','{\"ratings\": {\"ratings\": [\"Bad\", \"Worse\", \"Good\", \"Average\", \"Excellent\"]}, \"allow_reviews\": \"1\", \"approve_reviews\": \"1\"}');
/*!40000 ALTER TABLE `extension_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extensions`
--

DROP TABLE IF EXISTS `extensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extensions` (
  `extension_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT '1.0.0',
  PRIMARY KEY (`extension_id`),
  UNIQUE KEY `extensions_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extensions`
--

LOCK TABLES `extensions` WRITE;
/*!40000 ALTER TABLE `extensions` DISABLE KEYS */;
/*!40000 ALTER TABLE `extensions` ENABLE KEYS */;
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
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
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
-- Table structure for table `igniter_api_access_tokens`
--

DROP TABLE IF EXISTS `igniter_api_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_api_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_access_tokens_token_unique` (`token`),
  KEY `api_access_tokens_tokenable` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_api_access_tokens`
--

LOCK TABLES `igniter_api_access_tokens` WRITE;
/*!40000 ALTER TABLE `igniter_api_access_tokens` DISABLE KEYS */;
INSERT INTO `igniter_api_access_tokens` VALUES (1,'customers',1,'integration-check','2c1e3ec1d30dc823f939c84ad417de4897feb7fbdd778568dd77169ec0b5858e','[\"*\"]','2026-08-06 13:39:55','2026-08-06 13:39:48','2026-08-06 13:39:55'),(2,'customers',2,'verification-suite','e47cebf08c66aa879c40bb342e044e2333493104ed2a469e6e45402458a6ba83','[\"*\"]','2026-08-06 13:42:07','2026-08-06 13:41:56','2026-08-06 13:42:07'),(3,'customers',3,'order-verification','5575355e742c0d19dbf38e4c09fbc99cf4a12cfecf7fc69b7c07aea15bed8d75','[\"*\"]','2026-08-06 13:44:00','2026-08-06 13:43:54','2026-08-06 13:44:00'),(4,'customers',4,'final-verification','2b94d5d461d76c755844d17fb091aa10cb16943ef2a077f4214d0f04de48a909','[\"*\"]','2026-08-06 13:46:20','2026-08-06 13:45:23','2026-08-06 13:46:20'),(5,'customers',5,'complete-verification','97600c605827dd94527a0c0b708d1b6249b8e0201b26f44a8ea4b60643c1167b','[\"*\"]','2026-08-06 13:47:25','2026-08-06 13:47:08','2026-08-06 13:47:25'),(6,'customers',6,'profile-verification','afd6aaf84e4bbb0b6b239d8d133c2a667646f60d695c273328915831be56c8e0','[\"*\"]','2026-08-06 13:48:27','2026-08-06 13:48:24','2026-08-06 13:48:27'),(7,'customers',7,'profile-final-verification','0fe88580b73e88f5a8ea76f3c549453642c5cda4ecc1cca219567286dc561280','[\"*\"]','2026-08-06 13:49:16','2026-08-06 13:49:11','2026-08-06 13:49:16');
/*!40000 ALTER TABLE `igniter_api_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_api_resources`
--

DROP TABLE IF EXISTS `igniter_api_resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_api_resources` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta` text COLLATE utf8mb4_unicode_ci,
  `is_custom` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_api_resources`
--

LOCK TABLES `igniter_api_resources` WRITE;
/*!40000 ALTER TABLE `igniter_api_resources` DISABLE KEYS */;
INSERT INTO `igniter_api_resources` VALUES (1,'Categories','categories','An API resource for categories','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"all\",\"show\":\"all\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(2,'Currencies','currencies','An API resource for currencies','{\"actions\":[\"index\"],\"authorization\":{\"index\":\"all\"}}',0),(3,'Addresses','addresses','An API resource for customer addresses','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"users\",\"show\":\"users\",\"store\":\"users\",\"update\":\"users\",\"destroy\":\"users\"}}',0),(4,'Customers','customers','An API resource for customers','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"admin\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"users\",\"destroy\":\"admin\"}}',0),(5,'Locations','locations','An API resource for locations','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"all\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(6,'LocationSettings','location_settings','An API resource for location settings','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"admin\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(7,'Menus','menus','An API resource for menus','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"all\",\"show\":\"all\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(8,'MenuOptions','menu_options','An API resource for Menu options','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"admin\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(9,'MenuItemOptions','menu_item_options','An API resource for Menu item options','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"admin\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(10,'Orders','orders','An API resource for orders','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"users\",\"show\":\"users\",\"store\":\"users\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(11,'Reservations','reservations','An API resource for reservations','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"users\",\"show\":\"users\",\"store\":\"users\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(12,'Reviews','reviews','An API resource for reviews','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"users\",\"show\":\"users\",\"store\":\"users\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(13,'Tables','tables','An API resource for dining tables','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"admin\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(14,'Status','status','An API resource for status','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"admin\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(15,'Staff','users','An API resource for staff','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"admin\",\"show\":\"admin\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0),(16,'Coupons','coupons','An API resource for coupons','{\"actions\":[\"index\",\"show\",\"store\",\"update\",\"destroy\"],\"authorization\":{\"index\":\"all\",\"show\":\"all\",\"store\":\"admin\",\"update\":\"admin\",\"destroy\":\"admin\"}}',0);
/*!40000 ALTER TABLE `igniter_api_resources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_automation_logs`
--

DROP TABLE IF EXISTS `igniter_automation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_automation_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `automation_rule_id` bigint unsigned DEFAULT NULL,
  `rule_action_id` bigint unsigned DEFAULT NULL,
  `is_success` tinyint(1) NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `params` text COLLATE utf8mb4_unicode_ci,
  `exception` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_automation_logs`
--

LOCK TABLES `igniter_automation_logs` WRITE;
/*!40000 ALTER TABLE `igniter_automation_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_automation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_automation_rule_actions`
--

DROP TABLE IF EXISTS `igniter_automation_rule_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_automation_rule_actions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `automation_rule_id` bigint unsigned DEFAULT NULL,
  `class_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `igniter_actions_automation_rule_id_foreign` (`automation_rule_id`),
  CONSTRAINT `igniter_actions_automation_rule_id_foreign` FOREIGN KEY (`automation_rule_id`) REFERENCES `igniter_automation_rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_automation_rule_actions`
--

LOCK TABLES `igniter_automation_rule_actions` WRITE;
/*!40000 ALTER TABLE `igniter_automation_rule_actions` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_automation_rule_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_automation_rule_conditions`
--

DROP TABLE IF EXISTS `igniter_automation_rule_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_automation_rule_conditions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `automation_rule_id` bigint unsigned DEFAULT NULL,
  `class_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `igniter_conditions_automation_rule_id_foreign` (`automation_rule_id`),
  CONSTRAINT `igniter_conditions_automation_rule_id_foreign` FOREIGN KEY (`automation_rule_id`) REFERENCES `igniter_automation_rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_automation_rule_conditions`
--

LOCK TABLES `igniter_automation_rule_conditions` WRITE;
/*!40000 ALTER TABLE `igniter_automation_rule_conditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_automation_rule_conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_automation_rules`
--

DROP TABLE IF EXISTS `igniter_automation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_automation_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_class` text COLLATE utf8mb4_unicode_ci,
  `config_data` text COLLATE utf8mb4_unicode_ci,
  `is_custom` tinyint(1) NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_automation_rules`
--

LOCK TABLES `igniter_automation_rules` WRITE;
/*!40000 ALTER TABLE `igniter_automation_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_automation_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_cart_cart`
--

DROP TABLE IF EXISTS `igniter_cart_cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_cart_cart` (
  `identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instance` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`identifier`,`instance`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_cart_cart`
--

LOCK TABLES `igniter_cart_cart` WRITE;
/*!40000 ALTER TABLE `igniter_cart_cart` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_cart_cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_coupon_categories`
--

DROP TABLE IF EXISTS `igniter_coupon_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_coupon_categories` (
  `coupon_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  UNIQUE KEY `coupon_category_unique` (`coupon_id`,`category_id`),
  KEY `coupon_id_index` (`coupon_id`),
  KEY `category_id_index` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_coupon_categories`
--

LOCK TABLES `igniter_coupon_categories` WRITE;
/*!40000 ALTER TABLE `igniter_coupon_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_coupon_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_coupon_customer_groups`
--

DROP TABLE IF EXISTS `igniter_coupon_customer_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_coupon_customer_groups` (
  `coupon_id` bigint unsigned NOT NULL,
  `customer_group_id` bigint unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_coupon_customer_groups`
--

LOCK TABLES `igniter_coupon_customer_groups` WRITE;
/*!40000 ALTER TABLE `igniter_coupon_customer_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_coupon_customer_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_coupon_customers`
--

DROP TABLE IF EXISTS `igniter_coupon_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_coupon_customers` (
  `coupon_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_coupon_customers`
--

LOCK TABLES `igniter_coupon_customers` WRITE;
/*!40000 ALTER TABLE `igniter_coupon_customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_coupon_customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_coupon_menus`
--

DROP TABLE IF EXISTS `igniter_coupon_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_coupon_menus` (
  `coupon_id` int unsigned NOT NULL,
  `menu_id` int unsigned NOT NULL,
  UNIQUE KEY `coupon_menu_unique` (`coupon_id`,`menu_id`),
  KEY `coupon_id_index` (`coupon_id`),
  KEY `menu_id_index` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_coupon_menus`
--

LOCK TABLES `igniter_coupon_menus` WRITE;
/*!40000 ALTER TABLE `igniter_coupon_menus` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_coupon_menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_coupons`
--

DROP TABLE IF EXISTS `igniter_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_coupons` (
  `coupon_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount` decimal(15,4) DEFAULT NULL,
  `min_total` decimal(15,4) DEFAULT NULL,
  `redemptions` int NOT NULL DEFAULT '0',
  `customer_redemptions` int NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL,
  `validity` char(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fixed_date` date DEFAULT NULL,
  `fixed_from_time` time DEFAULT NULL,
  `fixed_to_time` time DEFAULT NULL,
  `period_start_date` date DEFAULT NULL,
  `period_end_date` date DEFAULT NULL,
  `recurring_every` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recurring_from_time` time DEFAULT NULL,
  `recurring_to_time` time DEFAULT NULL,
  `order_restriction` text COLLATE utf8mb4_unicode_ci,
  `apply_coupon_on` enum('whole_cart','menu_items','delivery_fee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'whole_cart',
  `min_menu_quantity` int NOT NULL DEFAULT '0',
  `auto_apply` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `igniter_coupons_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_coupons`
--

LOCK TABLES `igniter_coupons` WRITE;
/*!40000 ALTER TABLE `igniter_coupons` DISABLE KEYS */;
INSERT INTO `igniter_coupons` VALUES (1,'Half Sundays','2222','F',100.0000,500.0000,0,0,NULL,1,'2026-07-27 00:00:00','forever',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'whole_cart',0,0,'2026-07-27 00:00:00'),(2,'Half Tuesdays','3333','P',30.0000,1000.0000,0,0,NULL,1,'2026-07-27 00:00:00','forever',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'whole_cart',0,0,'2026-07-27 00:00:00'),(3,'Full Mondays','MTo6TuTg','P',50.0000,0.0000,0,1,NULL,1,'2026-07-27 00:00:00','forever',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'whole_cart',0,0,'2026-07-27 00:00:00'),(4,'Full Tuesdays','4444','F',500.0000,5000.0000,0,0,NULL,1,'2026-07-27 00:00:00','forever',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'whole_cart',0,0,'2026-07-27 00:00:00');
/*!40000 ALTER TABLE `igniter_coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_coupons_history`
--

DROP TABLE IF EXISTS `igniter_coupons_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_coupons_history` (
  `coupon_history_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `code` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_total` decimal(15,4) DEFAULT NULL,
  `amount` decimal(15,4) DEFAULT NULL,
  `created_at` timestamp NOT NULL,
  `status` tinyint(1) NOT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`coupon_history_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_coupons_history`
--

LOCK TABLES `igniter_coupons_history` WRITE;
/*!40000 ALTER TABLE `igniter_coupons_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_coupons_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_frontend_banners`
--

DROP TABLE IF EXISTS `igniter_frontend_banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_frontend_banners` (
  `banner_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` char(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `click_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language_id` bigint unsigned DEFAULT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_code` text COLLATE utf8mb4_unicode_ci,
  `custom_code` text COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL,
  PRIMARY KEY (`banner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_frontend_banners`
--

LOCK TABLES `igniter_frontend_banners` WRITE;
/*!40000 ALTER TABLE `igniter_frontend_banners` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_frontend_banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_frontend_sliders`
--

DROP TABLE IF EXISTS `igniter_frontend_sliders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_frontend_sliders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `igniter_frontend_sliders_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_frontend_sliders`
--

LOCK TABLES `igniter_frontend_sliders` WRITE;
/*!40000 ALTER TABLE `igniter_frontend_sliders` DISABLE KEYS */;
INSERT INTO `igniter_frontend_sliders` VALUES (1,'Homepage slider','home-slider',NULL,'2026-07-27 11:24:34','2026-07-27 11:24:34');
/*!40000 ALTER TABLE `igniter_frontend_sliders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_frontend_subscribers`
--

DROP TABLE IF EXISTS `igniter_frontend_subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_frontend_subscribers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statistics` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_frontend_subscribers`
--

LOCK TABLES `igniter_frontend_subscribers` WRITE;
/*!40000 ALTER TABLE `igniter_frontend_subscribers` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_frontend_subscribers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_pages_menu_items`
--

DROP TABLE IF EXISTS `igniter_pages_menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_pages_menu_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `menu_id` int unsigned NOT NULL,
  `parent_id` int unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `config` text COLLATE utf8mb4_unicode_ci,
  `nest_left` int DEFAULT NULL,
  `nest_right` int DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `igniter_pages_menu_items_menu_id_index` (`menu_id`),
  KEY `igniter_pages_menu_items_parent_id_index` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_pages_menu_items`
--

LOCK TABLES `igniter_pages_menu_items` WRITE;
/*!40000 ALTER TABLE `igniter_pages_menu_items` DISABLE KEYS */;
INSERT INTO `igniter_pages_menu_items` VALUES (1,1,NULL,'igniter.orange::default.text_restaurant','',NULL,'header',NULL,NULL,'[]',1,8,1,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(2,1,1,'igniter.orange::default.menu_menu','',NULL,'theme-page',NULL,'local.menus','[]',2,3,2,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(3,1,1,'igniter.orange::default.menu_reservation','',NULL,'theme-page',NULL,'reservation.reservation','[]',4,5,3,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(4,1,1,'igniter.orange::default.menu_locations','',NULL,'theme-page',NULL,'locations','[]',6,7,4,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(5,1,NULL,'igniter.orange::default.text_information','',NULL,'header',NULL,NULL,'[]',9,16,5,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(6,1,5,'igniter.orange::default.menu_contact','',NULL,'theme-page',NULL,'contact','[]',10,11,6,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(7,1,5,'About Us','',NULL,'static-page',NULL,'1','[]',12,13,7,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(8,1,5,'Privacy Policy','',NULL,'static-page',NULL,'2','[]',14,15,8,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(9,2,NULL,'igniter.orange::default.menu_menu','view-menu',NULL,'theme-page',NULL,'local.menus','[]',17,18,9,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(10,2,NULL,'igniter.orange::default.menu_reservation','reservation',NULL,'theme-page',NULL,'reservation.reservation','[]',19,20,10,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(11,2,NULL,'igniter.orange::default.menu_login','login',NULL,'theme-page',NULL,'account.login','[]',21,22,11,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(12,2,NULL,'igniter.orange::default.menu_register','register',NULL,'theme-page',NULL,'account.register','[]',23,24,12,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(13,2,NULL,'igniter.orange::default.menu_my_account','account',NULL,'theme-page',NULL,'account.account','[]',25,36,13,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(14,2,13,'igniter.orange::default.menu_recent_order','recent-orders',NULL,'theme-page',NULL,'account.orders','[]',26,27,14,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(15,2,13,'igniter.orange::default.menu_my_account','',NULL,'theme-page',NULL,'account.account','[]',28,29,15,'2026-07-27 11:26:27','2026-07-27 11:26:27'),(16,2,13,'igniter.orange::default.menu_address','',NULL,'theme-page',NULL,'account.address','[]',30,31,16,'2026-07-27 11:26:28','2026-07-27 11:26:28'),(17,2,13,'igniter.orange::default.menu_recent_reservation','',NULL,'theme-page',NULL,'account.reservations','[]',32,33,17,'2026-07-27 11:26:28','2026-07-27 11:26:28'),(18,2,13,'igniter.orange::default.menu_logout','',NULL,'url','/logout',NULL,'[]',34,35,18,'2026-07-27 11:26:28','2026-07-27 11:26:28'),(19,3,NULL,'Pages','',NULL,'all-static-pages',NULL,'','[]',37,38,19,'2026-07-27 11:26:28','2026-07-27 11:26:28');
/*!40000 ALTER TABLE `igniter_pages_menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_pages_menus`
--

DROP TABLE IF EXISTS `igniter_pages_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_pages_menus` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `theme_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `igniter_pages_menus_theme_code_index` (`theme_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_pages_menus`
--

LOCK TABLES `igniter_pages_menus` WRITE;
/*!40000 ALTER TABLE `igniter_pages_menus` DISABLE KEYS */;
INSERT INTO `igniter_pages_menus` VALUES (1,'igniter-orange','Footer menu','footer-menu','2026-07-27 11:26:24','2026-07-27 11:26:24'),(2,'igniter-orange','Main menu','main-menu','2026-07-27 11:26:27','2026-07-27 11:26:27'),(3,'igniter-orange','Pages menu','pages-menu','2026-07-27 11:26:28','2026-07-27 11:26:28');
/*!40000 ALTER TABLE `igniter_pages_menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_reviews`
--

DROP TABLE IF EXISTS `igniter_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_reviews` (
  `review_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned DEFAULT NULL,
  `reviewable_id` bigint unsigned DEFAULT NULL,
  `reviewable_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `author` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_id` bigint unsigned DEFAULT NULL,
  `quality` int NOT NULL,
  `delivery` int NOT NULL,
  `service` int NOT NULL,
  `review_text` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL,
  `review_status` tinyint(1) NOT NULL,
  `updated_at` timestamp NOT NULL,
  PRIMARY KEY (`review_id`),
  KEY `reviews_sale_id_type_index` (`review_id`,`reviewable_type`,`reviewable_id`),
  KEY `idx_igniter_reviews_location_status` (`location_id`,`review_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_reviews`
--

LOCK TABLES `igniter_reviews` WRITE;
/*!40000 ALTER TABLE `igniter_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igniter_socialite_providers`
--

DROP TABLE IF EXISTS `igniter_socialite_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igniter_socialite_providers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `provider_token_index` (`provider`,`token`),
  KEY `igniter_socialite_providers_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igniter_socialite_providers`
--

LOCK TABLES `igniter_socialite_providers` WRITE;
/*!40000 ALTER TABLE `igniter_socialite_providers` DISABLE KEYS */;
/*!40000 ALTER TABLE `igniter_socialite_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredientables`
--

DROP TABLE IF EXISTS `ingredientables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredientables` (
  `ingredient_id` int unsigned NOT NULL,
  `ingredientable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ingredientable_id` bigint unsigned NOT NULL,
  UNIQUE KEY `ingredientable_unique` (`ingredient_id`,`ingredientable_id`,`ingredientable_type`),
  KEY `allergenable_index` (`ingredientable_type`,`ingredientable_id`),
  KEY `allergenables_allergen_id_index` (`ingredient_id`),
  KEY `idx_type_id_ingredient` (`ingredientable_type`,`ingredientable_id`,`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredientables`
--

LOCK TABLES `ingredientables` WRITE;
/*!40000 ALTER TABLE `ingredientables` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingredientables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `ingredient_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_allergen` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `language_translations`
--

DROP TABLE IF EXISTS `language_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `language_translations` (
  `translation_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `namespace` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '*',
  `group` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `unstable` tinyint(1) NOT NULL DEFAULT '0',
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`translation_id`),
  UNIQUE KEY `item_unique` (`locale`,`namespace`,`group`,`item`),
  KEY `language_translations_group_index` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `language_translations`
--

LOCK TABLES `language_translations` WRITE;
/*!40000 ALTER TABLE `language_translations` DISABLE KEYS */;
/*!40000 ALTER TABLE `language_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `language_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idiom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL,
  `can_delete` tinyint(1) NOT NULL,
  `original_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `version` json DEFAULT NULL,
  PRIMARY KEY (`language_id`),
  KEY `idx_languages_status_default` (`status`,`is_default`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `languages`
--

LOCK TABLES `languages` WRITE;
/*!40000 ALTER TABLE `languages` DISABLE KEYS */;
INSERT INTO `languages` VALUES (1,'en','English',NULL,'english',1,0,NULL,'2026-07-27 11:24:05','2026-07-27 11:24:05',1,NULL);
/*!40000 ALTER TABLE `languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_areas`
--

DROP TABLE IF EXISTS `location_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_areas` (
  `area_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `boundaries` json NOT NULL,
  `conditions` json NOT NULL,
  `color` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `priority` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`area_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_areas`
--

LOCK TABLES `location_areas` WRITE;
/*!40000 ALTER TABLE `location_areas` DISABLE KEYS */;
/*!40000 ALTER TABLE `location_areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_options`
--

DROP TABLE IF EXISTS `location_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_options` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `location_options_location_id_item_unique` (`location_id`,`item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_options`
--

LOCK TABLES `location_options` WRITE;
/*!40000 ALTER TABLE `location_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `location_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_settings`
--

DROP TABLE IF EXISTS `location_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `location_settings_location_id_item_unique` (`location_id`,`item`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_settings`
--

LOCK TABLES `location_settings` WRITE;
/*!40000 ALTER TABLE `location_settings` DISABLE KEYS */;
INSERT INTO `location_settings` VALUES (1,1,'booking','[]');
/*!40000 ALTER TABLE `location_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locationables`
--

DROP TABLE IF EXISTS `locationables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locationables` (
  `location_id` int NOT NULL,
  `locationable_id` int NOT NULL,
  `locationable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` text COLLATE utf8mb4_unicode_ci,
  KEY `idx_locationables_lookup` (`locationable_type`,`locationable_id`,`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locationables`
--

LOCK TABLES `locationables` WRITE;
/*!40000 ALTER TABLE `locationables` DISABLE KEYS */;
INSERT INTO `locationables` VALUES (1,1,'tables',NULL),(1,2,'tables',NULL),(1,3,'tables',NULL),(1,4,'tables',NULL),(1,5,'tables',NULL),(1,6,'tables',NULL),(1,7,'tables',NULL),(1,8,'tables',NULL),(1,9,'tables',NULL),(1,10,'tables',NULL),(1,11,'tables',NULL),(1,12,'tables',NULL),(1,13,'tables',NULL),(1,14,'tables',NULL),(1,1,'users',NULL);
/*!40000 ALTER TABLE `locationables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `location_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_email` varchar(96) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `location_address_1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_address_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_state` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_postcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_country_id` int DEFAULT NULL,
  `location_telephone` text COLLATE utf8mb4_unicode_ci,
  `location_lat` decimal(10,6) DEFAULT NULL,
  `location_lng` decimal(10,6) DEFAULT NULL,
  `location_radius` int DEFAULT NULL,
  `location_status` tinyint(1) DEFAULT NULL,
  `permalink_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_auto_lat_lng` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`location_id`),
  KEY `idx_locations_name` (`location_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Foodly','admin@admin.com',NULL,'Street',NULL,NULL,NULL,'40000',202,NULL,52.415884,-1.603648,NULL,1,'default',1,'2026-07-27 11:24:05','2026-07-27 12:37:53',0);
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail_layouts`
--

DROP TABLE IF EXISTS `mail_layouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_layouts` (
  `layout_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language_id` int NOT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `status` tinyint(1) NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `layout` text COLLATE utf8mb4_unicode_ci,
  `plain_layout` text COLLATE utf8mb4_unicode_ci,
  `layout_css` text COLLATE utf8mb4_unicode_ci,
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`layout_id`),
  UNIQUE KEY `mail_layouts_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail_layouts`
--

LOCK TABLES `mail_layouts` WRITE;
/*!40000 ALTER TABLE `mail_layouts` DISABLE KEYS */;
INSERT INTO `mail_layouts` VALUES (1,'Default layout',1,'2026-07-27 13:19:06','2026-07-27 13:19:06',1,'default',NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `mail_layouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail_partials`
--

DROP TABLE IF EXISTS `mail_partials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_partials` (
  `partial_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `html` text COLLATE utf8mb4_unicode_ci,
  `text` text COLLATE utf8mb4_unicode_ci,
  `is_custom` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`partial_id`),
  UNIQUE KEY `mail_partials_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail_partials`
--

LOCK TABLES `mail_partials` WRITE;
/*!40000 ALTER TABLE `mail_partials` DISABLE KEYS */;
INSERT INTO `mail_partials` VALUES (1,'Header','header',NULL,NULL,0,'2026-07-27 13:19:07','2026-07-27 13:19:07'),(2,'Footer','footer',NULL,NULL,0,'2026-07-27 13:19:07','2026-07-27 13:19:07'),(3,'Button','button',NULL,NULL,0,'2026-07-27 13:19:07','2026-07-27 13:19:07'),(4,'Panel','panel',NULL,NULL,0,'2026-07-27 13:19:07','2026-07-27 13:19:07'),(5,'Table','table',NULL,NULL,0,'2026-07-27 13:19:07','2026-07-27 13:19:07'),(6,'Subcopy','subcopy',NULL,NULL,0,'2026-07-27 13:19:07','2026-07-27 13:19:07'),(7,'Promotion','promotion',NULL,NULL,0,'2026-07-27 13:19:08','2026-07-27 13:19:08');
/*!40000 ALTER TABLE `mail_partials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail_templates`
--

DROP TABLE IF EXISTS `mail_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_templates` (
  `template_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `layout_id` bigint unsigned DEFAULT NULL,
  `code` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_custom` tinyint(1) DEFAULT NULL,
  `plain_body` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`template_id`),
  UNIQUE KEY `mail_templates_data_template_id_code_unique` (`layout_id`,`code`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail_templates`
--

LOCK TABLES `mail_templates` WRITE;
/*!40000 ALTER TABLE `mail_templates` DISABLE KEYS */;
INSERT INTO `mail_templates` VALUES (1,1,'igniter.user::mail.admin_password_reset','','','2026-07-27 13:19:08','2026-07-27 13:19:08','lang:igniter.user::default.text_mail_admin_password_reset',0,NULL),(2,1,'igniter.user::mail.admin_password_reset_request','','','2026-07-27 13:19:08','2026-07-27 13:19:08','lang:igniter.user::default.text_mail_admin_password_reset_request',0,NULL),(3,1,'igniter.user::mail.password_reset','','','2026-07-27 13:19:08','2026-07-27 13:19:08','lang:igniter.user::default.text_mail_password_reset',0,NULL),(4,1,'igniter.user::mail.password_reset_request','','','2026-07-27 13:19:08','2026-07-27 13:19:08','lang:igniter.user::default.text_mail_password_reset_request',0,NULL),(5,1,'igniter.user::mail.registration','','','2026-07-27 13:19:09','2026-07-27 13:19:09','lang:igniter.user::default.text_mail_registration',0,NULL),(6,1,'igniter.user::mail.registration_alert','','','2026-07-27 13:19:10','2026-07-27 13:19:10','lang:igniter.user::default.text_mail_registration_alert',0,NULL),(7,1,'igniter.user::mail.activation','','','2026-07-27 13:19:10','2026-07-27 13:19:10','lang:igniter.user::default.text_mail_activation',0,NULL),(8,1,'igniter.user::mail.invite','','','2026-07-27 13:19:10','2026-07-27 13:19:10','lang:igniter.user::default.text_mail_invite',0,NULL),(9,1,'igniter.user::mail.invite_customer','','','2026-07-27 13:19:10','2026-07-27 13:19:10','lang:igniter.user::default.text_mail_invite_customer',0,NULL),(10,1,'igniter.reservation::mail.reservation','','','2026-07-27 13:19:11','2026-07-27 13:19:11','lang:igniter.reservation::default.text_mail_reservation',0,NULL),(11,1,'igniter.reservation::mail.reservation_alert','','','2026-07-27 13:19:11','2026-07-27 13:19:11','lang:igniter.reservation::default.text_mail_reservation_alert',0,NULL),(12,1,'igniter.reservation::mail.reservation_update','','','2026-07-27 13:19:11','2026-07-27 13:19:11','lang:igniter.reservation::default.text_mail_reservation_update',0,NULL),(13,1,'igniter.reservation::mail.reservation_reminder','','','2026-07-27 13:19:11','2026-07-27 13:19:11','lang:igniter.reservation::default.text_mail_reservation_reminder',0,NULL),(14,1,'igniter.local::mail.review_chase','','','2026-07-27 13:19:11','2026-07-27 13:19:11','lang:igniter.local::default.reviews.text_chase_email',0,NULL),(15,1,'igniter.frontend::mail.contact','','','2026-07-27 13:19:12','2026-07-27 13:19:12','Contact form email to admin',0,NULL),(16,1,'igniter.cart::mail.order','','','2026-07-27 13:19:12','2026-07-27 13:19:12','lang:igniter.cart::default.text_mail_order',0,NULL),(17,1,'igniter.cart::mail.order_alert','','','2026-07-27 13:19:12','2026-07-27 13:19:12','lang:igniter.cart::default.text_mail_order_alert',0,NULL),(18,1,'igniter.cart::mail.order_update','','','2026-07-27 13:19:12','2026-07-27 13:19:12','lang:igniter.cart::default.text_mail_order_update',0,NULL),(19,1,'igniter.cart::mail.low_stock_alert','','','2026-07-27 13:19:13','2026-07-27 13:19:13','lang:igniter.cart::default.text_mail_low_stock_alert',0,NULL);
/*!40000 ALTER TABLE `mail_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mealtimes`
--

DROP TABLE IF EXISTS `mealtimes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mealtimes` (
  `mealtime_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `mealtime_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL DEFAULT '00:00:00',
  `end_time` time NOT NULL DEFAULT '23:59:59',
  `mealtime_status` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `validity` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'daily',
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `recurring_every` json DEFAULT NULL,
  `recurring_from` time DEFAULT NULL,
  `recurring_to` time DEFAULT NULL,
  PRIMARY KEY (`mealtime_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mealtimes`
--

LOCK TABLES `mealtimes` WRITE;
/*!40000 ALTER TABLE `mealtimes` DISABLE KEYS */;
INSERT INTO `mealtimes` VALUES (1,'Breakfast','07:00:00','10:00:00',1,'2026-07-27 11:24:05','2026-07-27 11:24:05','daily',NULL,NULL,NULL,NULL,NULL),(2,'Lunch','12:00:00','14:30:00',1,'2026-07-27 11:24:05','2026-07-27 11:24:05','daily',NULL,NULL,NULL,NULL,NULL),(3,'Dinner','18:00:00','20:00:00',1,'2026-07-27 11:24:05','2026-07-27 11:24:05','daily',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `mealtimes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_attachments`
--

DROP TABLE IF EXISTS `media_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `disk` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int unsigned NOT NULL,
  `tag` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_id` bigint unsigned DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '1',
  `custom_properties` text COLLATE utf8mb4_unicode_ci,
  `priority` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `media_attachments_attachment` (`attachment_type`,`attachment_id`),
  KEY `media_attachments_tag_index` (`tag`),
  KEY `idx_media_attachments_type_id_priority` (`attachment_type`,`attachment_id`,`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_attachments`
--

LOCK TABLES `media_attachments` WRITE;
/*!40000 ALTER TABLE `media_attachments` DISABLE KEYS */;
INSERT INTO `media_attachments` VALUES (1,'public','6a673ff3a3804799358654.jpg','slide.jpg','image/jpeg',748127,'images','sliders',1,1,'[]',1,'2026-07-27 11:24:35','2026-07-27 11:24:35');
/*!40000 ALTER TABLE `media_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_categories`
--

DROP TABLE IF EXISTS `menu_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_categories` (
  `menu_id` int unsigned NOT NULL,
  `category_id` int unsigned NOT NULL,
  UNIQUE KEY `menu_categories_menu_id_category_id_unique` (`menu_id`,`category_id`),
  KEY `menu_categories_menu_id_index` (`menu_id`),
  KEY `menu_categories_category_id_index` (`category_id`),
  KEY `idx_menu_categories_category_menu` (`category_id`,`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_categories`
--

LOCK TABLES `menu_categories` WRITE;
/*!40000 ALTER TABLE `menu_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_item_option_linked_values`
--

DROP TABLE IF EXISTS `menu_item_option_linked_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item_option_linked_values` (
  `menu_option_id` int unsigned NOT NULL,
  `menu_item_option_value_id` int unsigned NOT NULL,
  PRIMARY KEY (`menu_option_id`,`menu_item_option_value_id`),
  KEY `menu_item_option_linked_values_value_id_index` (`menu_item_option_value_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item_option_linked_values`
--

LOCK TABLES `menu_item_option_linked_values` WRITE;
/*!40000 ALTER TABLE `menu_item_option_linked_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_item_option_linked_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_item_option_values`
--

DROP TABLE IF EXISTS `menu_item_option_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item_option_values` (
  `menu_option_value_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_option_id` int NOT NULL,
  `option_value_id` int NOT NULL,
  `override_price` decimal(15,4) DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `is_default` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `free_quantity` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`menu_option_value_id`),
  KEY `idx_menu_item_option_values_menu_option` (`menu_option_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item_option_values`
--

LOCK TABLES `menu_item_option_values` WRITE;
/*!40000 ALTER TABLE `menu_item_option_values` DISABLE KEYS */;
INSERT INTO `menu_item_option_values` VALUES (1,1,9,0.0000,1,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(2,1,10,0.0000,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(3,2,7,0.0000,1,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(4,2,8,5.0000,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(5,3,4,4.9500,4,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(6,3,5,4.9500,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(7,3,6,6.9500,3,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(8,4,7,0.0000,1,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(9,4,8,5.0000,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(10,5,4,4.9500,4,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(11,5,5,4.9500,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(12,5,6,6.9500,3,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(13,6,7,0.0000,1,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(14,6,8,5.0000,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(15,7,7,0.0000,1,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(16,7,8,5.0000,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(17,8,4,4.9500,4,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(18,8,5,4.9500,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(19,8,6,6.9500,3,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(20,9,9,0.0000,1,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(21,9,10,0.0000,2,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07',0);
/*!40000 ALTER TABLE `menu_item_option_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_item_options`
--

DROP TABLE IF EXISTS `menu_item_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_item_options` (
  `menu_option_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `option_id` int NOT NULL,
  `menu_id` int NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `priority` int NOT NULL DEFAULT '0',
  `min_selected` int NOT NULL DEFAULT '0',
  `max_selected` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `free_quantity` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`menu_option_id`),
  KEY `idx_menu_item_options_menu` (`menu_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_item_options`
--

LOCK TABLES `menu_item_options` WRITE;
/*!40000 ALTER TABLE `menu_item_options` DISABLE KEYS */;
INSERT INTO `menu_item_options` VALUES (1,4,1,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(2,3,2,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(3,2,3,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(4,3,3,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(5,2,4,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(6,3,4,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(7,3,5,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(8,2,10,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0),(9,4,10,0,0,0,0,'2026-07-27 11:24:07','2026-07-27 11:24:07',0);
/*!40000 ALTER TABLE `menu_item_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_mealtimes`
--

DROP TABLE IF EXISTS `menu_mealtimes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_mealtimes` (
  `menu_id` int unsigned NOT NULL,
  `mealtime_id` int unsigned NOT NULL,
  UNIQUE KEY `menu_mealtimes_menu_id_mealtime_id_unique` (`menu_id`,`mealtime_id`),
  KEY `menu_mealtimes_menu_id_index` (`menu_id`),
  KEY `menu_mealtimes_mealtime_id_index` (`mealtime_id`),
  KEY `idx_menu_mealtimes_menu_mealtime` (`menu_id`,`mealtime_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_mealtimes`
--

LOCK TABLES `menu_mealtimes` WRITE;
/*!40000 ALTER TABLE `menu_mealtimes` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_mealtimes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_option_values`
--

DROP TABLE IF EXISTS `menu_option_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_option_values` (
  `option_value_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `option_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(15,4) DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`option_value_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_option_values`
--

LOCK TABLES `menu_option_values` WRITE;
/*!40000 ALTER TABLE `menu_option_values` DISABLE KEYS */;
INSERT INTO `menu_option_values` VALUES (1,1,'Peperoni',1.9900,2),(2,1,'Jalapenos',3.9900,1),(3,1,'Sweetcorn',1.9900,3),(4,2,'Meat',4.9500,4),(5,2,'Fish',4.9500,2),(6,2,'Beef',6.9500,3),(7,3,'Small',0.0000,1),(8,3,'Large',5.0000,2),(9,4,'Coke',0.0000,1),(10,4,'Diet Coke',0.0000,2);
/*!40000 ALTER TABLE `menu_option_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_options`
--

DROP TABLE IF EXISTS `menu_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_options` (
  `option_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `option_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`option_id`),
  KEY `idx_menu_options_option` (`option_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_options`
--

LOCK TABLES `menu_options` WRITE;
/*!40000 ALTER TABLE `menu_options` DISABLE KEYS */;
INSERT INTO `menu_options` VALUES (1,'Toppings','checkbox',0,'2026-07-27 11:24:06','2026-07-27 11:24:06'),(2,'Sides','select',0,'2026-07-27 11:24:06','2026-07-27 11:24:06'),(3,'Size','radio',0,'2026-07-27 11:24:06','2026-07-27 11:24:06'),(4,'Drinks','quantity',0,'2026-07-27 11:24:06','2026-07-27 11:24:06');
/*!40000 ALTER TABLE `menu_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus`
--

DROP TABLE IF EXISTS `menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus` (
  `menu_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `menu_description` text COLLATE utf8mb4_unicode_ci,
  `menu_price` decimal(15,4) NOT NULL,
  `minimum_qty` int NOT NULL DEFAULT '0',
  `menu_status` tinyint(1) NOT NULL,
  `menu_priority` int NOT NULL DEFAULT '0',
  `order_restriction` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`menu_id`),
  KEY `idx_menus_status` (`menu_status`),
  KEY `idx_menus_status_priority` (`menu_status`,`menu_priority`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus`
--

LOCK TABLES `menus` WRITE;
/*!40000 ALTER TABLE `menus` DISABLE KEYS */;
INSERT INTO `menus` VALUES (1,'Puff-Puff','Traditional Nigerian donut ball, rolled in sugar',4.9900,3,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(2,'SCOTCH EGG','Boiled egg wrapped in a ground meat mixture, coated in breadcrumbs, and deep-fried.',2.0000,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(3,'ATA RICE','Small pieces of beef, goat, stipe, and tendon sautéed in crushed green Jamaican pepper.',12.0000,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(4,'RICE AND DODO','(plantains) w/chicken, fish, beef or goat',11.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(5,'Special Shrimp Deluxe','Fresh shrimp sautéed in blended mixture of tomatoes, onion, peppers over choice of rice',12.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(6,'Whole catfish with rice and vegetables','Whole catfish slow cooked in tomatoes, pepper and onion sauce with seasoning to taste',13.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(7,'African Salad','With baked beans, egg, tuna, onion, tomatoes , green peas and carrot with your choice of dressing.',8.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(8,'Seafood Salad','With shrimp, egg and imitation crab meat',5.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(9,'EBA','Grated cassava',11.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(10,'AMALA','Yam flour',11.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(11,'YAM PORRIDGE','in tomatoes sauce',9.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07'),(12,'Boiled Plantain','w/spinach soup',9.9900,1,1,0,NULL,'2026-07-27 11:24:07','2026-07-27 11:24:07');
/*!40000 ALTER TABLE `menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus_specials`
--

DROP TABLE IF EXISTS `menus_specials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus_specials` (
  `special_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_id` int NOT NULL DEFAULT '0',
  `start_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `special_price` decimal(15,4) DEFAULT NULL,
  `special_status` tinyint(1) NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `validity` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recurring_every` text COLLATE utf8mb4_unicode_ci,
  `recurring_from` time DEFAULT NULL,
  `recurring_to` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`special_id`),
  UNIQUE KEY `menus_specials_special_id_menu_id_unique` (`special_id`,`menu_id`),
  KEY `idx_menus_specials_menu_special` (`menu_id`,`special_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus_specials`
--

LOCK TABLES `menus_specials` WRITE;
/*!40000 ALTER TABLE `menus_specials` DISABLE KEYS */;
/*!40000 ALTER TABLE `menus_specials` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2014_10_12_000000_create_users_table',1),(2,'2014_10_12_100000_create_password_resets_table',1),(3,'2019_08_19_000000_create_failed_jobs_table',1),(4,'2019_12_14_000001_create_personal_access_tokens_table',1),(5,'igniter.system::2015_03_25_000001_create_tables',2),(6,'igniter.system::2016_11_29_000300_optimize_tables_columns',2),(7,'igniter.system::2017_04_13_000300_modify_columns_on_users_and_customers_tables',2),(8,'igniter.system::2017_05_08_000300_add_columns',2),(9,'igniter.system::2017_06_11_000300_create_payments_and_payment_logs_table',2),(10,'igniter.system::2017_08_23_000300_create_themes_table',2),(11,'igniter.system::2018_01_23_000300_create_language_translations_table',2),(12,'igniter.system::2018_03_30_000300_create_extension_settings_table',2),(13,'igniter.system::2018_06_12_000300_rename_model_class_names_to_morph_map_custom_names',2),(14,'igniter.system::2018_10_19_000300_create_media_attachments_table',2),(15,'igniter.system::2019_04_16_000300_nullify_customer_id_on_addresses_table',2),(16,'igniter.system::2019_07_01_000300_delete_unused_columns_from_activities_table',2),(17,'igniter.system::2019_07_22_000300_add_user_type_column_to_activities_table',2),(18,'igniter.system::2019_07_30_000300_create_mail_partials_table',2),(19,'igniter.system::2020_02_05_000300_delete_stale_unused_table',2),(20,'igniter.system::2020_04_16_000300_drop_stale_unused_columns',2),(21,'igniter.system::2020_05_24_000300_create_request_logs_table',2),(22,'igniter.system::2021_09_06_010000_add_timestamps_to_tables',2),(23,'igniter.system::2021_10_22_010000_make_primary_key_bigint_all_tables',2),(24,'igniter.system::2022_04_20_000300_add_version_column_to_languages_table',2),(25,'igniter.system::2022_05_14_000300_update_class_view_lang_namespaces',2),(26,'igniter.system::2022_06_30_010000_drop_foreign_key_constraints_on_all_tables',2),(27,'igniter.system::2023_02_24_000300_drop_activities_table',2),(28,'igniter.system::2023_03_05_123125_create_notifications_table',2),(29,'igniter.system::2023_04_23_000300_reduce_column_key_size_language_translations_table',2),(30,'igniter.system::2023_04_24_000300_nullable_layout_id_column_mail_layouts_table',2),(31,'igniter.system::2023_05_20_000300_add_is_default_column_locations_countries_currencies_customer_groups_languages_tables',2),(32,'igniter.system::2025_03_29_164243_remove_deprecated_code_from_mail_layouts',2),(33,'igniter.system::2025_05_04_000300_increase_version_column_length_languages_table',2),(34,'igniter.system::2025_05_11_000300_fix_renamed_mail_templates_table',2),(35,'igniter.system::2025_11_15_165912_add_indexes',2),(36,'igniter.admin::2017_08_25_000300_create_location_areas_table',3),(37,'igniter.admin::2017_08_25_000300_create_menu_categories_table',3),(38,'igniter.admin::2018_01_19_000300_add_hash_columns_on_orders_reservations_table',3),(39,'igniter.admin::2018_04_06_000300_drop_unique_on_order_totals_table',3),(40,'igniter.admin::2018_04_12_000300_modify_columns_on_orders_reservations_table',3),(41,'igniter.admin::2018_05_21_000300_drop_redundant_columns_on_kitchen_tables',3),(42,'igniter.admin::2018_05_29_000300_add_columns_on_location_areas_table',3),(43,'igniter.admin::2018_06_12_000300_create_locationables_table',3),(44,'igniter.admin::2018_07_04_000300_create_user_preferences_table',3),(45,'igniter.admin::2018_10_09_000300_auto_increment_on_order_totals_table',3),(46,'igniter.admin::2019_04_09_000300_auto_increment_on_user_preferences_table',3),(47,'igniter.admin::2019_07_02_000300_add_columns_on_menu_specials_table',3),(48,'igniter.admin::2019_07_16_000300_create_reservation_tables_table',3),(49,'igniter.admin::2019_07_21_000300_change_sort_value_ratings_to_config_on_settings_table',3),(50,'igniter.admin::2019_11_08_000300_add_selected_columns_to_menu_options_table',3),(51,'igniter.admin::2020_02_18_000400_create_staffs_groups_and_locations_table',3),(52,'igniter.admin::2020_02_21_000400_create_staff_roles_table',3),(53,'igniter.admin::2020_02_22_000300_remove_add_columns_on_staff_staff_groups_table',3),(54,'igniter.admin::2020_02_25_000300_create_assignable_logs_table',3),(55,'igniter.admin::2020_03_18_000300_add_quantity_column_to_order_menu_options_table',3),(56,'igniter.admin::2020_04_05_000300_create_payment_profiles_table',3),(57,'igniter.admin::2020_04_16_000300_drop_stale_unused_columns',3),(58,'igniter.admin::2020_05_31_000300_drop_more_unused_columns',3),(59,'igniter.admin::2020_06_11_000300_create_menu_mealtimes_table',3),(60,'igniter.admin::2020_08_16_000300_modify_columns_on_tables_reservations_table',3),(61,'igniter.admin::2020_08_18_000300_create_allergens_table',3),(62,'igniter.admin::2020_09_28_000300_add_refund_columns_to_payment_logs_table',3),(63,'igniter.admin::2020_12_13_000300_merge_staffs_locations_into_locationables_table',3),(64,'igniter.admin::2020_12_22_000300_add_priority_column_to_location_areas_table',3),(65,'igniter.admin::2021_01_04_000300_add_update_related_column_to_menu_options_table',3),(66,'igniter.admin::2021_01_04_010000_add_order_time_is_asap_on_orders_table',3),(67,'igniter.admin::2021_04_23_010000_remove_unused_columns',3),(68,'igniter.admin::2021_05_26_010000_alter_order_type_columns',3),(69,'igniter.admin::2021_05_29_010000_add_is_summable_on_order_totals_table',3),(70,'igniter.admin::2021_07_20_010000_add_columns_default_value',3),(71,'igniter.admin::2021_09_03_010000_make_serialize_columns_json',3),(72,'igniter.admin::2021_09_06_010000_add_timestamps_to_tables',3),(73,'igniter.admin::2021_10_22_010000_make_primary_key_bigint_all_tables',3),(74,'igniter.admin::2021_11_28_000300_create_stocks_table',3),(75,'igniter.admin::2022_02_03_000300_rename_allergens_to_ingredients_table',3),(76,'igniter.admin::2022_02_07_010000_add_low_stock_alerted_on_stocks_table',3),(77,'igniter.admin::2022_02_17_000300_merge_staffs_into_users_table',3),(78,'igniter.admin::2022_04_27_000300_create_location_options_table',3),(79,'igniter.admin::2022_05_10_000300_add_primary_key_to_working_hours_table',3),(80,'igniter.admin::2022_06_10_030300_prefix_users_tables_with_admin_table',3),(81,'igniter.admin::2022_06_30_010000_drop_foreign_key_constraints_on_all_tables',3),(82,'igniter.admin::2022_09_03_000300_make_location_options_fields_unique',3),(83,'igniter.admin::2022_10_26_000300_make_code_field_unique_mail_layouts_partials_table',3),(84,'igniter.admin::2022_11_03_003000_merge_menu_item_options_tables',3),(85,'igniter.admin::2023_01_10_000400_add_delivery_comment_orders_table',3),(86,'igniter.admin::2023_05_22_000400_add_invited_at_activated_at_orders_table',3),(87,'igniter.admin::2023_06_06_000400_update_dashboard_widget_properties_on_user_preferences_table',3),(88,'igniter.admin::2023_07_01_000300_create_location_settings',3),(89,'igniter.admin::2023_07_01_000400_copy_location_options_to_settings',3),(90,'igniter.admin::2025_11_15_165912_add_indexes',3),(91,'igniter.api::2018_10_12_000300_create_resources_table',4),(92,'igniter.api::2020_04_27_000300_update_class_names_api_resources_table',4),(93,'igniter.api::2020_05_18_000300_create_access_tokens_table',4),(94,'igniter.api::2020_11_11_000300_alter_resources_table',4),(95,'igniter.api::2021_11_18_010000_make_primary_key_bigint_all_tables',4),(96,'igniter.api::2023_06_15_010000_drop_controller_resources_table',4),(97,'igniter.automation::2018_10_01_000100_create_all_tables',5),(98,'igniter.automation::2020_11_08_000300_create_task_log_table',5),(99,'igniter.automation::2021_11_18_010000_make_primary_key_bigint_all_tables',5),(100,'igniter.automation::2021_11_18_010300_add_foreign_key_constraints_to_tables',5),(101,'igniter.automation::2022_06_30_010000_drop_foreign_key_constraints',5),(102,'igniter.cart::2017_10_20_000100_create_conditions_settings',6),(103,'igniter.cart::2017_11_20_010000_create_cart_table',6),(104,'igniter.cart::2018_09_20_010000_rename_content_field_on_cart_table',6),(105,'igniter.cart::2025_05_22_010000_make_menu_description_nullable_table',6),(106,'igniter.cart::2025_07_08_010000_add_start_end_date_mealtimes_table',6),(107,'igniter.cart::2025_11_15_165912_add_indexes',6),(108,'igniter.cart::2026_02_27_010000_add_out_of_stock_override_to_stocks_table',6),(109,'igniter.cart::2026_06_20_010000_create_menu_item_option_linked_values_table',6),(110,'igniter.cart::2026_07_11_010000_add_free_quantity_to_menu_tables',6),(111,'igniter.coupons::2020_09_17_000300_create_coupons_table_or_rename',7),(112,'igniter.coupons::2020_09_18_000300_create_coupon_relations_tables',7),(113,'igniter.coupons::2020_10_15_000300_create_cart_restriction',7),(114,'igniter.coupons::2020_11_01_000300_add_auto_apply_field_on_coupons_table',7),(115,'igniter.coupons::2021_02_22_000300_increase_coupon_code_character_limit',7),(116,'igniter.coupons::2021_05_26_010000_alter_order_restriction_column',7),(117,'igniter.coupons::2021_09_06_010000_add_timestamps_to_coupons',7),(118,'igniter.coupons::2021_11_18_010000_make_primary_key_bigint_all_tables',7),(119,'igniter.coupons::2021_11_18_010300_add_foreign_key_constraints_to_tables',7),(120,'igniter.coupons::2022_06_30_010000_drop_foreign_key_constraints',7),(121,'igniter.coupons::2023_06_03_010000_set_nullable_columns',7),(122,'igniter.coupons::2023_09_28_010000_create_coupon_customer_groups_tables',7),(123,'igniter.coupons::2023_10_19_010000_change_is_limited_to_cart_item_to_apply_coupon_on_enum',7),(124,'igniter.coupons::2025_11_21_010000_add_min_menu_quantity',7),(125,'igniter.frontend::2018_01_28_000300_create_subscribers_table',8),(126,'igniter.frontend::2018_06_28_000300_create_banners_table',8),(127,'igniter.frontend::2019_11_02_000300_create_sliders_table',8),(128,'igniter.frontend::2021_10_20_000300_rename_banners_table',8),(129,'igniter.frontend::2021_11_18_010000_make_primary_key_bigint_all_tables',8),(130,'igniter.frontend::2021_11_18_010300_add_foreign_key_constraints_to_tables',8),(131,'igniter.frontend::2022_06_30_010000_drop_foreign_key_constraints',8),(132,'igniter.frontend::2024_02_28_010000_add_code_banners_table',8),(133,'igniter.local::2020_09_17_000300_create_reviews_table_or_rename',9),(134,'igniter.local::2020_12_10_000300_update_reviews_table',9),(135,'igniter.local::2021_01_02_000300_add_last_location_area_customers_table',9),(136,'igniter.local::2021_09_06_010000_add_timestamps_to_reviews',9),(137,'igniter.local::2021_11_18_010000_make_primary_key_bigint_all_tables',9),(138,'igniter.local::2024_06_04_010000_rename_sale_type_sale_id_reviews',9),(139,'igniter.local::2025_11_15_165912_add_indexes',9),(140,'igniter.pages::2018_06_28_000300_create_pages_table',10),(141,'igniter.pages::2019_11_28_000300_create_menus_table',10),(142,'igniter.pages::2019_11_28_000400_alter_columns_on_pages_table',10),(143,'igniter.pages::2021_03_31_000300_seed_menus_table',10),(144,'igniter.pages::2021_09_06_010000_add_timestamps_to_pages',10),(145,'igniter.pages::2021_10_20_010000_add_foreign_key_constraints_to_tables',10),(146,'igniter.pages::2022_09_16_010000_change_page_content_to_medium_text',10),(147,'igniter.pages::2023_01_28_010000_make_page_id_incremental',10),(148,'igniter.payregister::2021_05_08_000300_seed_default_payment_gateways',11),(149,'igniter.reservation::2022_09_15_000300_create_dining_areas_sections_tables_add_columns_table',12),(150,'igniter.reservation::2023_07_01_000500_copy_location_options_to_settings',12),(151,'igniter.reservation::2025_03_29_164012_remove_table_id_foreign_key',12),(152,'igniter.reservation::2025_04_03_164012_make_telephone_on_reservations_nullable',12),(153,'igniter.reservation::2025_05_15_164012_make_telephone_on_reservations_string',12),(154,'igniter.reservation::2025_08_30_164012_make_status_id_on_reservations_integer',12),(155,'igniter.reservation::2025_10_03_000000_add_indexes_to_dining_tables_and_areas',12),(156,'igniter.socialite::2018_10_11_211028_create_socialite_providers_table',13),(157,'igniter.socialite::2022_02_04_211028_add_user_type_column_socialite_providers_table',13),(158,'igniter.socialite::2022_06_14_211028_increase_string_length',13),(159,'igniter.user::2024_05_30_000400_add_user_id_assignable_logs',14),(160,'igniter.user::2025_04_04_000400_make_password_nullable_on_admin_users_customers',14),(161,'igniter.user::2025_06_01_000400_add_telephone_column_on_users',14),(162,'igniter.user::2025_11_15_165912_add_indexes',14);
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
  `notifiable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint unsigned NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable` (`notifiable_type`,`notifiable_id`),
  KEY `idx_notifications_notifiable_read` (`notifiable_type`,`notifiable_id`,`read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('29d1da40-74c7-4c25-8bd9-5f0dd9319d14','status-updated','customers',5,'{\"title\":\"Order status updated\",\"icon\":\"fa-clipboard-check\",\"iconColor\":null,\"url\":\"http:\\/\\/localhost:8080\\/admin\\/orders\\/edit\\/4\",\"message\":\"System updated order (#4) status to <b>Received<\\/b>\"}',NULL,'2026-08-06 13:47:16','2026-08-06 13:47:16'),('3513574c-ca89-4227-aea3-29ea3173cb72','status-updated','customers',4,'{\"title\":\"Order status updated\",\"icon\":\"fa-clipboard-check\",\"iconColor\":null,\"url\":\"http:\\/\\/localhost:8080\\/admin\\/orders\\/edit\\/3\",\"message\":\"System updated order (#3) status to <b>Received<\\/b>\"}',NULL,'2026-08-06 13:46:15','2026-08-06 13:46:15');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_menu_options`
--

DROP TABLE IF EXISTS `order_menu_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_menu_options` (
  `order_option_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `order_option_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_option_price` decimal(15,4) DEFAULT NULL,
  `order_menu_id` int NOT NULL,
  `menu_option_id` int NOT NULL,
  `menu_option_value_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `free_qty` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`order_option_id`),
  KEY `idx_ti_order_menu_options_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_menu_options`
--

LOCK TABLES `order_menu_options` WRITE;
/*!40000 ALTER TABLE `order_menu_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_menu_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_menus`
--

DROP TABLE IF EXISTS `order_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_menus` (
  `order_menu_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(15,4) DEFAULT NULL,
  `subtotal` decimal(15,4) DEFAULT NULL,
  `option_values` text COLLATE utf8mb4_unicode_ci,
  `comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`order_menu_id`),
  KEY `idx_ti_order_menus_order` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_menus`
--

LOCK TABLES `order_menus` WRITE;
/*!40000 ALTER TABLE `order_menus` DISABLE KEYS */;
INSERT INTO `order_menus` VALUES (1,2,1,'Puff-Puff',1,4.9900,4.9900,'s:6:\"a:0:{}\";',NULL),(2,3,1,'Puff-Puff',1,4.9900,4.9900,'s:6:\"a:0:{}\";',NULL),(3,4,1,'Puff-Puff',1,4.9900,4.9900,'s:6:\"a:0:{}\";',NULL);
/*!40000 ALTER TABLE `order_menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_totals`
--

DROP TABLE IF EXISTS `order_totals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_totals` (
  `order_total_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int unsigned NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(15,4) NOT NULL,
  `priority` tinyint(1) NOT NULL DEFAULT '0',
  `is_summable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`order_total_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_totals`
--

LOCK TABLES `order_totals` WRITE;
/*!40000 ALTER TABLE `order_totals` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_totals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(96) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_id` int NOT NULL,
  `address_id` int DEFAULT NULL,
  `cart` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_items` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `payment` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `order_time` time NOT NULL,
  `order_date` date NOT NULL,
  `order_total` decimal(15,4) DEFAULT NULL,
  `status_id` int NOT NULL,
  `ip_address` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignee_id` int DEFAULT NULL,
  `assignee_group_id` int unsigned DEFAULT NULL,
  `invoice_prefix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_date` datetime DEFAULT NULL,
  `hash` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed` tinyint(1) DEFAULT NULL,
  `status_updated_at` datetime DEFAULT NULL,
  `assignee_updated_at` datetime DEFAULT NULL,
  `order_time_is_asap` tinyint(1) NOT NULL DEFAULT '0',
  `delivery_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`order_id`),
  KEY `orders_hash_index` (`hash`),
  KEY `idx_ti_orders_location_date_status` (`location_id`,`order_date`,`status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,2,'Verify','Customer','api-verified-20260806124152@example.test','+15550100001',1,NULL,'',0,NULL,'cod','collection','2026-08-06 13:42:08','2026-08-06 13:42:08','00:00:00','0000-00-00',NULL,0,'192.168.65.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875',NULL,NULL,NULL,NULL,'21a92d3f64d69603e9077feecb417a00',NULL,NULL,NULL,0,NULL),(2,3,'Order','Check','api-order-20260806124348@example.test','+15550100002',1,NULL,'',0,NULL,'cod','collection','2026-08-06 13:43:57','2026-08-06 13:43:57','00:00:00','0000-00-00',NULL,0,'192.168.65.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875',NULL,NULL,NULL,NULL,'41dfb8ffc7234074c203e039b48c932d',NULL,NULL,NULL,0,NULL),(3,4,'Final','Check','api-final-20260806124518@example.test','+15550100003',1,NULL,'',1,NULL,'cod','collection','2026-08-06 13:45:27','2026-08-06 13:45:27','00:00:00','0000-00-00',NULL,1,'192.168.65.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875',NULL,NULL,NULL,NULL,'971612fbe9effa37ce86c4d8b62d61b3',NULL,'2026-08-06 13:45:27',NULL,0,NULL),(4,5,'Complete','Check','api-complete-20260806124704@example.test','+15550100004',1,NULL,'',1,NULL,'cod','collection','2026-08-06 13:47:11','2026-08-06 13:47:12','00:00:00','0000-00-00',NULL,1,'192.168.65.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875',NULL,NULL,NULL,NULL,'fa8c079783f66d01eb48d81bff3c8339',NULL,'2026-08-06 13:47:12',NULL,0,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `page_id` int NOT NULL AUTO_INCREMENT,
  `language_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_keywords` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `status` tinyint(1) NOT NULL,
  `permalink_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `layout` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` mediumtext COLLATE utf8mb4_unicode_ci,
  `priority` int DEFAULT NULL,
  PRIMARY KEY (`page_id`),
  KEY `pages_language_id_foreign` (`language_id`),
  CONSTRAINT `pages_language_id_foreign` FOREIGN KEY (`language_id`) REFERENCES `languages` (`language_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT INTO `pages` VALUES (1,1,'About Us','Lorem ipsum dolor sit amet, consectetur adipiscing elit.','','','2026-07-27 11:24:45','2026-07-27 11:24:45',1,'about-us','static','{\"navigation\":\"0\"}',NULL),(2,1,'Policy','Lorem ipsum dolor sit amet, consectetur adipiscing elit.','','','2026-07-27 11:24:45','2026-07-27 11:24:45',1,'policy','static','{\"navigation\":\"0\"}',NULL),(3,1,'Terms and Conditions','Lorem ipsum dolor sit amet, consectetur adipiscing elit.','','','2026-07-27 11:24:45','2026-07-27 11:24:45',1,'terms-and-conditions','static','{\"navigation\":\"0\"}',NULL);
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  KEY `password_resets_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_logs`
--

DROP TABLE IF EXISTS `payment_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_logs` (
  `payment_log_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `payment_name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request` text COLLATE utf8mb4_unicode_ci,
  `response` text COLLATE utf8mb4_unicode_ci,
  `is_success` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `payment_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_refundable` tinyint(1) NOT NULL DEFAULT '0',
  `refunded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`payment_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_logs`
--

LOCK TABLES `payment_logs` WRITE;
/*!40000 ALTER TABLE `payment_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_profiles`
--

DROP TABLE IF EXISTS `payment_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_profiles` (
  `payment_profile_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int unsigned DEFAULT NULL,
  `payment_id` int unsigned DEFAULT NULL,
  `card_brand` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_last4` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_data` text COLLATE utf8mb4_unicode_ci,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`payment_profile_id`),
  KEY `payment_profiles_customer_id_index` (`customer_id`),
  KEY `payment_profiles_payment_id_index` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_profiles`
--

LOCK TABLES `payment_profiles` WRITE;
/*!40000 ALTER TABLE `payment_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `data` json NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `priority` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `payments_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,'Cash On Delivery','cod','Igniter\\PayRegister\\Payments\\Cod','Pay with cash when you pick up your order or when is delivered','[]',1,1,1,'2026-07-27 11:24:49','2026-07-27 11:24:49'),(2,'PayPal Express','paypalexpress','Igniter\\PayRegister\\Payments\\PaypalExpress','Securely pay using your PayPal account','[]',0,0,2,'2026-07-27 11:24:49','2026-07-27 11:24:49'),(3,'Authorize.Net (AIM)','authorizenetaim','Igniter\\PayRegister\\Payments\\AuthorizeNetAim','Pay with your credit card via Authorize.Net','[]',0,0,3,'2026-07-27 11:24:49','2026-07-27 11:24:49'),(4,'Stripe Payment','stripe','Igniter\\PayRegister\\Payments\\Stripe','Pay with your credit card using Stripe','[]',0,0,4,'2026-07-27 11:24:49','2026-07-27 11:24:49'),(5,'Mollie Payment','mollie','Igniter\\PayRegister\\Payments\\Mollie','Pay with your credit card through Mollie','[]',0,0,5,'2026-07-27 11:24:49','2026-07-27 11:24:49'),(6,'Square Payment','square','Igniter\\PayRegister\\Payments\\Square','Pay with your credit card using Square','[]',0,0,6,'2026-07-27 11:24:49','2026-07-27 11:24:49');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
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
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
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
-- Table structure for table `request_logs`
--

DROP TABLE IF EXISTS `request_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_code` int DEFAULT NULL,
  `referrer` text COLLATE utf8mb4_unicode_ci,
  `count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_logs`
--

LOCK TABLES `request_logs` WRITE;
/*!40000 ALTER TABLE `request_logs` DISABLE KEYS */;
INSERT INTO `request_logs` VALUES (1,'http://localhost:8080/favicon.ico',404,'[\"http:\\/\\/localhost:8080\\/admin\\/themes\\/edit\\/igniter-orange\"]',1,'2026-07-27 12:41:26','2026-07-27 12:41:26');
/*!40000 ALTER TABLE `request_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_tables`
--

DROP TABLE IF EXISTS `reservation_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_tables` (
  `reservation_id` int unsigned NOT NULL,
  `dining_table_id` bigint unsigned DEFAULT NULL,
  `table_id` int unsigned NOT NULL,
  UNIQUE KEY `reservation_dining_table_unique` (`reservation_id`,`dining_table_id`),
  KEY `reservation_id_index` (`reservation_id`),
  KEY `table_id_index` (`table_id`),
  KEY `idx_reservation_tables_res_table` (`reservation_id`,`dining_table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_tables`
--

LOCK TABLES `reservation_tables` WRITE;
/*!40000 ALTER TABLE `reservation_tables` DISABLE KEYS */;
INSERT INTO `reservation_tables` VALUES (1,1,0),(2,1,0),(3,1,0);
/*!40000 ALTER TABLE `reservation_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `reservation_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` int NOT NULL,
  `table_id` int NOT NULL,
  `guest_num` int NOT NULL,
  `occasion_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(96) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `reserve_time` time NOT NULL,
  `reserve_date` date NOT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `assignee_id` int DEFAULT NULL,
  `assignee_group_id` int unsigned DEFAULT NULL,
  `notify` tinyint(1) DEFAULT NULL,
  `ip_address` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_id` bigint unsigned DEFAULT NULL,
  `hash` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `processed` tinyint(1) DEFAULT NULL,
  `status_updated_at` datetime DEFAULT NULL,
  `assignee_updated_at` datetime DEFAULT NULL,
  `reserve_datetime` datetime GENERATED ALWAYS AS (addtime(`reserve_date`,`reserve_time`)) STORED,
  PRIMARY KEY (`reservation_id`),
  KEY `reservations_location_id_table_id_index` (`location_id`,`table_id`),
  KEY `reservations_hash_index` (`hash`),
  KEY `idx_reservations_datetime` (`reserve_datetime`),
  KEY `idx_reservations_time_filter` (`location_id`,`status_id`,`reserve_date`,`reserve_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` (`reservation_id`, `location_id`, `table_id`, `guest_num`, `occasion_id`, `customer_id`, `first_name`, `last_name`, `email`, `telephone`, `comment`, `reserve_time`, `reserve_date`, `created_at`, `updated_at`, `assignee_id`, `assignee_group_id`, `notify`, `ip_address`, `user_agent`, `status_id`, `hash`, `duration`, `processed`, `status_updated_at`, `assignee_updated_at`) VALUES (1,1,0,2,NULL,2,'Verify','Customer','api-verified-20260806124152@example.test','+15550100001','Automated local integration verification','18:30:00','2026-12-10','2026-08-06 00:00:00','2026-08-06 00:00:00',NULL,NULL,NULL,'192.168.65.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875',0,'62f8ef43cc7a53144fb3c813ed3e990b',NULL,NULL,NULL,NULL),(2,1,0,2,NULL,4,'Final','Check','api-final-20260806124518@example.test','+15550100003','Final local integration verification','18:30:00','2026-12-11','2026-08-06 00:00:00','2026-08-06 00:00:00',NULL,NULL,NULL,'192.168.65.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875',0,'b710a55867139a0ec410e06f8a9bcc69',NULL,NULL,NULL,NULL),(3,1,0,2,NULL,5,'Complete','Check','api-complete-20260806124704@example.test','+15550100004','Complete local integration verification','18:30:00','2026-12-12','2026-08-06 00:00:00','2026-08-06 00:00:00',NULL,NULL,NULL,'192.168.65.1','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8875',6,'8e76142115db3d39793ea9aac4390eb3',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `setting_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sort` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `serialized` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `settings_sort_item_unique` (`sort`,`item`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'config','site_logo','no_photo.png',NULL),(2,'config','timezone','Europe/London',NULL),(3,'config','detect_language','0',NULL),(4,'prefs','supported_languages','a:1:{i:0;s:2:\"en\";}',NULL),(5,'config','allow_registration','1',NULL),(6,'config','customer_group_id','11',NULL),(7,'config','registration_email','a:1:{i:0;s:8:\"customer\";}',NULL),(8,'config','order_email','a:2:{i:0;s:8:\"customer\";i:1;s:5:\"admin\";}',NULL),(9,'config','reservation_email','a:2:{i:0;s:8:\"customer\";i:1;s:5:\"admin\";}',NULL),(10,'config','maps_api_key','',NULL),(11,'config','distance_unit','mi',NULL),(12,'config','location_order','0',NULL),(13,'config','location_order_email','0',NULL),(14,'config','location_reserve_email','0',NULL),(15,'config','default_order_status','1',NULL),(16,'config','processing_order_status','a:3:{i:0;s:1:\"2\";i:1;s:1:\"3\";i:2;s:1:\"4\";}',NULL),(17,'config','completed_order_status','a:1:{i:0;s:1:\"5\";}',NULL),(18,'config','guest_order','1',NULL),(19,'config','default_reservation_status','8',NULL),(20,'config','confirmed_reservation_status','6',NULL),(21,'config','canceled_order_status','9',NULL),(22,'config','canceled_reservation_status','7',NULL),(23,'config','tax_mode','0',NULL),(24,'config','invoice_prefix','INV-{year}-00',NULL),(25,'config','protocol','log',NULL),(26,'config','smtp_host','smtp.mailgun.org',NULL),(27,'config','smtp_port','587',NULL),(28,'config','smtp_user','',NULL),(29,'config','smtp_pass','',NULL),(30,'config','log_threshold','1',NULL),(31,'config','permalink','1',NULL),(32,'config','maintenance_mode','0',NULL),(33,'config','maintenance_message','Site is under maintenance. Please check back later.',NULL),(34,'config','cache_mode','0',NULL),(35,'config','cache_time','0',NULL),(36,'prefs','default_themes','a:1:{s:4:\"main\";s:4:\"demo\";}',NULL),(37,'prefs','ti_setup','installed',NULL),(38,'config','site_name','Foodly',NULL),(39,'config','site_email','admin@admin.com',NULL),(40,'config','sender_name','Foodly',NULL),(41,'config','sender_email','admin@admin.com',NULL);
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_history`
--

DROP TABLE IF EXISTS `status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status_history` (
  `status_history_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `object_id` int NOT NULL,
  `object_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `status_id` int NOT NULL,
  `notify` tinyint(1) DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  PRIMARY KEY (`status_history_id`),
  KEY `idx_status_history_object_created` (`object_type`,`object_id`,`created_at`),
  KEY `idx_status_history_object_status` (`object_type`,`object_id`,`status_history_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_history`
--

LOCK TABLES `status_history` WRITE;
/*!40000 ALTER TABLE `status_history` DISABLE KEYS */;
INSERT INTO `status_history` VALUES (1,3,'orders',NULL,1,1,NULL,'2026-08-06 13:45:27','2026-08-06 13:45:27'),(2,4,'orders',NULL,1,1,NULL,'2026-08-06 13:47:11','2026-08-06 13:47:11');
/*!40000 ALTER TABLE `status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statuses`
--

DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statuses` (
  `status_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `status_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_comment` text COLLATE utf8mb4_unicode_ci,
  `notify_customer` tinyint(1) DEFAULT NULL,
  `status_for` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (1,'Received','Your order has been received.',1,'order','#686663','2026-07-27 11:24:06','2026-07-27 11:24:06'),(2,'Pending','Your order is pending',1,'order','#f0ad4e','2026-07-27 11:24:06','2026-07-27 11:24:06'),(3,'Preparation','Your order is in the kitchen',1,'order','#00c0ef','2026-07-27 11:24:06','2026-07-27 11:24:06'),(4,'Delivery','Your order will be with you shortly.',0,'order','#00a65a','2026-07-27 11:24:06','2026-07-27 11:24:06'),(5,'Completed','',0,'order','#00a65a','2026-07-27 11:24:06','2026-07-27 11:24:06'),(6,'Confirmed','Your table reservation has been confirmed.',0,'reservation','#00a65a','2026-07-27 11:24:06','2026-07-27 11:24:06'),(7,'Canceled','Your table reservation has been canceled.',0,'reservation','#dd4b39','2026-07-27 11:24:06','2026-07-27 11:24:06'),(8,'Pending','Your table reservation is pending.',1,'reservation','','2026-07-27 11:24:06','2026-07-27 11:24:06'),(9,'Canceled','',0,'order','#ea0b29','2026-07-27 11:24:06','2026-07-27 11:24:06');
/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_history`
--

DROP TABLE IF EXISTS `stock_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stock_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `state` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_history_stock_id_foreign` (`stock_id`),
  KEY `stock_history_order_id_foreign` (`order_id`),
  CONSTRAINT `stock_history_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stock_history_stock_id_foreign` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_history`
--

LOCK TABLES `stock_history` WRITE;
/*!40000 ALTER TABLE `stock_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocks`
--

DROP TABLE IF EXISTS `stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `stockable_id` bigint unsigned NOT NULL,
  `stockable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` bigint DEFAULT NULL,
  `low_stock_alert` tinyint(1) NOT NULL DEFAULT '0',
  `low_stock_threshold` int NOT NULL DEFAULT '0',
  `is_tracked` tinyint(1) NOT NULL DEFAULT '0',
  `out_of_stock_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `out_of_stock_until` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `low_stock_alert_sent` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_stocks_type_id` (`stockable_type`,`stockable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocks`
--

LOCK TABLES `stocks` WRITE;
/*!40000 ALTER TABLE `stocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `table_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_capacity` int NOT NULL,
  `max_capacity` int NOT NULL,
  `table_status` tinyint(1) NOT NULL,
  `extra_capacity` int NOT NULL DEFAULT '0',
  `is_joinable` tinyint(1) NOT NULL DEFAULT '1',
  `priority` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`table_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,'Table 1',2,9,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(2,'Table 2',3,12,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(3,'Table 3',5,10,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(4,'Table 4',3,7,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(5,'Table 5',4,7,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(6,'Table 6',2,12,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(7,'Table 7',2,9,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(8,'Table 8',5,10,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(9,'Table 9',3,6,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(10,'Table 10',5,12,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(11,'Table 11',5,12,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(12,'Table 12',2,7,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(13,'Table 13',2,12,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05'),(14,'Table 14',2,8,1,0,1,0,'2026-07-27 11:24:05','2026-07-27 11:24:05');
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `themes`
--

DROP TABLE IF EXISTS `themes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `themes` (
  `theme_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `version` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '0.0.1',
  `data` json NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`theme_id`),
  UNIQUE KEY `themes_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `themes`
--

LOCK TABLES `themes` WRITE;
/*!40000 ALTER TABLE `themes` DISABLE KEYS */;
INSERT INTO `themes` VALUES (1,'Orange Theme','igniter-orange','Free Modern, Responsive and Clean TastyIgniter Theme based on Livewire and Bootstrap.','v4.2.0','[]',1,1,NULL,'2026-07-27 13:08:34');
/*!40000 ALTER TABLE `themes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
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
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `working_hours`
--

DROP TABLE IF EXISTS `working_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `working_hours` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `location_id` bigint unsigned NOT NULL,
  `type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weekday` int NOT NULL,
  `opening_time` time NOT NULL,
  `closing_time` time NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `working_hours`
--

LOCK TABLES `working_hours` WRITE;
/*!40000 ALTER TABLE `working_hours` DISABLE KEYS */;
/*!40000 ALTER TABLE `working_hours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'tastyigniter'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-08 16:47:54
