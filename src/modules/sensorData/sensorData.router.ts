import { Router } from 'express';

import { ValidatorService } from '../../shared/services/validator.service';
import { validationSource } from '../../shared/types/validationSource.enum';
import { permissions } from './sensorData.permissions';
import { getSensorDataSchema } from './sensorData.schema';
import { getSensorData } from './sensorData.controller';

const router = Router();

router.get(
  permissions.getSensorData.path,
  ValidatorService.validate(
    validationSource.headers,
    undefined,
    permissions.getSensorData.grantedUserRoles
  ),
  ValidatorService.validate(validationSource.query, getSensorDataSchema),
  getSensorData
);

export default router;
