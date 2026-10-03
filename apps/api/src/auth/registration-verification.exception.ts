import { ServiceUnavailableException } from '@nestjs/common';

// Only issued after this request has created the account. Contains no provider details.
export class RegistrationVerificationException extends ServiceUnavailableException {}
