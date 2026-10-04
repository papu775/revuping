import { ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistrationVerificationException } from './registration-verification.exception';
import type { DatabaseService } from '../infrastructure/database.service';
import type { EmailService } from './email.service';
import { registrationSuccessMessage } from 'api-contracts';

jest.mock('./credentials', () => ({
  credential: () => 'a'.repeat(43),
  digest: () => 'digest',
  hashPassword: async () => 'hash',
}));

describe('registration outcomes', () => {
  const input = {
    email: 'test@example.test',
    displayName: 'Test',
    password: 'a long test passphrase',
  };
  function setup() {
    const db = {
      user: {
        create: jest.fn(async () => ({ id: 'user', email: input.email })),
      },
      emailActionToken: {
        create: jest.fn(async () => ({ id: 'action' })),
        delete: jest.fn(async () => undefined),
      },
    };
    const email = {
      ready: jest.fn(async () => undefined),
      send: jest.fn(async () => undefined),
    };
    const service = new AuthService(
      { client: db } as unknown as DatabaseService,
      email as unknown as EmailService,
    );
    return { service, db, email };
  }
  it('confirms success only after verification SMTP acceptance', async () => {
    const { service, email } = setup();
    await expect(service.register(input)).resolves.toEqual({
      message: registrationSuccessMessage,
    });
    expect(email.send).toHaveBeenCalledTimes(1);
  });
  it('returns the same public result for an existing email without replacing its password', async () => {
    const { service, db, email } = setup();
    db.user.create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(service.register(input)).resolves.toEqual({
      message: registrationSuccessMessage,
    });
    expect(email.send).not.toHaveBeenCalled();
  });
  it('does not claim an account exists when SMTP readiness fails before creation', async () => {
    const { service, db, email } = setup();
    email.ready.mockRejectedValue(new ServiceUnavailableException());
    const error = await service.register(input).catch((error) => error);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(error).not.toBeInstanceOf(RegistrationVerificationException);
    expect(db.user.create).not.toHaveBeenCalled();
  });
  it('reports account creation accurately and deletes the unsent token when delivery fails', async () => {
    const { service, db, email } = setup();
    email.send.mockRejectedValue(new Error('private SMTP credentials'));
    await expect(service.register(input)).rejects.toBeInstanceOf(
      RegistrationVerificationException,
    );
    expect(db.user.create).toHaveBeenCalledTimes(1);
    expect(db.emailActionToken.delete).toHaveBeenCalledWith({
      where: { id: 'action' },
    });
  });
});
