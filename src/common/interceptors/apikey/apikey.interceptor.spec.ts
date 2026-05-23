import { ApiKeyInterceptor } from './apikey.interceptor';

describe('ApiKeyInterceptor', () => {
  it('should be defined', () => {
    expect(new ApiKeyInterceptor()).toBeDefined();
  });
});
