import { User } from '@prisma/client';
import * as express from 'express';

declare module 'express' {
  interface Request {
    user?: User;
  }
}
