import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TaskStatus = 'Open' | 'InProgress' | 'Done';

export interface TaskAttributes {
  id: number;
  projectId: number;
  assignedUserId?: number | null;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskCreationAttributes
  extends Optional<
    TaskAttributes,
    | 'id'
    | 'isActive'
    | 'description'
    | 'assignedUserId'
    | 'status'
    | 'dueDate'
    | 'startedAt'
    | 'completedAt'
  > {}

class Task
  extends Model<TaskAttributes, TaskCreationAttributes>
  implements TaskAttributes
{
  public id!: number;
  public projectId!: number;
  public assignedUserId?: number | null;
  public title!: string;
  public description?: string;
  public status!: TaskStatus;
  public dueDate?: Date;
  public startedAt?: Date | null;
  public completedAt?: Date | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
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
    assignedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Open', 'InProgress', 'Done'),
      allowNull: false,
      defaultValue: 'Open',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
    indexes: [
      { fields: ['projectId'] },
      { fields: ['assignedUserId'] },
      { fields: ['projectId', 'status'] },
    ],
    hooks: {
      // Status değişince startedAt / completedAt otomatik set et
      beforeUpdate: (task) => {
        if (task.changed('status')) {
          const newStatus = task.status;
          if (newStatus === 'InProgress' && !task.startedAt) {
            task.startedAt = new Date();
          }
          if (newStatus === 'Done' && !task.completedAt) {
            task.completedAt = new Date();
          }
          if (newStatus === 'Open') {
            task.startedAt = null;
            task.completedAt = null;
          }
        }
      },
    },
  }
);

export default Task;
