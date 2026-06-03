import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProjectUserAttributes {
  id: number;
  projectId: number;
  userId: number;
  assignedAt?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectUserCreationAttributes
  extends Optional<ProjectUserAttributes, 'id' | 'isActive' | 'assignedAt'> {}

class ProjectUser
  extends Model<ProjectUserAttributes, ProjectUserCreationAttributes>
  implements ProjectUserAttributes
{
  public id!: number;
  public projectId!: number;
  public userId!: number;
  public assignedAt?: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'ProjectUser',
    tableName: 'project_users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['projectId', 'userId'],
      },
      {
        fields: ['userId'],
      },
    ],
  }
);

export default ProjectUser;
