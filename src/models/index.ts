import User from './User';
import Project from './Project';
import ProjectUser from './ProjectUser';
import Task from './Task';
import Comment from './Comment';

// ─── İlişki Tanımları ───────────────────────────────────────────────────────

// Proje - Admin (oluşturan)
Project.belongsTo(User, {
  foreignKey: 'createdByAdminId',
  as: 'admin',
});
User.hasMany(Project, {
  foreignKey: 'createdByAdminId',
  as: 'createdProjects',
});

// Proje ↔ Kullanıcı (M:N — project_users aracılığıyla)
Project.belongsToMany(User, {
  through: ProjectUser,
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members',
});
User.belongsToMany(Project, {
  through: ProjectUser,
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'projects',
});

// ProjectUser direkt ilişkiler
ProjectUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProjectUser.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
User.hasMany(ProjectUser, { foreignKey: 'userId', as: 'projectAssignments' });
Project.hasMany(ProjectUser, { foreignKey: 'projectId', as: 'projectUsers' });

// Görev - Proje
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });

// Görev - Atanan Kullanıcı
Task.belongsTo(User, { foreignKey: 'assignedUserId', as: 'assignedUser' });
User.hasMany(Task, { foreignKey: 'assignedUserId', as: 'assignedTasks' });

// Yorum - Görev
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });

// Yorum - Kullanıcı
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

export { User, Project, ProjectUser, Task, Comment };
