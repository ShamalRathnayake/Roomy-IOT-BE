import { UserRole } from '../../shared/types/roles.enum';

export const permissions = {
  getSensorData: {
    path: '/',
    grantedUserRoles: [UserRole.USER],
  },
};
