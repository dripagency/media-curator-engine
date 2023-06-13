'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
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
