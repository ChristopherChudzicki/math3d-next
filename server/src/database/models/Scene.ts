import { Model, Optional, DataTypes, literal } from "sequelize";
import sequelize from "../database";

// These are all the attributes in the User model
interface SceneAttributes {
  id: number;
  publicId: string;
  title: string;
  items: unknown[];
  sortableTree: Record<string, string[]>;
  timesAccessed: number;
  lastAccessed: number;
}

type UserCreationAttributes = Optional<
  SceneAttributes,
  "id" | "publicId" | "timesAccessed" | "lastAccessed"
>;

export default class Scene
  extends Model<SceneAttributes, UserCreationAttributes>
  implements SceneAttributes
{
  public id!: number;

  public publicId!: string;

  public title!: string;

  public items!: unknown[];

  public sortableTree!: Record<string, string[]>;

  public timesAccessed!: number;

  public lastAccessed!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  static findByPublicId(publicId: string): Promise<Scene | null> {
    return Scene.findOne({ where: { publicId } });
  }
}

Scene.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    publicId: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    sortableTree: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    timesAccessed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastAccessed: {
      type: "TIMESTAMP WITH TIME ZONE",
      defaultValue: literal("CURRENT_TIMESTAMP"),
      allowNull: false,
    },
  },
  {
    tableName: "scenes",
    sequelize,
  }
);
