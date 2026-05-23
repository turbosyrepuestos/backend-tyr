import { ApiKeyGuard } from './x-api-key.guard';
import { ApiKeyService } from '../../../common/utils/apikey/apikey.service';

describe('ApiKeyGuard', () => {
  it('should be defined', () => {
    expect(new ApiKeyGuard({} as ApiKeyService)).toBeDefined();
  });
});
