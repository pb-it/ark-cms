-- MySQL dump 10.13  Distrib 8.0.35, for Linux (x86_64)
--
-- Host: localhost    Database: cms
-- ------------------------------------------------------
-- Server version	8.0.35-0ubuntu0.22.04.1
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `cms`
--

/*!40000 DROP DATABASE IF EXISTS `cms`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `cms` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `cms`;

--
-- Table structure for table `_change`
--

DROP TABLE IF EXISTS `_change`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_change` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `method` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `data` json DEFAULT NULL,
  `user` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_change`
--

LOCK TABLES `_change` WRITE;
/*!40000 ALTER TABLE `_change` DISABLE KEYS */;
INSERT INTO `_change` VALUES (1,'2023-11-23 11:30:05.510','PUT','_registry',NULL,'{\"key\": \"test\", \"value\": \"test\"}',1),(2,'2023-11-23 11:30:17.209','PUT','_model',8,'{\"name\": \"movie\", \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}]}',1),(3,'2023-11-23 11:30:23.410','POST','movie',1,'{\"name\": \"TestMovie\"}',1),(4,'2023-11-23 11:30:25.445','PUT','_model',9,'{\"name\": \"star\", \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}, {\"name\": \"gender\", \"options\": [{\"value\": \"male\"}, {\"value\": \"female\"}, {\"value\": \"other\"}], \"dataType\": \"enumeration\"}, {\"name\": \"movies\", \"model\": \"movie\", \"dataType\": \"relation\", \"multiple\": true}]}',1),(5,'2023-11-23 11:30:17.209','PUT','_model',8,'{\"name\": \"movie\", \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}, {\"name\": \"stars\", \"model\": \"star\", \"dataType\": \"relation\", \"multiple\": true}]}',1),(6,'2023-11-23 11:30:37.057','POST','star',1,'{\"name\": \"John Doe\", \"movies\": [1]}',1),(7,'2023-11-23 11:30:47.176','POST','star',2,'{\"name\": \"Jane Doe\"}',NULL),(8,'2023-11-23 11:31:06.442','POST','_user',2,'{\"email\": \"-\", \"roles\": [2], \"password\": \"$2b$10$lG7UOFs0.arFhB.bpHMk5e:$2b$10$lG7UOFs0.arFhB.bpHMk5eqBDNyMCqyHRLzLltYox2T3iJVb2DZOO\", \"username\": \"user\"}',1),(9,'2023-11-23 11:30:17.209','PUT','_model',8,'{\"name\": \"movie\", \"public\": true, \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}, {\"name\": \"stars\", \"model\": \"star\", \"dataType\": \"relation\", \"multiple\": true}]}',1),(10,'2023-11-23 11:30:17.209','PUT','_model',8,'{\"name\": \"movie\", \"public\": true, \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}, {\"name\": \"stars\", \"model\": \"star\", \"dataType\": \"relation\", \"multiple\": true}]}',1),(11,'2023-11-23 11:30:17.209','PUT','_model',8,'{\"name\": \"movie\", \"public\": true, \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}, {\"name\": \"stars\", \"model\": \"star\", \"dataType\": \"relation\", \"multiple\": true}]}',1);
/*!40000 ALTER TABLE `_change` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_extension`
--

DROP TABLE IF EXISTS `_extension`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_extension` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `name` varchar(255) NOT NULL,
  `archive` longblob,
  `client-extension` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `_extension_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_extension`
--

LOCK TABLES `_extension` WRITE;
/*!40000 ALTER TABLE `_extension` DISABLE KEYS */;
/*!40000 ALTER TABLE `_extension` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_model`
--

DROP TABLE IF EXISTS `_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_model` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `definition` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_model`
--

LOCK TABLES `_model` WRITE;
/*!40000 ALTER TABLE `_model` DISABLE KEYS */;
INSERT INTO `_model` VALUES (1,'2023-11-23 11:29:48.740','2023-11-23 11:29:48.740','{\"name\": \"_model\", \"options\": {\"increments\": true, \"timestamps\": true}, \"defaults\": {\"view\": {\"details\": \"title\"}, \"title\": \"name\"}, \"attributes\": [{\"name\": \"definition\", \"dataType\": \"json\"}, {\"name\": \"name\", \"hidden\": true, \"dataType\": \"string\", \"persistent\": false}], \"extensions\": {\"client\": \"function init() {\\n   this._prepareDataAction = function (data) {\\n      if (data[\'definition\'])\\n         data[\'name\'] = data[\'definition\'][\'name\'];\\n      return data;\\n   }\\n}\\n\\nexport { init };\"}}'),(2,'2023-11-23 11:29:48.750','2023-11-23 11:29:48.750','{\"name\": \"_change\", \"options\": {\"increments\": true, \"timestamps\": false}, \"attributes\": [{\"name\": \"timestamp\", \"dataType\": \"timestamp\", \"required\": true, \"defaultValue\": \"CURRENT_TIMESTAMP\"}, {\"name\": \"method\", \"view\": \"select\", \"options\": [{\"value\": \"PUT\"}, {\"value\": \"POST\"}, {\"value\": \"DELETE\"}], \"dataType\": \"enumeration\", \"bUseString\": true}, {\"name\": \"model\", \"dataType\": \"string\"}, {\"name\": \"record_id\", \"dataType\": \"integer\"}, {\"name\": \"data\", \"dataType\": \"json\"}, {\"name\": \"user\", \"model\": \"_user\", \"dataType\": \"relation\"}, {\"name\": \"title\", \"hidden\": true, \"dataType\": \"string\", \"persistent\": false}], \"extensions\": {\"client\": \"function init() {\\n   this._prepareDataAction = function (data) {\\n      var str = \\\"\\\";\\n      if (data[\'method\'])\\n         str += data[\'method\'] + \\\": \\\";\\n      if (data[\'model\'])\\n         str += data[\'model\'];\\n      if (data[\'record_id\'])\\n         str += \\\"(\\\" + data[\'record_id\'] + \\\")\\\";\\n      data[\'title\'] = str;\\n      return data;\\n   }\\n}\\n\\nexport { init };\"}, \"bConfirmFullFetch\": true}'),(3,'2023-11-23 11:29:48.826','2023-11-23 11:29:48.826','{\"name\": \"_registry\", \"options\": {\"increments\": false, \"timestamps\": false}, \"attributes\": [{\"name\": \"key\", \"length\": 63, \"unique\": true, \"primary\": true, \"dataType\": \"string\", \"required\": true}, {\"name\": \"value\", \"dataType\": \"text\"}]}'),(4,'2023-11-23 11:29:48.981','2023-11-23 11:29:48.981','{\"name\": \"_user\", \"options\": {\"increments\": true, \"timestamps\": true}, \"defaults\": {\"view\": {\"details\": \"title\"}, \"title\": \"username\"}, \"attributes\": [{\"name\": \"email\", \"length\": 320, \"unique\": true, \"dataType\": \"string\", \"required\": true}, {\"name\": \"username\", \"length\": 63, \"unique\": true, \"dataType\": \"string\", \"required\": true}, {\"name\": \"password\", \"length\": 96, \"dataType\": \"string\", \"required\": true}, {\"name\": \"roles\", \"model\": \"_role\", \"dataType\": \"relation\", \"multiple\": true}, {\"name\": \"last_login_at\", \"dataType\": \"timestamp\"}, {\"name\": \"last_password_change_at\", \"dataType\": \"timestamp\"}]}'),(5,'2023-11-23 11:29:49.135','2023-11-23 11:29:49.135','{\"name\": \"_role\", \"options\": {\"increments\": true, \"timestamps\": true}, \"defaults\": {\"view\": {\"details\": \"title\"}, \"title\": \"role\"}, \"attributes\": [{\"name\": \"role\", \"length\": 63, \"unique\": true, \"dataType\": \"string\", \"required\": true}, {\"name\": \"users\", \"model\": \"_user\", \"dataType\": \"relation\", \"multiple\": true}]}'),(6,'2023-11-23 11:29:49.614','2023-11-23 11:29:49.614','{\"name\": \"_permission\", \"options\": {\"increments\": true, \"timestamps\": true}, \"defaults\": {\"view\": {\"details\": \"title\"}, \"title\": \"title\"}, \"attributes\": [{\"name\": \"model\", \"model\": \"_model\", \"dataType\": \"relation\"}, {\"name\": \"role\", \"model\": \"_role\", \"dataType\": \"relation\"}, {\"name\": \"user\", \"model\": \"_user\", \"dataType\": \"relation\"}, {\"name\": \"read\", \"dataType\": \"boolean\", \"required\": true, \"defaultValue\": false}, {\"name\": \"write\", \"dataType\": \"boolean\", \"required\": true, \"defaultValue\": false}, {\"name\": \"title\", \"hidden\": true, \"dataType\": \"string\", \"persistent\": false}], \"extensions\": {\"client\": \"function init() {\\n   this._prepareDataAction = function (data) {\\n      var str = \\\"\\\";\\n      if (data[\'user\'])\\n         str += \\\"U(\\\" + data[\'user\'][\'username\'] + \\\")\\\";\\n      else if (data[\'role\'])\\n         str += \\\"G(\\\" + data[\'role\'][\'role\'] + \\\")\\\";\\n      if (data[\'model\'])\\n         str += \\\" - \\\" + data[\'model\'][\'definition\'][\'name\'] + \\\" - \\\";\\n      if (data[\'read\'])\\n\\t str += \\\"R\\\";\\n      if (data[\'write\'])\\n\\t str += \\\"W\\\";\\n      data[\'title\'] = str;\\n      return data;\\n   }\\n}\\n\\nexport { init };\"}}'),(7,'2023-11-23 11:29:49.960','2023-11-23 11:29:49.960','{\"name\": \"_extension\", \"options\": {\"increments\": true, \"timestamps\": true}, \"defaults\": {\"view\": {\"details\": \"title\"}, \"title\": \"name\"}, \"attributes\": [{\"name\": \"name\", \"unique\": \"true\", \"dataType\": \"string\", \"required\": true}, {\"name\": \"archive\", \"hidden\": true, \"length\": 16777216, \"storage\": \"blob\", \"dataType\": \"file\"}, {\"name\": \"client-extension\", \"dataType\": \"text\"}]}'),(8,'2023-11-23 11:30:17.209','2023-11-23 11:30:17.209','{\"name\": \"movie\", \"public\": true, \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}, {\"name\": \"stars\", \"model\": \"star\", \"dataType\": \"relation\", \"multiple\": true}]}'),(9,'2023-11-23 11:30:25.445','2023-11-23 11:30:25.445','{\"name\": \"star\", \"options\": {\"increments\": true, \"timestamps\": true}, \"attributes\": [{\"name\": \"name\", \"dataType\": \"string\"}, {\"name\": \"gender\", \"options\": [{\"value\": \"male\"}, {\"value\": \"female\"}, {\"value\": \"other\"}], \"dataType\": \"enumeration\"}, {\"name\": \"movies\", \"model\": \"movie\", \"dataType\": \"relation\", \"multiple\": true}]}');
/*!40000 ALTER TABLE `_model` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_permission`
--

DROP TABLE IF EXISTS `_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_permission` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `model` int DEFAULT NULL,
  `role` int DEFAULT NULL,
  `user` int DEFAULT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `write` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_permission`
--

LOCK TABLES `_permission` WRITE;
/*!40000 ALTER TABLE `_permission` DISABLE KEYS */;
INSERT INTO `_permission` VALUES (1,'2023-11-23 11:29:49.864','2023-11-23 11:29:49.864',1,2,NULL,1,0),(2,'2023-11-23 11:29:49.875','2023-11-23 11:29:49.875',3,2,NULL,1,0),(3,'2023-11-23 11:29:49.885','2023-11-23 11:29:49.885',2,2,NULL,1,0),(4,'2023-11-23 11:29:49.895','2023-11-23 11:29:49.895',4,2,NULL,1,0),(5,'2023-11-23 11:29:49.906','2023-11-23 11:29:49.906',5,2,NULL,1,0),(6,'2023-11-23 11:29:49.970','2023-11-23 11:29:49.970',7,2,NULL,1,0);
/*!40000 ALTER TABLE `_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_registry`
--

DROP TABLE IF EXISTS `_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_registry` (
  `key` varchar(63) NOT NULL,
  `value` text,
  PRIMARY KEY (`key`),
  UNIQUE KEY `_registry_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_registry`
--

LOCK TABLES `_registry` WRITE;
/*!40000 ALTER TABLE `_registry` DISABLE KEYS */;
INSERT INTO `_registry` VALUES ('test','test'),('version','0.5.5-beta');
/*!40000 ALTER TABLE `_registry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_role`
--

DROP TABLE IF EXISTS `_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_role` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `role` varchar(63) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `_role_role_unique` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_role`
--

LOCK TABLES `_role` WRITE;
/*!40000 ALTER TABLE `_role` DISABLE KEYS */;
INSERT INTO `_role` VALUES (1,'2023-11-23 11:29:49.838','2023-11-23 11:29:49.838','administrator'),(2,'2023-11-23 11:29:49.856','2023-11-23 11:29:49.856','user');
/*!40000 ALTER TABLE `_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_role__user`
--

DROP TABLE IF EXISTS `_role__user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_role__user` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `_role_id` int unsigned NOT NULL,
  `_user_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `_role__user__role_id_foreign` (`_role_id`),
  KEY `_role__user__user_id_foreign` (`_user_id`),
  CONSTRAINT `_role__user__role_id_foreign` FOREIGN KEY (`_role_id`) REFERENCES `_role` (`id`),
  CONSTRAINT `_role__user__user_id_foreign` FOREIGN KEY (`_user_id`) REFERENCES `_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_role__user`
--

LOCK TABLES `_role__user` WRITE;
/*!40000 ALTER TABLE `_role__user` DISABLE KEYS */;
INSERT INTO `_role__user` VALUES (1,1,1),(2,2,2);
/*!40000 ALTER TABLE `_role__user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_user`
--

DROP TABLE IF EXISTS `_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_user` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `email` varchar(320) NOT NULL,
  `username` varchar(63) NOT NULL,
  `password` varchar(96) NOT NULL,
  `last_login_at` timestamp(3) NULL DEFAULT NULL,
  `last_password_change_at` timestamp(3) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `_user_email_unique` (`email`),
  UNIQUE KEY `_user_username_unique` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_user`
--

LOCK TABLES `_user` WRITE;
/*!40000 ALTER TABLE `_user` DISABLE KEYS */;
INSERT INTO `_user` VALUES (1,'2023-11-23 11:29:49.824','2023-11-23 13:34:20.423','admin@cms.local','admin','$2b$10$/zsPVCnU6KsFaRSd94ZyY.:$2b$10$/zsPVCnU6KsFaRSd94ZyY./MbsrByTYqk5qHRvbWgyXUXbXAUMZzy','2023-11-23 13:34:20.423',NULL),(2,'2023-11-23 11:31:06.442','2023-11-23 11:31:08.643','-','user','$2b$10$lG7UOFs0.arFhB.bpHMk5e:$2b$10$lG7UOFs0.arFhB.bpHMk5eqBDNyMCqyHRLzLltYox2T3iJVb2DZOO','2023-11-23 11:31:08.643',NULL);
/*!40000 ALTER TABLE `_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movie`
--

DROP TABLE IF EXISTS `movie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movie`
--

LOCK TABLES `movie` WRITE;
/*!40000 ALTER TABLE `movie` DISABLE KEYS */;
INSERT INTO `movie` VALUES (1,'2023-11-23 11:30:23.410','2023-11-23 11:30:23.410','TestMovie');
/*!40000 ALTER TABLE `movie` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movie_star`
--

DROP TABLE IF EXISTS `movie_star`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_star` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `star_id` int unsigned NOT NULL,
  `movie_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `movie_star_star_id_foreign` (`star_id`),
  KEY `movie_star_movie_id_foreign` (`movie_id`),
  CONSTRAINT `movie_star_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`),
  CONSTRAINT `movie_star_star_id_foreign` FOREIGN KEY (`star_id`) REFERENCES `star` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movie_star`
--

LOCK TABLES `movie_star` WRITE;
/*!40000 ALTER TABLE `movie_star` DISABLE KEYS */;
INSERT INTO `movie_star` VALUES (1,1,1);
/*!40000 ALTER TABLE `movie_star` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `star`
--

DROP TABLE IF EXISTS `star`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `star` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` timestamp(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `name` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `star`
--

LOCK TABLES `star` WRITE;
/*!40000 ALTER TABLE `star` DISABLE KEYS */;
INSERT INTO `star` VALUES (1,'2023-11-23 11:30:37.057','2023-11-23 11:30:37.057','John Doe',NULL),(2,'2023-11-23 11:30:47.164','2023-11-23 11:30:47.164','Jane Doe',NULL);
/*!40000 ALTER TABLE `star` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-11-23 14:34:22
