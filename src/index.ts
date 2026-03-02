import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors';
import { autoload } from "elysia-autoload";
import { openapi } from '@elysiajs/openapi';
import { jwt } from '@elysiajs/jwt';
import 'dotenv/config';

const key = process.env.securityKEY as string;

const ElysiaApp = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: key
    })
  )
  .use(cors({
    origin: '*'
  }))
  .use(openapi({
    path: '/document'
  }))
  .use(await autoload())
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${ElysiaApp.server?.hostname}:${ElysiaApp.server?.port}`
);

export type ElysiaApp = typeof ElysiaApp;