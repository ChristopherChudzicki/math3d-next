import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../database";

// These are all the attributes in the User model
interface UserAttributes {
  id: number;
  email: string;
}

type UserCreationAttributes = Optional<UserAttributes, "id">;

export default class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number; // Note that the `null assertion` `!` is required in strict mode.

  public name!: string;

  public email!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: new DataTypes.STRING(128),
    },
  },
  {
    tableName: "users",
    sequelize, // passing the `sequelize` instance is required
  }
);
