import { Model, Optional, DataTypes } from "sequelize";
import sequelize from "../database";

// These are all the attributes in the User model
interface UserAttributes {
  id: number;
  publicId: string;
  username: string;
  email: string;
}

type UserCreationAttributes = Optional<UserAttributes, "id" | "publicId">;

export default class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number; // Note that the `null assertion` `!` is required in strict mode.

  public publicId!: string;

  public username!: string;

  public email!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  static findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    username: {
      type: new DataTypes.TEXT(),
      unique: true,
      allowNull: false,
    },
    email: {
      type: new DataTypes.TEXT(),
      unique: true,
      allowNull: false,
    },
  },
  {
    tableName: "users",
    sequelize,
  }
);
