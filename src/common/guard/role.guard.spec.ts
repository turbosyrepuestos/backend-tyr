import { UserRoleGuard } from './role.guard';
import { Reflector } from '@nestjs/core';

describe('UserRoleGuard', () => {
  it('should be defined', () => {
    expect(new UserRoleGuard(new Reflector())).toBeDefined();
  });
});
