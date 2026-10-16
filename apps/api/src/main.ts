import { createApplication } from './app';

async function main() {
  const port = Number(process.env.API_PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid API_PORT');
  const app = await createApplication();
  app.enableShutdownHooks();
  await app.listen(port, process.env.API_HOST ?? '127.0.0.1');
  process.stdout.write(`Apree API listening on port ${port}\n`);
}

void main().catch(() => {
  process.stderr.write('API startup failed. Check configuration and database.\n');
  process.exit(1);
});
