'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      bio: {
        type: Sequelize.TEXT
      },
      profilePicture: {
        type: Sequelize.STRING
      },
      website: {
        type: Sequelize.STRING
      },
      instagram: {
        type: Sequelize.STRING
      },
      tiktok: {
        type: Sequelize.STRING
      },
      youtube: {
        type: Sequelize.STRING
      },
      bandcamp: {
        type: Sequelize.STRING
      },
      spotify: {
        type: Sequelize.STRING
      },
      tokens: {
        type: Sequelize.INTEGER
      },
      role: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};
