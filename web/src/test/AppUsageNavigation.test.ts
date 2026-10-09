import { describe, expect, it } from 'vitest';
import { getRoleHomePath, getRoleTargetPath, shouldNormalizeRolePath } from '../App';

describe('App usage-page route authorization', () => {
  it('normalizes restored admin sessions away from the API Key viewer route', () => {
    expect(getRoleHomePath('admin')).toBe('/');
    expect(shouldNormalizeRolePath('admin', '/key-overview')).toBe(true);
    expect(shouldNormalizeRolePath('admin', '/')).toBe(false);
  });

  it('normalizes restored API Key viewer sessions to the key overview route', () => {
    expect(getRoleHomePath('api_key_viewer')).toBe('/key-overview');
    expect(shouldNormalizeRolePath('api_key_viewer', '/')).toBe(true);
    expect(shouldNormalizeRolePath('api_key_viewer', '/key-overview')).toBe(false);
  });

  it('allows only known usage routes for administrators', () => {
    expect(getRoleTargetPath('admin', '/')).toBe('/');
    expect(getRoleTargetPath('admin', '/auth-files')).toBe('/auth-files');
    expect(getRoleTargetPath('admin', '/auth-files/')).toBe('/');
    expect(shouldNormalizeRolePath('admin', '/auth-files/')).toBe(true);
    expect(getRoleTargetPath('admin', '/request-events')).toBe('/request-events');
    expect(getRoleTargetPath('admin', '/auth-files/settings')).toBe('/');
    expect(getRoleTargetPath('admin', '//example.com/auth-files')).toBe('/');
  });

  it('keeps API key viewers isolated from administrator routes', () => {
    expect(getRoleTargetPath('api_key_viewer', '/auth-files')).toBe('/key-overview');
    expect(shouldNormalizeRolePath('api_key_viewer', '/auth-files')).toBe(true);
    expect(shouldNormalizeRolePath('api_key_viewer', '/key-overview')).toBe(false);
    expect(getRoleTargetPath('api_key_viewer', '/key-analysis')).toBe('/key-analysis');
    expect(shouldNormalizeRolePath('api_key_viewer', '/key-analysis')).toBe(false);
    expect(getRoleTargetPath('api_key_viewer', '/key-analysis/')).toBe('/key-overview');
    expect(getRoleTargetPath('api_key_viewer', '//example.com/key-analysis')).toBe('/key-overview');
  });

  it('returns each role to its home for removed ranking routes', () => {
    for (const path of ['/ranking', '/key-ranking']) {
      expect(getRoleTargetPath('admin', path)).toBe('/');
      expect(shouldNormalizeRolePath('admin', path)).toBe(true);
      expect(getRoleTargetPath('api_key_viewer', path)).toBe('/key-overview');
      expect(shouldNormalizeRolePath('api_key_viewer', path)).toBe(true);
    }
  });
});
