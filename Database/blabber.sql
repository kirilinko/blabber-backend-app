-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : lun. 03 juil. 2023 à 06:59
-- Version du serveur : 8.0.30
-- Version de PHP : 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `blabber`
--

-- --------------------------------------------------------

--
-- Structure de la table `contacts`
--

CREATE TABLE `contacts` (
  `id` int NOT NULL,
  `userid1` int DEFAULT NULL,
  `userid2` int DEFAULT NULL,
  `blockedUserid1` tinyint(1) DEFAULT NULL,
  `blockedUserid2` tinyint(1) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `discussions`
--

CREATE TABLE `discussions` (
  `id` int NOT NULL,
  `tag` varchar(50) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `emodjis`
--

CREATE TABLE `emodjis` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `emodji` varchar(255) NOT NULL,
  `messageId` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `files`
--

CREATE TABLE `files` (
  `id` int NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `pathUrl` varchar(255) NOT NULL,
  `size` int NOT NULL,
  `messageId` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `lastmessages`
--

CREATE TABLE `lastmessages` (
  `id_lastMessage` int NOT NULL,
  `discussionId` int NOT NULL,
  `messageId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int NOT NULL,
  `senderId` int DEFAULT NULL,
  `receiverDiscussionId` int DEFAULT NULL,
  `responseToMsgId` int DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `participants`
--

CREATE TABLE `participants` (
  `id` int NOT NULL,
  `userId` int NOT NULL,
  `isAdmin` tinyint(1) NOT NULL,
  `addedAt` datetime NOT NULL,
  `hasNewNotif` tinyint(1) NOT NULL,
  `isArchivedChat` tinyint(1) NOT NULL,
  `discussionId` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `requests`
--

CREATE TABLE `requests` (
  `id` int NOT NULL,
  `senderId` int DEFAULT NULL,
  `receiverId` int DEFAULT NULL,
  `accepted` tinyint(1) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `photoUrl` varchar(255) DEFAULT NULL,
  `createdAt` date DEFAULT NULL,
  `updatedAt` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid1` (`userid1`),
  ADD KEY `userid2` (`userid2`);

--
-- Index pour la table `discussions`
--
ALTER TABLE `discussions`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `emodjis`
--
ALTER TABLE `emodjis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messageId` (`messageId`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messageId` (`messageId`);

--
-- Index pour la table `lastmessages`
--
ALTER TABLE `lastmessages`
  ADD PRIMARY KEY (`id_lastMessage`),
  ADD KEY `discussionId` (`discussionId`),
  ADD KEY `messageId` (`messageId`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `senderId` (`senderId`),
  ADD KEY `receiverDiscussionId` (`receiverDiscussionId`),
  ADD KEY `responseToMsgId` (`responseToMsgId`);

--
-- Index pour la table `participants`
--
ALTER TABLE `participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `discussionId` (`discussionId`);

--
-- Index pour la table `requests`
--
ALTER TABLE `requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `senderId` (`senderId`),
  ADD KEY `receiverId` (`receiverId`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `discussions`
--
ALTER TABLE `discussions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `emodjis`
--
ALTER TABLE `emodjis`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `files`
--
ALTER TABLE `files`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `lastmessages`
--
ALTER TABLE `lastmessages`
  MODIFY `id_lastMessage` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `participants`
--
ALTER TABLE `participants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `requests`
--
ALTER TABLE `requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`userid1`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `contacts_ibfk_2` FOREIGN KEY (`userid2`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `emodjis`
--
ALTER TABLE `emodjis`
  ADD CONSTRAINT `emodjis_ibfk_1` FOREIGN KEY (`messageId`) REFERENCES `messages` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `emodjis_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `files_ibfk_1` FOREIGN KEY (`messageId`) REFERENCES `messages` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `lastmessages`
--
ALTER TABLE `lastmessages`
  ADD CONSTRAINT `lastmessages_ibfk_1` FOREIGN KEY (`discussionId`) REFERENCES `discussions` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `lastmessages_ibfk_2` FOREIGN KEY (`messageId`) REFERENCES `messages` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiverDiscussionId`) REFERENCES `discussions` (`id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`responseToMsgId`) REFERENCES `messages` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `participants`
--
ALTER TABLE `participants`
  ADD CONSTRAINT `participants_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `participants_ibfk_2` FOREIGN KEY (`discussionId`) REFERENCES `discussions` (`id`);

--
-- Contraintes pour la table `requests`
--
ALTER TABLE `requests`
  ADD CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
