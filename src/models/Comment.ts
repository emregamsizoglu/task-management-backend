import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CommentAttributes {
  id: number;
  taskId: number;
  userId: number;
  comment: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CommentCreationAttributes
  extends Optional<CommentAttributes, 'id' | 'isActive'> {}

class Comment
  extends Model<CommentAttributes, CommentCreationAttributes>
  implements CommentAttributes
{
  public id!: number;
  public taskId!: number;
  public userId!: number;
  public comment!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Comment',
    tableName: 'comment',
    timestamps: true,
  }
);

export default Comment;
