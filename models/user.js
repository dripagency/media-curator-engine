'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    bio: DataTypes.TEXT,
    profilePicture: DataTypes.STRING,
    website: DataTypes.STRING,
    instagram: DataTypes.STRING,
    tiktok: DataTypes.STRING,
    youtube: DataTypes.STRING,
    bandcamp: DataTypes.STRING,
    spotify: DataTypes.STRING,
    tokens: DataTypes.INTEGER,
    role: DataTypes.STRING,
    status: DataTypes.STRING

  }, {});

  User.associate = function(models) {
    User.hasMany(models.Note, {
      foreignKey: 'userId',
      as: 'Notes',
      onDelete: 'CASCADE',
    });
  };

  return User;
};
